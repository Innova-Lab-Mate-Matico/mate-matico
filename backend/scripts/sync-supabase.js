import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Cargar variables de entorno (con cascada de .env.local)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Si se fuerza producción, eliminamos las variables del emulador cargadas desde .env.local
if (process.env.FORCE_PRODUCTION === 'true') {
  delete process.env.FIRESTORE_EMULATOR_HOST;
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
}

// 2. Importaciones dinámicas para evitar inicializaciones tempranas de Firebase
const { db } = await import('../src/config/firebase.js');
const pg = (await import('pg')).default;
const { moduleCatalog } = await import('../src/data/moduleCatalog.js');
const { LECCION_GENERADORES } = await import('../src/exercises/registry.js');

// Forzar al driver 'pg' a parsear fechas TIMESTAMP WITH TIME ZONE (OID: 1184) en UTC directamente en JS
pg.types.setTypeParser(1184, stringVal => new Date(stringVal));

const BATCH_SIZE = process.env.LIMIT_TEST ? Number(process.env.LIMIT_TEST) : 500;
const DRY_RUN = process.env.DRY_RUN === 'true';
const ADVISORY_LOCK_ID = 987654321; // Exclusión mutua

// Función auxiliar para transformar Timestamps de Firestore en objetos Date válidos para pg
function resolveFirestoreDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
}

async function runSync() {
  console.log(`[ETL] Iniciando sincronización a Supabase... [DRY_RUN: ${DRY_RUN}] [LIMIT_TEST: ${process.env.LIMIT_TEST || 'Sin límite'}]`);
  
  if (!process.env.SUPABASE_DB_URL) {
    console.error('[ETL Error] La variable de entorno SUPABASE_DB_URL no está definida.');
    process.exit(1);
  }

  let client;

  try {
    client = new pg.Client({
      connectionString: process.env.SUPABASE_DB_URL,
      connectionTimeoutMillis: 10000,
    });

    await client.connect();

    // 1. Obtener Advisory Lock
    const lockResult = await client.query('SELECT pg_try_advisory_lock($1) AS got_lock', [ADVISORY_LOCK_ID]);
    if (!lockResult.rows[0].got_lock) {
      console.log('[ETL] Ya existe otra instancia de este script en ejecución. Abortando.');
      return;
    }

    const watermarkRef = db.collection('control_etl').doc('analytics_watermark_supabase');
    const watermarkDoc = await watermarkRef.get();
    
    let lastSyncedTimestamp = '1970-01-01T00:00:00.000Z';
    if (watermarkDoc.exists && !process.env.LIMIT_TEST) { // Ignorar watermark para tests puntuales
      const storedTimestamp = watermarkDoc.data().last_synced_timestamp;
      if (storedTimestamp) {
        lastSyncedTimestamp = storedTimestamp;
      }
    }

    // Colchón de 2 minutos para contrarrestar latencias de red y asincronía
    const startTime = new Date(new Date(lastSyncedTimestamp).getTime() - 2 * 60 * 1000).toISOString();
    console.log(`[ETL] Sincronizando desde: ${startTime} (Watermark real: ${lastSyncedTimestamp})`);

    // 1.5. Sincronizar catálogo estático (Módulos, Lecciones y Ejercicios) antes de procesar eventos
    console.log('[ETL] Sincronizando catálogo estático (módulos, lecciones y ejercicios)...');
    await client.query('BEGIN');
    try {
      for (const m of moduleCatalog) {
        await client.query(`
          INSERT INTO modulos (modulo_id, nombre)
          VALUES ($1, $2)
          ON CONFLICT (modulo_id) DO UPDATE SET nombre = EXCLUDED.nombre;
        `, [m.id, m.title]);

        for (const level of m.levels) {
          for (const l of level.lessons) {
            await client.query(`
              INSERT INTO lecciones (leccion_id, modulo_id, nombre)
              VALUES ($1, $2, $3)
              ON CONFLICT (leccion_id) DO UPDATE SET 
                modulo_id = EXCLUDED.modulo_id,
                nombre = EXCLUDED.nombre;
            `, [l.id, m.id, l.title]);

            const exercises = LECCION_GENERADORES[m.id]?.[l.id] || [];
            const difficultyMap = { 1: 'bajo', 2: 'medio', 3: 'alto' };
            const difficultyStr = difficultyMap[level.difficulty] || 'bajo';

            for (const exId of exercises) {
              await client.query(`
                INSERT INTO ejercicios (ejercicio_id, leccion_id, dificultad)
                VALUES ($1, $2, $3)
                ON CONFLICT (ejercicio_id) DO UPDATE SET
                  leccion_id = EXCLUDED.leccion_id,
                  dificultad = EXCLUDED.dificultad;
              `, [exId, l.id, difficultyStr]);
            }
          }
        }
      }
      await client.query('COMMIT');
      console.log('[ETL] Catálogo estático sincronizado con éxito.');
    } catch (catalogError) {
      await client.query('ROLLBACK');
      console.error('[ETL Error] Falló la sincronización del catálogo estático:', catalogError);
      throw catalogError;
    }

    let lastDoc = null;
    let maxTimestamp = lastSyncedTimestamp;
    let hasMore = true;
    let totalProcessed = 0;

    while (hasMore) {
      let query = db.collection('eventos')
        .where('fecha_hora', '>=', startTime)
        .orderBy('fecha_hora', 'asc')
        .limit(BATCH_SIZE);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        console.log('[ETL] No hay nuevos eventos en este lote.');
        hasMore = false;
        break;
      }

      const lastEventTimestamp = snapshot.docs[snapshot.docs.length - 1].data().fecha_hora || '';
      if (lastEventTimestamp <= lastSyncedTimestamp && !process.env.LIMIT_TEST) {
        console.log('[ETL] Todos los eventos del lote pertenecen al colchón de seguridad. Saliendo.');
        hasMore = false;
        break;
      }

      console.log(`[ETL] Procesando lote de ${snapshot.size} eventos...`);
      
      // ==========================================
      // FASE 1: LECTURAS A DE RED (FIRESTORE) - FUERA DE LA TRANSACCIÓN
      // ==========================================
      const userIds = [...new Set(snapshot.docs.map(doc => doc.data().usuario_id).filter(id => id))];
      
      // 1.1. Leer usuarios en batch
      const userPayloads = [];
      if (userIds.length > 0) {
        console.log(`[ETL] Leyendo datos de ${userIds.length} usuarios desde Firestore...`);
        const userRefs = userIds.map(id => db.collection('usuarios').doc(id));
        const userSnapshots = await db.getAll(...userRefs);

        for (const userDoc of userSnapshots) {
          if (userDoc.exists) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            const onboarding = userData.onboarding || {};
            const fechaRegistro = resolveFirestoreDate(userData.fecha_registro || userData.createdAt) || new Date();
            const ultimaConexion = resolveFirestoreDate(userData.ultima_conexion || userData.lastLoginAt) || new Date();
            const ultimaLeccion = resolveFirestoreDate(userData.ultimaLeccionCompletada);

            userPayloads.push({
              userId,
              nombre: userData.nombre || userData.displayName || null,
              email: userData.email || null,
              fotoUrl: userData.photoURL || null,
              proveedor: userData.provider || null,
              puntosTotales: userData.puntos_totales !== undefined ? Number(userData.puntos_totales) : 0,
              rolActual: userData.rolActual || 'principiante',
              temaActual: userData.tema_actual || null,
              nivelActual: userData.nivel_actual || null,
              porcentajeProgreso: userData.porcentaje_progreso !== undefined ? Number(userData.porcentaje_progreso) : 0,
              edad: onboarding.edad !== undefined ? Number(onboarding.edad) : null,
              nivelEducativo: onboarding.nivelEducativo || null,
              objetivo: onboarding.objetivo || null,
              confianzaMath: onboarding.confianzaMath !== undefined ? Number(onboarding.confianzaMath) : null,
              fechaRegistro,
              ultimaConexion,
              rachaActual: userData.racha_actual !== undefined ? Number(userData.racha_actual) : 0,
              recordRacha: userData.recordRacha !== undefined ? Number(userData.recordRacha) : 0,
              ultimaLeccion
            });
          }
        }
      }

      // 1.2. Leer progreso de lecciones en batch
      const userModulePairs = [];
      const userModuleKeys = new Set();

      snapshot.docs.forEach(doc => {
        const evData = doc.data();
        const userId = evData.usuario_id;
        const meta = evData.metadata || {};
        const moduleId = meta.tema;
        
        const isProgressTrigger = 
          evData.tipo_evento === 'leccion_completada' || 
          evData.tipo_evento === 'progreso_actualizado' || 
          (evData.tipo_evento === 'ejercicio_completado' && meta?.resultado === 'correcto');

        if (userId && moduleId && isProgressTrigger) {
          const key = `${userId}:${moduleId}`;
          if (!userModuleKeys.has(key)) {
            userModuleKeys.add(key);
            userModulePairs.push({ userId, moduleId });
          }
        }
      });

      const progressPayloads = [];
      if (userModulePairs.length > 0) {
        console.log(`[ETL] Leyendo progreso de ${userModulePairs.length} pares Usuario-Módulo en batch...`);
        const progressRefs = userModulePairs.map(pair => 
          db.collection('usuarios').doc(pair.userId).collection('progreso').doc(pair.moduleId)
        );
        const progressSnapshots = await db.getAll(...progressRefs);

        for (const progressDoc of progressSnapshots) {
          if (progressDoc.exists) {
            const moduleId = progressDoc.id;
            const userId = progressDoc.ref.parent.parent.id;
            const progData = progressDoc.data();
            const lecciones = progData.lecciones || progData.lessons || {};

            for (const [leccionId, leccionState] of Object.entries(lecciones)) {
               const actualizadoEn = resolveFirestoreDate(leccionState.actualizadoEn || leccionState.updatedAt) || new Date();
               progressPayloads.push({
                 userId,
                 moduleId,
                 leccionId,
                 completada: leccionState.completada || leccionState.completed || false,
                 puntaje: leccionState.puntaje || leccionState.score || 0,
                 actualizadoEn
               });
            }
          }
        }
      }

      // ==========================================
      // FASE 2: INSERCIÓN EN POSTGRES (TRANSACCIÓN RÁPIDA)
      // ==========================================
      console.log('[ETL] Iniciando transacción Postgres para guardado...');
      await client.query('BEGIN');

      // 2.1. Guardar usuarios y sus rachas
      for (const u of userPayloads) {
        const userParams = [
          u.userId, u.nombre, u.email, u.fotoUrl, u.proveedor, u.puntosTotales,
          u.rolActual, u.temaActual, u.nivelActual, u.porcentajeProgreso,
          u.edad, u.nivelEducativo, u.objetivo, u.confianzaMath, u.fechaRegistro, u.ultimaConexion
        ];

        await client.query(`
          INSERT INTO usuarios (
            usuario_id, nombre, email, foto_url, proveedor, puntos_totales,
            rol_actual, tema_actual, nivel_actual, porcentaje_progreso,
            edad, nivel_educativo, objetivo, confianza_math, fecha_registro, ultima_conexion, actualizado_en
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
          ON CONFLICT (usuario_id) DO UPDATE SET
            nombre = COALESCE(EXCLUDED.nombre, usuarios.nombre),
            email = COALESCE(EXCLUDED.email, usuarios.email),
            foto_url = COALESCE(EXCLUDED.foto_url, usuarios.foto_url),
            proveedor = COALESCE(EXCLUDED.proveedor, usuarios.proveedor),
            puntos_totales = EXCLUDED.puntos_totales,
            rol_actual = EXCLUDED.rol_actual,
            tema_actual = EXCLUDED.tema_actual,
            nivel_actual = EXCLUDED.nivel_actual,
            porcentaje_progreso = EXCLUDED.porcentaje_progreso,
            edad = COALESCE(EXCLUDED.edad, usuarios.edad),
            nivel_educativo = COALESCE(EXCLUDED.nivel_educativo, usuarios.nivel_educativo),
            objetivo = COALESCE(EXCLUDED.objetivo, usuarios.objetivo),
            confianza_math = COALESCE(EXCLUDED.confianza_math, usuarios.confianza_math),
            ultima_conexion = EXCLUDED.ultima_conexion,
            actualizado_en = NOW();
        `, userParams);

        // Guardar Racha
        const rachaParams = [u.userId, u.rachaActual, u.recordRacha, u.ultimaLeccion];
        await client.query(`
          INSERT INTO rachas (usuario_id, racha_actual, record_racha, ultima_leccion_completada, actualizado_en)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (usuario_id) DO UPDATE SET
            racha_actual = EXCLUDED.racha_actual,
            record_racha = EXCLUDED.record_racha,
            ultima_leccion_completada = EXCLUDED.ultima_leccion_completada,
            actualizado_en = NOW();
        `, rachaParams);
      }

      // 2.2. Guardar progreso
      for (const p of progressPayloads) {
        const progParams = [p.userId, p.moduleId, p.leccionId, p.completada, p.puntaje, p.actualizadoEn];
        await client.query(`
          INSERT INTO progreso_lecciones (usuario_id, modulo_id, leccion_id, completada, puntaje, actualizado_en)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (usuario_id, modulo_id, leccion_id) DO UPDATE SET
            completada = EXCLUDED.completada,
            puntaje = EXCLUDED.puntaje,
            actualizado_en = EXCLUDED.actualizado_en;
        `, progParams);
      }

      // 2.3. Guardar eventos y sesiones
      for (const doc of snapshot.docs) {
        const eventId = doc.id;
        const data = doc.data();
        const meta = data.metadata || {};
        const eventDateStr = data.fecha_hora || new Date().toISOString();

        const nowStr = new Date().toISOString();
        if (eventDateStr > maxTimestamp && eventDateStr <= nowStr) {
          maxTimestamp = eventDateStr;
        }

        const sqlParams = [
          eventId,
          data.usuario_id || null,
          data.tipo_evento || 'desconocido',
          meta.tema || null,
          meta.subtema || null,
          meta.ejercicio_id || null,
          meta.tiempo_segundos !== undefined ? Number(meta.tiempo_segundos) : null,
          meta.resultado || null,
          meta.intentos !== undefined ? Number(meta.intentos) : null,
          meta.puntaje !== undefined ? Number(meta.puntaje) : null,
          JSON.stringify(meta),
          eventDateStr
        ];

        await client.query(`
          INSERT INTO eventos (
            evento_id, usuario_id, tipo_evento, modulo, leccion, 
            ejercicio, tiempo_segundos, resultado, intentos, puntaje, metadata, fecha
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (evento_id) DO UPDATE SET
            tipo_evento = EXCLUDED.tipo_evento,
            resultado = EXCLUDED.resultado,
            intentos = EXCLUDED.intentos,
            puntaje = EXCLUDED.puntaje,
            metadata = EXCLUDED.metadata;
        `, sqlParams);

        if (data.tipo_evento === 'usuario_inicio_sesion' && data.usuario_id) {
          const sessionParams = [eventId, data.usuario_id, eventDateStr, meta.proveedor || 'password'];
          await client.query(`
            INSERT INTO sesiones (sesion_id, usuario_id, fecha_inicio, proveedor)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (sesion_id) DO NOTHING;
          `, sessionParams);
        }
      }

      // ==========================================
      // FASE 3: CIERRE (COMMIT O ROLLBACK SEGÚN MODO)
      // ==========================================
      if (DRY_RUN) {
        console.log('[ETL - DRY_RUN] Simulación completa. Ejecutando ROLLBACK para no afectar la DB.');
        await client.query('ROLLBACK');
      } else {
        await client.query('COMMIT');
        
        // Guardar Watermark en Firestore
        if (!process.env.LIMIT_TEST) {
          await watermarkRef.set({ 
            last_synced_timestamp: maxTimestamp,
            actualizado_en: new Date().toISOString()
          }, { merge: true });
        }
        console.log(`[ETL] Lote guardado con éxito en Postgres. Watermark actualizado: ${maxTimestamp}`);
      }

      totalProcessed += snapshot.size;
      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      // Salir si era un test limitado o no hay más
      if (process.env.LIMIT_TEST || snapshot.size < BATCH_SIZE) {
        hasMore = false;
      }
    }

    console.log(`[ETL] Sincronización completada con éxito. Total eventos leídos: ${totalProcessed}`);

  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('[ETL Error] Falló el rollback:', rollbackError);
      }
    }
    console.error('[ETL Error] Error crítico durante la sincronización:', error);
  } finally {
    if (client) {
      try {
        await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_ID]);
      } catch (unlockError) {
        console.error('[ETL Error] Error al liberar advisory lock:', unlockError);
      }
      await client.end();
      console.log('[ETL] Conexión a Supabase cerrada.');
    }
  }
}

runSync().catch(console.error);
