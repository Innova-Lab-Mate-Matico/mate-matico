import {
  listarModulos,
  obtenerModuloConEjercicios,
  obtenerLeccion,
} from '../services/modules.service.js';
import { trackEvent } from '../services/tracking.service.js';
import { obtenerUsuario } from '../services/usuario.service.js';
import { calcularRolActual } from '../services/rol.service.js';

export function listModules(_req, res) {
  res.json({ success: true, modulos: listarModulos() });
}

export function getModule(req, res) {
  let semilla = req.query.semilla && req.query.semilla !== 'undefined' ? Number(req.query.semilla) : null;
  if (semilla !== null && isNaN(semilla)) {
    semilla = null;
  }
  const modulo = obtenerModuloConEjercicios(req.params.moduleId, semilla);

  if (!modulo) {
    return res.status(404).json({ success: false, error: 'Módulo no encontrado' });
  }

  res.json({ success: true, modulo });
}

export async function getLesson(req, res) {
  const { moduleId, lessonId } = req.params;
  const { semilla } = req.query;

  let userRole = 'principiante';
  if (req.user?.uid) {
    const userDoc = await obtenerUsuario(req.user.uid);
    if (userDoc) {
      userRole = calcularRolActual(userDoc.puntosTotales, userDoc.leccionesCompletadas || 0);
    }
  }

  let leccion = null;
  let origen = 'semilla';

  // 1. Intentar obtener lección del servidor de IA si está configurada la URL
  const aiUrl = process.env.AI_GENERATION_SERVER_URL;
  if (aiUrl && aiUrl.trim() !== '') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 segundos de timeout

      const response = await fetch(`${aiUrl}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, lessonId, semilla, userRole }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.leccion) {
          leccion = data.leccion;
          origen = 'ia';
        }
      }
    } catch (err) {
      console.warn('⚠️ Fallo en el servidor de IA, activando contención de semilla:', err.message);
    }
  }

  // 2. Contención de emergencia: Fallback si la IA falló o no está configurada
  if (!leccion) {
    leccion = obtenerLeccion(moduleId, lessonId, semilla, userRole);
  }

  if (!leccion) {
    return res.status(404).json({ success: false, error: 'Lección no encontrada' });
  }

  // Guardar el origen de la lección
  leccion.origen = origen;

  if (req.user?.uid) {
    const difficultyMap = { 1: 'bajo', 2: 'medio', 3: 'alto' };
    const dificultad = difficultyMap[leccion.difficulty] || 'bajo';

    trackEvent(req.user.uid, 'leccion_iniciada', {
      leccion_id: leccion.id,
      tema: leccion.moduleId,
      dificultad,
      origen,
    });
  }

  res.json({ success: true, leccion });
}
