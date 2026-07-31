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
    let segundosTotales = 0;
    snap.forEach((doc) => {
      const data = doc.data();
      modulos[doc.id] = data;
      // Sumar tiempo de cada lección sin query extra
      const lecciones = data.lecciones ?? data.lessons ?? {};
      for (const leccion of Object.values(lecciones)) {
        if (leccion.tiempo_segundos) segundosTotales += Number(leccion.tiempo_segundos);
      }
    });
    return { modulos, minutosAprendidos: Math.round(segundosTotales / 60) };
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn('⚠️ Firestore cuota superada en getProgress. Usando fallback en memoria local.');
      return { modulos: memoryProgress.get(uid) || {}, minutosAprendidos: 0 };
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

export function updateWeeklyLogins(userDocData, timezone = 'America/Argentina/Buenos_Aires') {
  const d = new Date();
  let year, month, day;

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);

    const p = {};
    parts.forEach(part => { p[part.type] = part.value; });
    year = Number(p.year);
    month = Number(p.month);
    day = Number(p.day);
  } catch (err) {
    year = d.getFullYear();
    month = d.getMonth() + 1;
    day = d.getDate();
  }

  const yStr = String(year);
  const mStr = String(month).padStart(2, '0');
  const dStr = String(day).padStart(2, '0');
  const todayStr = `${yStr}-${mStr}-${dStr}`;

  // Calcular Lunes de la semana actual
  const dateObj = new Date(year, month - 1, day);
  const getDay = dateObj.getDay(); // 0=Dom, 1=Lun... 6=Sáb
  const diffToMonday = getDay === 0 ? -6 : 1 - getDay;
  dateObj.setDate(dateObj.getDate() + diffToMonday);

  const monY = dateObj.getFullYear();
  const monM = String(dateObj.getMonth() + 1).padStart(2, '0');
  const monD = String(dateObj.getDate()).padStart(2, '0');
  const mondayStr = `${monY}-${monM}-${monD}`;

  const currentLogins = userDocData?.loginsSemana ?? userDocData?.logins_semana ?? [];
  // Reset semana a semana: solo mantener días de logueo de la semana actual (>= Lunes)
  const currentWeekLogins = currentLogins.filter(dateStr => dateStr >= mondayStr);

  // Registrar el día de hoy si no estaba cargado
  if (!currentWeekLogins.includes(todayStr)) {
    currentWeekLogins.push(todayStr);
  }

  return { todayStr, mondayStr, updatedLogins: currentWeekLogins };
}

export async function getWeeklyActivity(uid, timezone = 'America/Argentina/Buenos_Aires') {
  try {
    const ref = db.collection(COLECCION_USUARIOS).doc(uid);
    const snap = await ref.get();
    
    let existingData = {};
    if (snap.exists) {
      existingData = snap.data();
    }

    const { updatedLogins } = updateWeeklyLogins(existingData, timezone);

    // Actualización en Firestore
    if (snap.exists) {
      ref.update({ logins_semana: updatedLogins }).catch(() => {});
    }

    return updatedLogins;
  } catch (err) {
    if (isQuotaError(err)) {
      const { updatedLogins } = updateWeeklyLogins({}, timezone);
      return updatedLogins;
    }
    throw err;
  }
}


