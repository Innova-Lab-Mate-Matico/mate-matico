import { getProgress, updateLessonProgress, getWeeklyActivity } from '../services/progress.service.js';
import { getUserProfile } from '../services/auth.service.js';

export async function getUserProgress(req, res, next) {
  try {
    const [progress, user] = await Promise.all([
      getProgress(req.user.uid),
      getUserProfile(req.user.uid),
    ]);

    // Porcentaje de ejercicios correctos desde contadores acumulados (sin query extra)
    const ejerciciosCorrectos = user?.ejerciciosCorrectos ?? 0;
    const ejerciciosTotales   = user?.ejerciciosTotales   ?? 0;
    const porcentajeCorrectos = ejerciciosTotales > 0
      ? Math.round((ejerciciosCorrectos / ejerciciosTotales) * 100)
      : null; // null = sin datos todavía

    res.json({
      success: true,
      progreso: progress,
      gamificacion: {
        puntosTotales:      user?.puntosTotales  ?? 0,
        rachaDias:          user?.rachaDias       ?? 0,
        recordRacha:        user?.recordRacha     ?? 0,
        rolActual:          user?.rolActual       ?? 'principiante',
        minutosAprendidos:  progress.minutosAprendidos ?? 0,
        porcentajeCorrectos,
      },
    });
  } catch (err) {
    next(err);
  }
}


export async function patchProgress(req, res, next) {
  try {
    const { moduleId } = req.params;
    const { lessonId, completada, puntaje, tiempo_segundos } = req.body;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        error: 'lessonId es obligatorio',
      });
    }

    const updated = await updateLessonProgress(req.user.uid, {
      moduleId,
      lessonId,
      completada,
      puntaje,
      tiempo_segundos,
    });

    res.json({ success: true, progresoModulo: updated });
  } catch (err) {
    next(err);
  }
}

export async function getWeeklyActivityController(req, res, next) {
  try {
    const timezone = req.headers['x-client-timezone'] || 'America/Argentina/Buenos_Aires';
    const activeDates = await getWeeklyActivity(req.user.uid, timezone);
    res.json({ success: true, activeDates });
  } catch (err) {
    next(err);
  }
}
