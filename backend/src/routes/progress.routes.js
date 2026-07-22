import { Router } from 'express';
import { getUserProgress, patchProgress, getWeeklyActivityController } from '../controllers/progress.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', getUserProgress);
router.get('/weekly', getWeeklyActivityController);
router.patch('/:moduleId', patchProgress);

export default router;
