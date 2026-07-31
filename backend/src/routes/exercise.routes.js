import { Router } from 'express';
import { validateExercise } from '../controllers/exercise.controller.js';
import { generateAiExerciseController, validateAiExerciseController } from '../controllers/aiExercise.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateExerciseBody } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);
router.post('/validate', validateExerciseBody, validateExercise);

// Rutas de Generación y Validación de Ejercicios IA con Gemini (MathGen)
router.post('/generate-ai', generateAiExerciseController);
router.post('/validate-ai', validateAiExerciseController);

export default router;
