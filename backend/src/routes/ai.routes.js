import { Router } from 'express';
import { postExplain } from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Endpoint para el Tutor IA
router.post('/explain', requireAuth, postExplain);

export default router;
