import { Router } from 'express';
import { postExplain } from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateExplainBody } from '../middleware/validate.js';

const router = Router();

// Endpoint para el Tutor IA
router.post('/explain', requireAuth, validateExplainBody, postExplain);

export default router;
