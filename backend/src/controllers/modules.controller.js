import {
  listarModulos,
  obtenerModuloConEjercicios,
  obtenerLeccion,
} from '../services/modules.service.js';
import { trackEvent } from '../services/tracking.service.js';

export function listModules(_req, res) {
  res.json({ success: true, modulos: listarModulos() });
}

export function getModule(req, res) {
  const semilla = req.query.semilla ? Number(req.query.semilla) : null;
  const modulo = obtenerModuloConEjercicios(req.params.moduleId, semilla);

  if (!modulo) {
    return res.status(404).json({ success: false, error: 'Módulo no encontrado' });
  }

  res.json({ success: true, modulo });
}

export function getLesson(req, res) {
  const leccion = obtenerLeccion(
    req.params.moduleId,
    req.params.lessonId,
    req.query.semilla
  );

  if (!leccion) {
    return res.status(404).json({ success: false, error: 'Lección no encontrada' });
  }

  if (req.user?.uid) {
    const difficultyMap = { 1: 'bajo', 2: 'medio', 3: 'alto' };
    const dificultad = difficultyMap[leccion.difficulty] || 'bajo';

    trackEvent(req.user.uid, 'leccion_iniciada', {
      leccion_id: leccion.id,
      tema: leccion.moduleId,
      dificultad,
    });
  }

  res.json({ success: true, leccion });
}
