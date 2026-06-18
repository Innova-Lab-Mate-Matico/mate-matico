import { db } from '../config/firebase.js';

/**
 * Registra un evento de telemetría de manera asíncrona en la colección 'eventos'.
 * Diseñado con manejo interno de errores para evitar interrumpir la usabilidad de la app.
 *
 * @param {string} userId - ID del usuario autenticado
 * @param {string} eventType - Nombre del evento en snake_case
 * @param {Object} metadata - Datos específicos del evento
 */
export async function trackEvent(userId, eventType, metadata = {}) {
  try {
    const eventDoc = {
      usuario_id: userId ?? null,
      tipo_evento: eventType,
      fecha_hora: new Date().toISOString(),
      metadata: metadata ?? {},
    };

    await db.collection('eventos').add(eventDoc);
  } catch (error) {
    console.error(`[Tracking Error] Falló el registro del evento '${eventType}' para usuario '${userId}':`, error);
  }
}
