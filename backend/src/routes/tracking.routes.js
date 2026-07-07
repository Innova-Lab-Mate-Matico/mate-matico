import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { trackEvent } from '../services/tracking.service.js';

const router = Router();

// Middleware local para validar el tamaño del content-length (máximo 2KB)
const sizeLimitMiddleware = (req, res, next) => {
  const limit = Number(process.env.TELEMETRY_SIZE_LIMIT_BYTES) || 2048;
  const len = req.headers['content-length'];
  if (len && parseInt(len, 10) > limit) {
    return res.status(413).json({
      success: false,
      error: `Payload Too Large: El tamaño de la petición supera los ${limit} bytes.`
    });
  }
  next();
};

// Whitelist acotada estrictamente a eventos emitidos de forma directa por el cliente
const whitelist = [
  'ejercicio_iniciado',
  'feedback_enviado'
];

router.post('/', requireAuth, sizeLimitMiddleware, async (req, res) => {
  const { tipo_evento, metadata } = req.body ?? {};

  if (!tipo_evento || !whitelist.includes(tipo_evento)) {
    return res.status(400).json({
      success: false,
      error: 'tipo_evento inválido o no permitido en la whitelist de cliente.'
    });
  }

  if (!metadata || !metadata.sesion_id || String(metadata.sesion_id).trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'El campo metadata.sesion_id es obligatorio.'
    });
  }

  // Ejecución asíncrona no bloqueante
  trackEvent(req.user.uid, tipo_evento, metadata);

  return res.json({ success: true });
});

export default router;
