import { db } from '../config/firebase.js';

/**
 * Registra un evento de telemetría de manera asíncrona en la colección 'eventos' de Firestore.
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
}


