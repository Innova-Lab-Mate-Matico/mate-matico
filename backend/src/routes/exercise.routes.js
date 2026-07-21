import { Router } from 'express';
import { validateExercise } from '../controllers/exercise.controller.js';
import { generateAiExerciseController, validateAiExerciseController } from '../controllers/aiExercise.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateExerciseBody } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);
router.post('/ai/generate', generateAiExerciseController);
router.post('/ai/validate', validateAiExerciseController);
router.post('/validate', validateExerciseBody, validateExercise);

export default router;
