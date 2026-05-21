import { validarEjercicio } from '../services/exercise.service.js';

export async function validateExercise(req, res, next) {
  try {
    const resultado = await validarEjercicio(req.user.uid, req.body);
    res.json({ success: true, ...resultado });
  } catch (err) {
    next(err);
  }
}
