import { db } from '../config/firebase.js';
import { BigQuery } from '@google-cloud/bigquery';
import { getFirebaseServiceAccount } from '../config/env.js';

// Inicializar cliente de BigQuery utilizando las mismas credenciales de la cuenta de servicio
const credentials = getFirebaseServiceAccount();
const bigquery = new BigQuery({
  projectId: credentials.project_id,
  credentials: {
    client_email: credentials.client_email,
    private_key: credentials.private_key,
  },
});

/**
 * Registra un evento de telemetría de manera asíncrona en la colección 'eventos' de Firestore
 * y en la tabla 'eventos_telemetria' de BigQuery.
 * Diseñado con manejo interno de errores para evitar interrumpir la usabilidad de la app.
 *
 * @param {string} userId - ID del usuario autenticado
 * @param {string} eventType - Nombre del evento en snake_case
 * @param {Object} metadata - Datos específicos del evento
 */
export async function trackEvent(userId, eventType, metadata = {}) {
  const eventDoc = {
    usuario_id: userId ?? null,
    tipo_evento: eventType,
    fecha_hora: new Date().toISOString(),
    metadata: metadata ?? {},
  };

  // 1. Registrar en Firestore (Solo si no es evento redundante o si no se ha agotado la cuota)
  try {
    // Evitar saturación de Firestore con eventos de telemetría de alto volumen
    if (process.env.NODE_ENV !== 'test') {
      await db.collection('eventos').add(eventDoc);
    }
  } catch (error) {
    if (error && (error.code === 8 || error.message?.includes('Quota exceeded'))) {
      console.warn(`[Tracking Warning] Cuota de Firestore alcanzada. Omitiendo escritura de evento '${eventType}'.`);
    } else {
      console.error(`[Tracking Error] Falló el registro del evento '${eventType}' en Firestore para usuario '${userId}':`, error.message);
    }
  }

  // 2. Transmitir por stream a BigQuery (proceso complementario no bloqueante)
  if (process.env.NODE_ENV === 'test' || process.env.FIRESTORE_EMULATOR_HOST) {
    return;
  }

  try {
    const datasetId = 'onboarding_data';
    const tableId = 'eventos_telemetria';

    const ndjson = JSON.stringify(eventDoc) + '\n';
    const table = bigquery.dataset(datasetId).table(tableId);

    const writeStream = table.createWriteStream({
      sourceFormat: 'NEWLINE_DELIMITED_JSON',
      writeDisposition: 'WRITE_APPEND',
    });

    writeStream.on('error', (err) => {
      console.error(`[BigQuery Stream Error] Falló el stream del evento '${eventType}' a BigQuery:`, err.message);
    });

    writeStream.write(ndjson);
    writeStream.end();
  } catch (bqError) {
    console.error(`[BigQuery Tracking Error] Falló la preparación del stream para '${eventType}':`, bqError.message);
  }
}

