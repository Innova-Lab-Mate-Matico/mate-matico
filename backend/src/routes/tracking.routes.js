import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { trackEventsBatch } from '../services/tracking.service.js';

const router = Router();

// Middleware local para validar el tamaño del content-length (máximo 32KB para lotes de eventos)
const sizeLimitMiddleware = (req, res, next) => {
  const limit = Number(process.env.TELEMETRY_SIZE_LIMIT_BYTES) || 32768; // 32KB
  const len = req.headers['content-length'];
  if (len && parseInt(len, 10) > limit) {
    return res.status(413).json({
      success: false,
      error: `Payload Too Large: El tamaño del lote supera los ${limit} bytes.`
    });
  }
  next();
};

// Whitelist de eventos permitidos para emisión directa de cliente
const whitelist = [
  'usuario_registrado',
  'usuario_inicio_sesion',
  'ejercicio_iniciado',
  'ejercicio_completado',
  'feedback_enviado',
  'logro_desbloqueado',
  'leccion_iniciada',
  'leccion_completada',
  'progreso_actualizado',
  'onboarding_finalizado',
  'tutor_consultado',
  'racha_perdida',
  'racha_actualizada',
  'sesion_finalizada'
];

/**
 * Endpoint de ingesta masiva (Lote / Bulk)
 * Acepta un arreglo `eventos` en req.body
 */
router.post('/batch', requireAuth, sizeLimitMiddleware, async (req, res) => {
  const rawEvents = req.body?.eventos || (Array.isArray(req.body) ? req.body : [req.body]);

  if (!Array.isArray(rawEvents) || rawEvents.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'El cuerpo de la petición debe contener un arreglo "eventos" no vacío.'
    });
  }

  // Filtrar eventos válidos contra la whitelist
  const validEvents = rawEvents.filter(item => {
    const tipo = item?.tipo_evento || item?.tipo;
    return tipo && whitelist.includes(tipo);
  });

  if (validEvents.length > 0) {
    // Procesamiento asíncrono en lote hacia Supabase
    trackEventsBatch(req.user.uid, validEvents);
  }

  return res.json({
    success: true,
    recibidos: rawEvents.length,
    procesados: validEvents.length
  });
});

/**
 * Endpoint retrocompatible para eventos unitarios simples
 */
router.post('/', requireAuth, sizeLimitMiddleware, async (req, res) => {
  const { tipo_evento, metadata } = req.body ?? {};

  if (!tipo_evento || !whitelist.includes(tipo_evento)) {
    return res.status(400).json({
      success: false,
      error: 'tipo_evento inválido o no permitido en la whitelist de cliente.'
    });
  }

  trackEventsBatch(req.user.uid, [{ tipo_evento, metadata }]);

  return res.json({ success: true, procesados: 1 });
});

export default router;
