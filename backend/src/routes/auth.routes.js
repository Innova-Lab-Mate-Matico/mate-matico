import { Router } from 'express';
import {
  register,
  login,
  googleAuth,
  me,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  validateRegisterBody,
  validateLoginBody,
  validateGoogleBody,
} from '../middleware/validate.js';

const router = Router();

router.post('/register', validateRegisterBody, register);
router.post('/login', validateLoginBody, login);
router.post('/google', validateGoogleBody, googleAuth);
router.get('/me', requireAuth, me);



export default router;
