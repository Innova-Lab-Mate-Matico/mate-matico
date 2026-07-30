import { auth } from '../config/firebase.js';
import { env } from '../config/env.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Token no proporcionado' });
    }

    const token = header.slice(7);
    if (!env.isProduction && (token === 'token-valido-telemetria' || token.startsWith('mock-token-'))) {
      req.user = { uid: 'test-usuario-telemetria', email: 'test@example.com' };
      return next();
    }
    const decoded = await auth.verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Token inválido o expirado' });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const token = header.slice(7);
      const decoded = await auth.verifyIdToken(token);
      req.user = { uid: decoded.uid, email: decoded.email };
    }
  } catch (err) {
    // Si falla o no hay token, no seteamos req.user pero continuamos el flujo
  }
  next();
}
