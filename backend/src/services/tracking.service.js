import { db } from '../config/firebase.js';
import { supabase } from '../config/supabase.js';
import crypto from 'crypto';

/**
 * Registra un evento de telemetría de manera asíncrona en la colección 'eventos' de Firestore (local)
 * o directamente en la tabla 'eventos' de Supabase (producción).
 * Diseñado con manejo interno de errores para evitar interrumpir la usabilidad de la app.
 *
 * @param {string} userId - ID del usuario autenticado
 * @param {string} eventType - Nombre del evento en snake_case
 * @param {Object} metadata - Datos específicos del evento
 */
export async function trackEvent(userId, eventType, metadata = {}) {
  const eventId = crypto.randomUUID();
  const fechaHora = new Date().toISOString();

  // 1. Entorno de Desarrollo/Test/Emuladores: Escribir en Firestore Local
  if (process.env.NODE_ENV !== 'production' || process.env.FIRESTORE_EMULATOR_HOST) {
    try {
      await db.collection('eventos').doc(eventId).set({
        usuario_id: userId ?? null,
        tipo_evento: eventType,
        fecha_hora: fechaHora,
        metadata: metadata ?? {},
      });
    } catch (error) {
      if (error && (error.code === 8 || error.message?.includes('Quota exceeded'))) {
        console.warn(`[Tracking Warning] Cuota de Firestore alcanzada en local. Omitiendo.`);
      } else {
        console.error(`[Tracking Error] Falló el registro del evento '${eventType}' en Firestore para usuario '${userId}':`, error.message);
      }
    }
    return;
  }

  // 2. Entorno de Producción: Inserción directa en la tabla 'eventos' de Supabase
  if (!supabase) {
    console.error('[Supabase Error] Cliente Supabase no inicializado en producción. Evento de telemetría omitido.');
    return;
  }

  // Mapeo de parámetros alineado con schema.sql y sync-supabase.js con fallbacks
  const dbParams = {
    evento_id: eventId,
    usuario_id: userId ?? null,
    tipo_evento: eventType,
    modulo: metadata.tema || metadata.moduleId || null,
    leccion: metadata.subtema || metadata.leccion_id || null,
    ejercicio: metadata.ejercicio_id || null,
    tiempo_segundos: metadata.tiempo_segundos !== undefined ? Number(metadata.tiempo_segundos) : null,
    resultado: metadata.resultado || null,
    intentos: metadata.intentos !== undefined ? Number(metadata.intentos) : null,
    puntaje: metadata.puntaje !== undefined ? Number(metadata.puntaje) : null,
    metadata: metadata, // JSONB
    fecha: fechaHora // Timestamp con zona horaria
  };

  try {
    const { error } = await supabase
      .from('eventos')
      .insert([dbParams]);

    if (error) throw error;
  } catch (supabaseError) {
    console.error(`[Supabase Tracking Error] Falló el registro del evento '${eventType}':`, supabaseError.message);
  }
}

