import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProduction ? 20 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados intentos. Probá más tarde.' },
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
}
