import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProduction ? 100 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados intentos. Probá más tarde.' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.isProduction ? 20 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiadas consultas a la IA en poco tiempo. Aguardá unos segundos e intentá nuevamente.' },
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProduction ? 50 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Límite de peticiones de administración alcanzado.' },
});

export function applySecurity(app) {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginOpenerPolicy: { policy: "unsafe-none" },
    })
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);

        const isVercelDomain = origin.endsWith('.vercel.app') || origin.includes('vercel.app');
        const isAllowedOrigin = env.corsOrigins.includes(origin) || isVercelDomain;

        if (isAllowedOrigin) {
          return callback(null, true);
        }

        console.warn(`⚠️ Origen bloqueado por CORS: ${origin}`);
        callback(null, true);
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-client-timezone'],
      credentials: true,
    })
  );

  app.use('/api/auth', authLimiter);
  app.use('/api/exercises/generate-ai', aiLimiter);
  app.use('/api/exercises/validate-ai', aiLimiter);
  app.use('/api/ai', aiLimiter);
  app.use('/api/admin', adminLimiter);
}
