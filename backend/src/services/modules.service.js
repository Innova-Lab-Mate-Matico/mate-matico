import { moduleCatalog, findModule, findLesson } from '../data/moduleCatalog.js';
import { generarEjerciciosLeccion } from '../exercises/registry.js';
import { semillaNueva } from '../exercises/utils/seededRandom.js';

export function listarModulos() {
  return moduleCatalog.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    branch: m.branch,
    order: m.order,
    rolSugerido: m.rolSugerido,
    levelCount: m.levels.length,
  }));
}

/**
 * Detalle del módulo con ejercicios generados al vuelo por lección.
 */
export function obtenerModuloConEjercicios(moduleId, semillaBase = null) {
  const mod = findModule(moduleId);
  if (!mod) return null;

  const semilla = semillaBase ?? semillaNueva();

  return {
    id: mod.id,
    title: mod.title,
    description: mod.description,
    rolSugerido: mod.rolSugerido,
    semillaSesion: semilla,
    levels: mod.levels.map((lvl) => ({
      id: lvl.id,
      title: lvl.title,
      difficulty: lvl.difficulty,
      lessons: lvl.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        durationMinutes: lesson.durationMinutes,
        ejercicios: generarEjerciciosLeccion(moduleId, lesson.id, semilla),
      })),
    })),
  };
}

export function obtenerLeccion(moduleId, lessonId, semillaQuery, userRole = 'principiante') {
  const found = findLesson(moduleId, lessonId);
  if (!found) return null;

  let semilla = semillaQuery && semillaQuery !== 'undefined' ? Number(semillaQuery) : semillaNueva();
  if (isNaN(semilla)) {
    semilla = semillaNueva();
  }
  const ejercicios = generarEjerciciosLeccion(moduleId, lessonId, semilla, userRole);

  return {
    id: found.lesson.id,
    title: found.lesson.title,
    durationMinutes: found.lesson.durationMinutes,
    moduleId: found.module.id,
    levelId: found.level.id,
    difficulty: found.level.difficulty,
    semilla,
    ejercicios,
    teoria: found.lesson.teoria || null,
  };
}
