import { validarEjercicio } from '../services/exercise.service.js';

export async function validateExercise(req, res, next) {
  try {
    const timezone = req.headers['x-client-timezone'] || 'America/Argentina/Buenos_Aires';
    const resultado = await validarEjercicio(req.user.uid, req.body, timezone);
    res.json({ success: true, ...resultado });
  } catch (err) {
    next(err);
  }
}
