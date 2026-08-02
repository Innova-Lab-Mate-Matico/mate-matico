import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Cargar variables de entorno (evitando credenciales de emulador en producción)
if (process.env.FORCE_PRODUCTION === 'true') {
  console.log('[ETL] Forzando producción: cargando únicamente variables de .env');
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

// 2. Importaciones dinámicas para evitar inicializaciones tempranas de Firebase
const { db } = await import('../src/config/firebase.js');
const pg = (await import('pg')).default;
const { moduleCatalog } = await import('../src/data/moduleCatalog.js');
const { LECCION_GENERADORES } = await import('../src/exercises/registry.js');

// Forzar al driver 'pg' a parsear fechas TIMESTAMP WITH TIME ZONE (OID: 1184) en UTC directamente en JS
pg.types.setTypeParser(1184, stringVal => new Date(stringVal));

const BATCH_SIZE = process.env.LIMIT_TEST ? Number(process.env.LIMIT_TEST) : 100;
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
  console.log(`[ETL] Sincronizando Usuarios y Progreso Académico desde Firestore... [DRY_RUN: ${DRY_RUN}] [LIMIT_TEST: ${process.env.LIMIT_TEST || 'Sin límite'}]`);
  
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

    // 2. Sincronizar catálogo estático (Módulos, Lecciones y Ejercicios)
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
      if (DRY_RUN) {
        await client.query('ROLLBACK');
        console.log('[ETL - DRY_RUN] Simulación de catálogo estático exitosa. Rollback ejecutado.');
      } else {
        await client.query('COMMIT');
        console.log('[ETL] Catálogo estático sincronizado con éxito.');
      }
    } catch (catalogError) {
      await client.query('ROLLBACK');
      console.error('[ETL Error] Falló la sincronización del catálogo estático:', catalogError);
      throw catalogError;
    }

    // 3. Barrido paginado de la colección 'usuarios'
    let lastDoc = null;
    let hasMore = true;
    let totalProcessed = 0;

    while (hasMore) {
      console.log('[ETL] Consultando lote de usuarios desde Firestore...');
      let query = db.collection('usuarios')
        .orderBy('__name__', 'asc') // Paginación determinista en Firestore
        .limit(BATCH_SIZE);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        console.log('[ETL] No quedan más usuarios por sincronizar.');
        hasMore = false;
        break;
      }

      console.log(`[ETL] Procesando lote de ${snapshot.size} usuarios...`);
      
      const userPayloads = [];
      const progressPayloads = [];

      for (const userDoc of snapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const onboarding = userData.onboarding || {};
        const fechaRegistro = resolveFirestoreDate(userData.fecha_registro || userData.createdAt) || new Date();
        const ultimaConexion = resolveFirestoreDate(userData.ultima_conexion || userData.lastLoginAt) || new Date();
        const ultimaLeccion = resolveFirestoreDate(userData.ultimaLeccionCompletada);

        const nombreRaw = userData.nombre || userData.displayName || '';
        const emailRaw = userData.email || '';
        const fotoUrlRaw = userData.photoURL || '';
        const proveedorRaw = userData.provider || '';
        const rolActualRaw = userData.rolActual || 'principiante';
        const temaActualRaw = userData.tema_actual || '';
        const nivelActualRaw = userData.nivel_actual || '';
        const nivelEducativoRaw = onboarding.nivelEducativo || '';
        const objetivoRaw = onboarding.objetivo || '';

        userPayloads.push({
          userId: userId.substring(0, 64),
          nombre: nombreRaw ? nombreRaw.substring(0, 150) : null,
          email: emailRaw ? emailRaw.substring(0, 150) : null,
          fotoUrl: fotoUrlRaw ? fotoUrlRaw.substring(0, 255) : null,
          proveedor: proveedorRaw ? proveedorRaw.substring(0, 50) : null,
          puntosTotales: userData.puntos_totales !== undefined ? Number(userData.puntos_totales) : 0,
          rolActual: rolActualRaw ? rolActualRaw.substring(0, 50) : 'principiante',
          temaActual: temaActualRaw ? temaActualRaw.substring(0, 50) : null,
          nivelActual: nivelActualRaw ? nivelActualRaw.substring(0, 50) : null,
          porcentajeProgreso: userData.porcentaje_progreso !== undefined ? Number(userData.porcentaje_progreso) : 0,
          edad: onboarding.edad !== undefined ? Number(onboarding.edad) : null,
          nivelEducativo: nivelEducativoRaw ? nivelEducativoRaw.substring(0, 50) : null,
          objetivo: objetivoRaw ? objetivoRaw.substring(0, 255) : null,
          confianzaMath: onboarding.confianzaMath !== undefined ? Number(onboarding.confianzaMath) : null,
          fechaRegistro,
          ultimaConexion,
          rachaActual: userData.racha_actual !== undefined ? Number(userData.racha_actual) : 0,
          recordRacha: userData.recordRacha !== undefined ? Number(userData.recordRacha) : 0,
          ultimaLeccion
        });

        // Leer la subcolección 'progreso' de este usuario
        const progressSnap = await db.collection('usuarios').doc(userId).collection('progreso').get();
        
        progressSnap.forEach((progressDoc) => {
          const moduleId = progressDoc.id;
          const progData = progressDoc.data();
          const lecciones = progData.lecciones || progData.lessons || {};

          for (const [leccionId, leccionState] of Object.entries(lecciones)) {
            const actualizadoEn = resolveFirestoreDate(leccionState.actualizadoEn || leccionState.updatedAt) || new Date();
            progressPayloads.push({
              userId: userId.substring(0, 64),
              moduleId: moduleId.substring(0, 50),
              leccionId: leccionId.substring(0, 50),
              completada: leccionState.completada || leccionState.completed || false,
              puntaje: leccionState.puntaje || leccionState.score || 0,
              actualizadoEn
            });
          }
        });
      }

      // Iniciar Transacción en Postgres
      console.log('[ETL] Iniciando transacción Postgres para guardado...');
      await client.query('BEGIN');

      try {
        // 3.1. Guardar usuarios y rachas
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

        // 3.2. Guardar progreso de lecciones
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

        if (DRY_RUN) {
          await client.query('ROLLBACK');
          console.log('[ETL - DRY_RUN] Simulación de guardado exitosa. Rollback ejecutado.');
        } else {
          await client.query('COMMIT');
          console.log('[ETL] Lote guardado con éxito en Postgres.');
        }

      } catch (transactionError) {
        await client.query('ROLLBACK');
        console.error('[ETL Error] Falló el guardado del lote de usuarios. Rollback ejecutado:', transactionError);
        throw transactionError;
      }

      totalProcessed += snapshot.size;
      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      if (process.env.LIMIT_TEST || snapshot.size < BATCH_SIZE) {
        hasMore = false;
      }
    }

    console.log(`[ETL] Sincronización completada con éxito. Total usuarios procesados: ${totalProcessed}`);

  } catch (error) {
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
