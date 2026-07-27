import { supabase } from '../config/supabase.js';
import crypto from 'crypto';

/**
 * Mapea un objeto de evento individual a la estructura de columnas relacional de Supabase
 */
function mapEventToRow(userId, item) {
  const eventId = item.evento_id || crypto.randomUUID();
  const fechaHora = item.fecha || item.fecha_hora || new Date().toISOString();
  const meta = item.metadata || item;

  return {
    evento_id: eventId,
    usuario_id: userId || item.usuario_id || null,
    tipo_evento: item.tipo_evento || item.tipo || 'evento_generico',
    modulo: meta.tema || meta.moduleId || item.modulo || null,
    leccion: meta.subtema || meta.leccion_id || item.leccion || null,
    ejercicio: meta.ejercicio_id || item.ejercicio || null,
    tiempo_segundos: meta.tiempo_segundos !== undefined && meta.tiempo_segundos !== null ? Number(meta.tiempo_segundos) : null,
    resultado: meta.resultado || item.resultado || null,
    intentos: meta.intentos !== undefined && meta.intentos !== null ? Number(meta.intentos) : null,
    puntaje: meta.puntaje !== undefined && meta.puntaje !== null ? Number(meta.puntaje) : null,
    metadata: meta, // Columna JSONB para atributos auxiliares
    fecha: fechaHora // Timestamp con zona horaria
  };
}

/**
 * Ingesta masiva (Bulk Insert) de un lote de eventos hacia Supabase PostgreSQL.
 * Diseñado de forma asíncrona y no bloqueante con cero impacto en cuotas de Firestore.
 *
 * @param {string} userId - ID del usuario autenticado
 * @param {Array<Object>} eventsArray - Arreglo de eventos en lote
 */
export async function trackEventsBatch(userId, eventsArray = []) {
  if (!Array.isArray(eventsArray) || eventsArray.length === 0) {
    return;
  }

  const rows = eventsArray.map(item => mapEventToRow(userId, item));

  // Inserción en lote (Bulk Insert) directa en Supabase PostgreSQL
  if (!supabase) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Tracking Dev] Simulando inserción en lote de ${rows.length} eventos (Supabase desactivo).`);
    }
    return;
  }

  try {
    const { error } = await supabase
      .from('eventos')
      .insert(rows);

    if (error) throw error;
  } catch (supabaseError) {
    console.error(`[Supabase Batch Tracking Error] Falló la inserción en lote de ${rows.length} eventos:`, supabaseError.message);
  }
}

/**
 * Mantiene compatibilidad con llamadas unitarias individuales redirigiéndolas al loteador
 */
export async function trackEvent(userId, eventType, metadata = {}) {
  return trackEventsBatch(userId, [{ tipo_evento: eventType, metadata }]);
}
