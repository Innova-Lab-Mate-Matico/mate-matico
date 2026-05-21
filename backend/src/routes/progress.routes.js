import { Router } from 'express';
import { getUserProgress, patchProgress } from '../controllers/progress.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', getUserProgress);
router.patch('/:moduleId', patchProgress);

export default router;
