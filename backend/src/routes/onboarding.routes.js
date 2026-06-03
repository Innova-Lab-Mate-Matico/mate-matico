import { Router } from 'express';
import { guardarOnboarding, recomendarOnboarding } from '../controllers/onboarding.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateOnboardingBody } from '../middleware/validate.js';

const router = Router();

// Rutas de Onboarding (mapeadas desde app.js como sub-ruta /api/onboarding)
router.post('/', requireAuth, validateOnboardingBody, guardarOnboarding);
router.post('/recomendar', requireAuth, validateOnboardingBody, recomendarOnboarding);

export default router;
