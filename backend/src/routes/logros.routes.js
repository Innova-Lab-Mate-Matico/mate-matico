import { Router } from 'express';
import { getLogros } from '../controllers/logros.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', getLogros);

export default router;
