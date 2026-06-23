import { BigQuery } from '@google-cloud/bigquery';
import { getFirebaseServiceAccount } from '../config/env.js';

// Inicializar cliente de BigQuery
const credentials = getFirebaseServiceAccount();
const bigquery = new BigQuery({
  projectId: credentials.project_id,
  credentials: {
    client_email: credentials.client_email,
    private_key: credentials.private_key,
  },
});

const datasetId = 'onboarding_data';
const tableIdUsers = 'usuarios_onboarding';
const tableIdEvents = 'eventos_telemetria';

const nivelesEducativos = ['primaria', 'secundaria', 'terciaria', 'universitaria', 'ninguno'];
const objetivos = [
  'Quiero aprender a administrar mi sueldo mensual y ahorrar.',
  'Poder calcular descuentos rápidos cuando voy al supermercado.',
  'Entender las cuotas de mi tarjeta de crédito y préstamos.',
  'Aprender matemática para mejorar mi emprendimiento de ropa.',
  'Ayudar a mis hijos con las tareas escolares.',
  'Aprender proporciones y porcentajes en la vida cotidiana.'
];

function generarUsuariosSimulados(cantidad = 50) {
  const filas = [];
  for (let i = 1; i <= cantidad; i++) {
    const usuarioId = `mock_user_${Math.random().toString(36).substring(2, 10)}`;
    const edad = Math.floor(Math.random() * (60 - 18 + 1)) + 18;
    const nivelEducativo = nivelesEducativos[Math.floor(Math.random() * nivelesEducativos.length)];
    const objetivo = objetivos[Math.floor(Math.random() * objetivos.length)];
    const confianzaMath = Math.floor(Math.random() * 5) + 1;
    
    let moduloRecomendado = 'aritmetica';
    const tieneInteresFinanciero = Math.random() > 0.4;
    
    if (confianzaMath <= 2) {
      moduloRecomendado = 'aritmetica';
    } else if (tieneInteresFinanciero || edad >= 18 || ['secundaria', 'terciaria', 'universitaria'].includes(nivelEducativo)) {
      moduloRecomendado = 'porcentajes';
    }

    const fecha = new Date();
    fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 15));

    filas.push({
      usuario_id: usuarioId,
      edad,
      nivel_educativo: nivelEducativo,
      objetivo,
      confianza_math: confianzaMath,
      modulo_recomendo: moduloRecomendado,
      fecha_registro: fecha.toISOString(),
    });
  }
  return filas;
}

function generarEventosSimulados(usuarios) {
  const eventos = [];
  
  for (const user of usuarios) {
    const userId = user.usuario_id;
    const regTime = new Date(user.fecha_registro);

    // 1. Registro
    eventos.push({
      usuario_id: userId,
      tipo_evento: 'usuario_registrado',
      fecha_hora: regTime.toISOString(),
      metadata: {
        modulo_recomendado: user.modulo_recomendo,
        edad: user.edad,
        nivel_educativo: user.nivel_educativo,
        objetivo: user.objetivo,
        confianza_math: user.confianza_math,
      }
    });

    // 2. Sesiones de estudio (entre 1 y 4 sesiones en días distintos o el mismo día)
    const numSessions = Math.floor(Math.random() * 4) + 1;
    let lastTime = new Date(regTime.getTime());

    for (let s = 0; s < numSessions; s++) {
      if (s > 0) {
        // Avanzar de 1 a 3 días
        lastTime.setDate(lastTime.getDate() + Math.floor(Math.random() * 3) + 1);
      }
      // Hora aleatoria entre las 9 y las 21hs
      lastTime.setHours(Math.floor(Math.random() * 12) + 9, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
      
      const loginTime = new Date(lastTime.getTime());
      
      eventos.push({
        usuario_id: userId,
        tipo_evento: 'usuario_inicio_sesion',
        fecha_hora: loginTime.toISOString(),
        metadata: {
          proveedor: Math.random() > 0.4 ? 'google.com' : 'password'
        }
      });

      // 80% de probabilidad de estudiar
      if (Math.random() > 0.2) {
        const leccionId = user.modulo_recomendo === 'porcentajes' ? 'descuentos' : 'conceptos';
        const tema = user.modulo_recomendo;
        
        const lessonStart = new Date(loginTime.getTime() + 45000); // 45s después de login
        eventos.push({
          usuario_id: userId,
          tipo_evento: 'leccion_iniciada',
          fecha_hora: lessonStart.toISOString(),
          metadata: {
            leccion_id: leccionId,
            tema: tema,
            dificultad: 'medio'
          }
        });

        let exerciseTime = new Date(lessonStart.getTime());
        const totalExercises = 3;
        
        for (let e = 1; e <= totalExercises; e++) {
          const exerciseId = `ex_${leccionId}_${e}`;
          
          // Intento incorrecto previo (40% de probabilidad)
          if (Math.random() > 0.6) {
            exerciseTime = new Date(exerciseTime.getTime() + (Math.floor(Math.random() * 20) + 10) * 1000);
            eventos.push({
              usuario_id: userId,
              tipo_evento: 'ejercicio_completado',
              fecha_hora: exerciseTime.toISOString(),
              metadata: {
                ejercicio_id: exerciseId,
                tema: tema,
                subtema: leccionId,
                dificultad: 'medio',
                resultado: 'incorrecto',
                tiempo_segundos: Math.floor(Math.random() * 15) + 5
              }
            });
          }

          // Intento correcto
          exerciseTime = new Date(exerciseTime.getTime() + (Math.floor(Math.random() * 30) + 15) * 1000);
          eventos.push({
            usuario_id: userId,
            tipo_evento: 'ejercicio_completado',
            fecha_hora: exerciseTime.toISOString(),
            metadata: {
              ejercicio_id: exerciseId,
              tema: tema,
              subtema: leccionId,
              dificultad: 'medio',
              resultado: 'correcto',
              tiempo_segundos: Math.floor(Math.random() * 25) + 10
            }
          });
        }

        // Lección completada
        const lessonEnd = new Date(exerciseTime.getTime() + 8000);
        eventos.push({
          usuario_id: userId,
          tipo_evento: 'leccion_completada',
          fecha_hora: lessonEnd.toISOString(),
          metadata: {
            leccion_id: leccionId,
            tema: tema,
            puntos_ganados: 50
          }
        });

        // Progreso actualizado
        eventos.push({
          usuario_id: userId,
          tipo_evento: 'progreso_actualizado',
          fecha_hora: new Date(lessonEnd.getTime() + 1000).toISOString(),
          metadata: {
            leccion_id: leccionId,
            tema: tema,
            puntos_totales: 50 * (s + 1),
            racha_dias: s + 1
          }
        });
      }
    }
  }

  // Ordenar cronológicamente para consistencia
  eventos.sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
  return eventos;
}

async function loadDataToBigQuery(table, schema, rows) {
  const ndjsonContent = rows.map(row => JSON.stringify(row)).join('\n') + '\n';
  const metadata = {
    sourceFormat: 'NEWLINE_DELIMITED_JSON',
    schema: { fields: schema },
    writeDisposition: 'WRITE_APPEND',
  };

  const writeStream = table.createWriteStream(metadata);

  await new Promise((resolve, reject) => {
    writeStream.on('complete', (job) => {
      console.log(`  🎉 Carga finalizada para '${table.id}'. Trabajo ID: ${job.id}`);
      resolve();
    });
    writeStream.on('error', (err) => {
      reject(err);
    });

    writeStream.write(ndjsonContent);
    writeStream.end();
  });
}

async function main() {
  const args = process.argv.slice(2);
  const cleanMode = args.includes('--clean');

  const tableUsers = bigquery.dataset(datasetId).table(tableIdUsers);
  const tableEvents = bigquery.dataset(datasetId).table(tableIdEvents);

  if (cleanMode) {
    console.log(`🧹 Iniciando limpieza de tablas en el dataset '${datasetId}'...`);
    try {
      const [existsUsers] = await tableUsers.exists();
      if (existsUsers) {
        await tableUsers.delete();
        console.log(`✅ Tabla '${tableIdUsers}' eliminada.`);
      } else {
        console.log(`⚠️ La tabla '${tableIdUsers}' no existe.`);
      }

      const [existsEvents] = await tableEvents.exists();
      if (existsEvents) {
        await tableEvents.delete();
        console.log(`✅ Tabla '${tableIdEvents}' eliminada.`);
      } else {
        console.log(`⚠️ La tabla '${tableIdEvents}' no existe.`);
      }
    } catch (err) {
      console.error(`❌ Error al eliminar las tablas:`, err.message);
    }
    return;
  }

  console.log('🚀 Iniciando script de inicialización y siembra en BigQuery...');

  // 1. Crear el dataset si no existe
  try {
    await bigquery.dataset(datasetId).get({ autoCreate: true });
    console.log(`✅ Dataset '${datasetId}' verificado/creado.`);
  } catch (err) {
    console.error('❌ Error al crear/verificar el dataset:', err.message);
    process.exit(1);
  }

  // 2. Esquemas oficiales
  const schemaUsers = [
    { name: 'usuario_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'edad', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'nivel_educativo', type: 'STRING', mode: 'NULLABLE' },
    { name: 'objetivo', type: 'STRING', mode: 'NULLABLE' },
    { name: 'confianza_math', type: 'INTEGER', mode: 'REQUIRED' },
    { name: 'modulo_recomendo', type: 'STRING', mode: 'REQUIRED' },
    { name: 'fecha_registro', type: 'TIMESTAMP', mode: 'REQUIRED' },
  ];

  const schemaEvents = [
    { name: 'usuario_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'tipo_evento', type: 'STRING', mode: 'REQUIRED' },
    { name: 'fecha_hora', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'metadata', type: 'JSON', mode: 'NULLABLE' }
  ];

  // 3. Crear tablas si no existen
  try {
    const [existsUsers] = await tableUsers.exists();
    if (!existsUsers) {
      console.log(`Creando tabla '${tableIdUsers}'...`);
      await tableUsers.create({ schema: schemaUsers });
      console.log(`✅ Tabla '${tableIdUsers}' creada exitosamente.`);
    } else {
      console.log(`✅ Tabla '${tableIdUsers}' ya existe.`);
    }

    const [existsEvents] = await tableEvents.exists();
    if (!existsEvents) {
      console.log(`Creando tabla '${tableIdEvents}'...`);
      await tableEvents.create({ schema: schemaEvents });
      console.log(`✅ Tabla '${tableIdEvents}' creada exitosamente.`);
    } else {
      console.log(`✅ Tabla '${tableIdEvents}' ya existe.`);
    }
  } catch (err) {
    console.error('❌ Error al crear las tablas:', err.message);
    process.exit(1);
  }

  // 4. Generar y sembrar datos
  const mockUsers = generarUsuariosSimulados(50);
  const mockEvents = generarEventosSimulados(mockUsers);

  console.log(`📊 Generados ${mockUsers.length} usuarios onboarding simulados.`);
  console.log(`📊 Generados ${mockEvents.length} eventos de telemetría simulados.`);

  try {
    console.log('⏳ Cargando usuarios onboarding...');
    await loadDataToBigQuery(tableUsers, schemaUsers, mockUsers);

    console.log('⏳ Cargando eventos de telemetría...');
    await loadDataToBigQuery(tableEvents, schemaEvents, mockEvents);

    console.log('🎉 ¡Siembra de BigQuery completada con éxito para ambas tablas!');
  } catch (err) {
    console.error('❌ Error en el trabajo de carga de BigQuery:', err.message);
  }
}

main().catch(console.error);
