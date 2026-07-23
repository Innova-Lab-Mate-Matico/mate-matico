import { getProgress } from '../services/progress.service.js';
import { getUserProfile } from '../services/auth.service.js';
import { calcularLogros } from '../services/logros.service.js';

export async function getLogros(req, res, next) {
  try {
    const [progreso, user] = await Promise.all([
      getProgress(req.user.uid),
      getUserProfile(req.user.uid),
    ]);

    const logros = calcularLogros(user, progreso);

    res.json({
      success: true,
      logros,
      resumen: {
        total: logros.length,
        desbloqueados: logros.filter(l => l.desbloqueado).length,
      },
    });
  } catch (err) {
    next(err);
  }
}
