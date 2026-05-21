import { Router } from 'express';
import { listModules, getModule, getLesson } from '../controllers/modules.controller.js';

const router = Router();

router.get('/', listModules);
router.get('/:moduleId', getModule);
router.get('/:moduleId/lessons/:lessonId', getLesson);

export default router;
