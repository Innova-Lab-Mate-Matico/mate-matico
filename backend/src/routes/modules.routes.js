import { Router } from 'express';
import { listModules, getModule, getLesson } from '../controllers/modules.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', listModules);
router.get('/:moduleId', getModule);
router.get('/:moduleId/lessons/:lessonId', optionalAuth, getLesson);

export default router;
