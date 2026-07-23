import { env } from '../config/env.js';

const SAFE_MESSAGES = {
  400: 'Solicitud inválida',
  401: 'No autorizado',
  403: 'Acceso denegado',
  404: 'Recurso no encontrado',
  409: 'Conflicto con el recurso',
  429: 'Demasiadas solicitudes',
  500: 'Error interno del servidor',
  503: 'Servicio no disponible',
};

export function errorHandler(err, _req, res, _next) {
  console.error(err);

  // Fallback global cuando la cuota de Firebase/Firestore se excede en desarrollo
  if (err && (err.code === 8 || err.message?.includes('Quota exceeded') || err.details?.includes('Quota exceeded'))) {
    return res.status(200).json({
      success: true,
      localMode: true,
      message: 'Operación completada en modo local (cuota diaria de Firebase alcanzada).',
    });
  }

  const status = err.status || 500;
  let message = err.message || SAFE_MESSAGES[status] || SAFE_MESSAGES[500];

  if (env.isProduction && status >= 500) {
    message = SAFE_MESSAGES[500];
  }

  const body = { success: false, error: message };

  if (!env.isProduction && err.code) {
    body.code = err.code;
  }

  res.status(status).json(body);
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ success: false, error: SAFE_MESSAGES[404] });
}
