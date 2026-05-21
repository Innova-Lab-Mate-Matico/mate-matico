import express from 'express';

import authRoutes from './routes/auth.routes.js';
import progressRoutes from './routes/progress.routes.js';
import exerciseRoutes from './routes/exercise.routes.js';
import modulesRoutes from './routes/modules.routes.js';
import { applySecurity } from './middleware/security.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

applySecurity(app);

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

app.use('/api/auth', authRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/exercises', exerciseRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
