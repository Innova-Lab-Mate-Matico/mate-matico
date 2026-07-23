import express from 'express';

import onboardingRoutes from './routes/onboarding.routes.js';
import authRoutes from './routes/auth.routes.js';
import progressRoutes from './routes/progress.routes.js';
import exerciseRoutes from './routes/exercise.routes.js';
import modulesRoutes from './routes/modules.routes.js';
import logrosRoutes from './routes/logros.routes.js';
import aiRoutes from './routes/ai.routes.js';
import { applySecurity } from './middleware/security.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

applySecurity(app);

// Desactivar caché del navegador para endpoints dinámicos de la API
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    service: 'Mate-Mático API',
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/onboarding', onboardingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/logros', logrosRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
