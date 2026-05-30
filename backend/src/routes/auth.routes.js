import { Router } from 'express';
import {
  register,
  login,
  googleAuth,
  me,
  guardarOnboarding,
  recomendarOnboarding,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  validateRegisterBody,
  validateLoginBody,
  validateGoogleBody,
  validateOnboardingBody,
} from '../middleware/validate.js';

const router = Router();

router.post('/register', validateRegisterBody, register);
router.post('/login', validateLoginBody, login);
router.post('/google', validateGoogleBody, googleAuth);
router.get('/me', requireAuth, me);

// Rutas del Onboarding Adaptativo (WF-04, WF-05, WF-06)
router.post('/onboarding', requireAuth, validateOnboardingBody, guardarOnboarding);
router.post('/onboarding/recomendar', requireAuth, validateOnboardingBody, recomendarOnboarding);

export default router;
