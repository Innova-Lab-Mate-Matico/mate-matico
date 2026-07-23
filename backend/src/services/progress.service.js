import { db } from '../config/firebase.js';
import { COLECCION_USUARIOS } from '../models/usuario.model.js';
import { trackEvent } from './tracking.service.js';
import { findModule, findLesson } from '../data/moduleCatalog.js';

const memoryProgress = new Map();

function isQuotaError(err) {
  return err && (err.code === 8 || err.message?.includes('Quota exceeded') || err.details?.includes('Quota exceeded'));
}

function progresoRef(uid) {
  return db.collection(COLECCION_USUARIOS).doc(uid).collection('progreso');
}

export async function getProgress(uid) {
  try {
    const snap = await progresoRef(uid).get();
    const modulos = {};
    snap.forEach((doc) => {
      modulos[doc.id] = doc.data();
    });
    return { modulos };
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn('⚠️ Firestore cuota superada en getProgress. Usando fallback en memoria local.');
      return { modulos: memoryProgress.get(uid) || {} };
    }
    throw err;
  }
}

export async function updateLessonProgress(uid, { moduleId, lessonId, completada, puntaje, tiempo_segundos }) {
  const ref = progresoRef(uid).doc(moduleId);
  let existing = { moduleId };

  try {
    const doc = await ref.get();
    if (doc.exists) existing = doc.data();
  } catch (err) {
    if (!isQuotaError(err)) throw err;
  }

  const lecciones = { ...(existing.lecciones ?? existing.lessons ?? {}) };
  
  // Guardamos el estado anterior para ver si realmente cambió a completada
  const eraCompletada = lecciones[lessonId]?.completada || lecciones[lessonId]?.completed || false;

  lecciones[lessonId] = {
    completada: completada ?? lecciones[lessonId]?.completada ?? false,
    puntaje: puntaje ?? lecciones[lessonId]?.puntaje ?? 0,
    actualizadoEn: new Date().toISOString(),
  };

  const payload = {
    moduleId,
    lecciones,
    actualizadoEn: new Date().toISOString(),
  };

  try {
    await ref.set(payload, { merge: true });
  } catch (err) {
    if (!isQuotaError(err)) throw err;
    const userModMap = memoryProgress.get(uid) || {};
    userModMap[moduleId] = payload;
    memoryProgress.set(uid, userModMap);
  }

  // Si pasa a estar completada ahora y antes no lo estaba, disparamos leccion_completada y progreso_actualizado
  if (lecciones[lessonId].completada && !eraCompletada) {
    const lessonData = findLesson(moduleId, lessonId);
    const dificultad = lessonData ? (lessonData.level.difficulty === 1 ? 'bajo' : lessonData.level.difficulty === 2 ? 'medio' : 'alto') : 'bajo';
    
    // 1. Disparar leccion_completada en segundo plano
    trackEvent(uid, 'leccion_completada', {
      leccion_id: lessonId,
      tema: moduleId,
      dificultad,
      tiempo_segundos: tiempo_segundos !== undefined && tiempo_segundos !== null ? Number(tiempo_segundos) : null,
    });

    // 2. Calcular porcentaje y disparar progreso_actualizado en segundo plano
    const mod = findModule(moduleId);
    let totalLessons = 0;
    if (mod) {
      for (const level of mod.levels) {
        totalLessons += level.lessons.length;
      }
    }

    let completedCount = 0;
    for (const key of Object.keys(lecciones)) {
      if (lecciones[key].completada || lecciones[key].completed) {
        completedCount++;
      }
    }

    const porcentaje = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    trackEvent(uid, 'progreso_actualizado', {
      tema: moduleId,
      porcentaje_progreso: porcentaje,
    });
  }

  return payload;
}

const weeklyCache = new Map(); // uid -> { data, timestamp }

export async function getWeeklyActivity(uid, timezone = 'America/Argentina/Buenos_Aires') {
  const cached = weeklyCache.get(uid);
  if (cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
    return cached.data;
  }

  const hace8Dias = new Date();
  hace8Dias.setDate(hace8Dias.getDate() - 8);

  const diasActivos = new Set();

  try {
    const snap = await db.collection('eventos')
      .where('usuario_id', '==', uid)
      .where('fecha_hora', '>=', hace8Dias.toISOString())
      .limit(50)
      .get();

    snap.forEach(doc => {
      const data = doc.data();
      if (!data.fecha_hora) return;
      const fecha = new Date(data.fecha_hora);
      
      try {
        const formatted = new Intl.DateTimeFormat('en-CA', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(fecha);
        diasActivos.add(formatted);
      } catch (err) {
        const formatted = fecha.toISOString().split('T')[0];
        diasActivos.add(formatted);
      }
    });
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn('⚠️ Firestore cuota superada en getWeeklyActivity. Usando caché local.');
      const fallbackResult = [new Date().toISOString().split('T')[0]];
      weeklyCache.set(uid, { data: fallbackResult, timestamp: Date.now() });
      return fallbackResult;
    }
    throw err;
  }

  const result = Array.from(diasActivos);
  weeklyCache.set(uid, { data: result, timestamp: Date.now() });
  return result;
}
