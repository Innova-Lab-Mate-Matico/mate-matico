import app from './app.js';
import { env } from './config/env.js';
import logger from './config/logger.js';
import './config/firebase.js';

const PORT = env.port;

const server = app.listen(PORT, () => {
  logger.info(`Mate Mático API levantada en: http://localhost:${PORT}/api`);
  logger.info(`CORS permitidos: ${env.corsOrigins.join(', ')}`);
});

/**
 * Lógica de Graceful Shutdown (Apagado Limpio y Cierre Ordenado)
 */
const handleShutdown = async (signal) => {
  logger.warn(`Señal ${signal} recibida. Iniciando cierre ordenado de Mate Mático API...`);

  server.close(async () => {
    logger.info('Servidor HTTP cerrado. No se aceptarán más conexiones.');

    try {
      logger.info('Todos los recursos fueron liberados con éxito.');
      process.exit(0);
    } catch (err) {
      logger.error('Error durante la liberación de recursos en el apagado', { error: err.message });
      process.exit(1);
    }
  });

  // Timeout de seguridad: Forzar salida si hay peticiones colgadas en 10 segundos
  setTimeout(() => {
    logger.error('Apagado limpio excedió el tiempo límite (10s). Forzando cierre del proceso.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
