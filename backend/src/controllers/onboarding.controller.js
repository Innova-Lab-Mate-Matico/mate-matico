import { guardarOnboardingUsuario, calcularRecomendacionOnboarding } from '../services/onboarding.service.js';
import { serializarUsuario } from '../models/usuario.model.js';

export async function guardarOnboarding(req, res, next) {
  try {
    const uid = req.user.uid;
    const respuestas = req.body;

    const perfilGuardado = await guardarOnboardingUsuario(uid, respuestas);

    res.json({
      success: true,
      usuario: serializarUsuario(perfilGuardado),
    });
  } catch (err) {
    console.error('Error en guardarOnboarding:', err);
    if (err.code === 'not-found') {
      err.status = 404;
      err.message = 'Usuario no encontrado';
    }
    next(err);
  }
}

export async function recomendarOnboarding(req, res, next) {
  try {
    const respuestas = req.body;
    const recomendacion = calcularRecomendacionOnboarding(respuestas);

    res.json({
      success: true,
      moduloRecomendado: recomendacion,
    });
  } catch (err) {
    console.error('Error en recomendarOnboarding:', err);
    next(err);
  }
}
