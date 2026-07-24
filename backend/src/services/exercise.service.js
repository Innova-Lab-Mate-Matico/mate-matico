import { db } from '../config/firebase.js';
import admin from '../config/firebase.js';
import { COLECCION_USUARIOS } from '../models/usuario.model.js';

import { reconstruirEjercicio } from '../exercises/registry.js';
import { findLesson } from '../data/moduleCatalog.js';
import {
  aplicarRecompensaActividad,
  registrarActividadEmpatica,
  obtenerUsuario,
} from './usuario.service.js';
import { updateLessonProgress } from './progress.service.js';
import { trackEvent } from './tracking.service.js';

const UMBRAL_COMODIN = 2;
const COLECCION_PLANTILLAS = 'plantillasEjercicio';

function claveEjercicio(moduleId, lessonId, exerciseId) {
  return `${moduleId}_${lessonId}_${exerciseId}`;
}

function intentosRef(uid, clave) {
  return db
    .collection(COLECCION_USUARIOS)
    .doc(uid)
    .collection('intentos')
    .doc(clave);
}

const memoryAttempts = new Map();

function isQuotaError(err) {
  return err && (err.code === 8 || err.message?.includes('Quota exceeded') || err.details?.includes('Quota exceeded'));
}

/** Busca explicación en Firestore si existe plantilla estática */
async function obtenerPlantillaFirestore(moduleId, lessonId, exerciseId) {
  try {
    const id = claveEjercicio(moduleId, lessonId, exerciseId);
    const doc = await db.collection(COLECCION_PLANTILLAS).doc(id).get();
    if (!doc.exists) return null;
    return doc.data();
  } catch (err) {
    return null;
  }
}

async function registrarIntento(uid, clave, correcto) {
  const key = `${uid}_${clave}`;
  try {
    const ref = intentosRef(uid, clave);
    const doc = await ref.get();
    const prev = doc.exists ? doc.data() : { erroresConsecutivos: 0 };

    const erroresConsecutivos = correcto ? 0 : (prev.erroresConsecutivos ?? 0) + 1;

    await ref.set({
      erroresConsecutivos,
      ultimoIntento: new Date().toISOString(),
      ultimoResultado: correcto ? 'correcto' : 'incorrecto',
    });

    memoryAttempts.set(key, erroresConsecutivos);
    return erroresConsecutivos;
  } catch (err) {
    if (isQuotaError(err)) {
      const prev = memoryAttempts.get(key) || 0;
      const erroresConsecutivos = correcto ? 0 : prev + 1;
      memoryAttempts.set(key, erroresConsecutivos);
      return erroresConsecutivos;
    }
    throw err;
  }
}

/**
 * Valida respuesta dinámica (semilla + operandos) o plantilla Firestore.
 * Sin vidas: reintentos ilimitados.
 */
export async function validarEjercicio(uid, body, timezone = 'America/Argentina/Buenos_Aires') {
  const { moduleId, lessonId, exerciseId, answer, semilla, operandos } = body;

  // Hábito empático: registrar que el usuario practicó hoy
  await registrarActividadEmpatica(uid, timezone);

  const user = await obtenerUsuario(uid);
  const userRole = user?.rolActual || 'principiante';

  let ejercicio = reconstruirEjercicio(
    moduleId,
    lessonId,
    exerciseId,
    semilla,
    operandos,
    userRole
  );

  const plantillaFs = await obtenerPlantillaFirestore(moduleId, lessonId, exerciseId);

  if (ejercicio && plantillaFs) {
    ejercicio.explicacionError =
      plantillaFs.explicacionError ?? ejercicio.explicacionError;
    ejercicio.comodinPista = plantillaFs.comodinPista ?? ejercicio.comodinPista;
  }

  if (!ejercicio) {
    const err = new Error('Ejercicio no encontrado o datos de validación incompletos');
    err.status = 404;
    throw err;
  }

  const clave = claveEjercicio(moduleId, lessonId, exerciseId);
  
  // Utilización de validación orientada a objetos (Polimorfismo directo)
  const correcto = ejercicio.validar(answer);
  const erroresConsecutivos = await registrarIntento(uid, clave, correcto);

  if (!correcto) {
    // Telemetría en segundo plano
    const lessonData = findLesson(moduleId, lessonId);
    const dificultad = lessonData ? (lessonData.level.difficulty === 1 ? 'bajo' : lessonData.level.difficulty === 2 ? 'medio' : 'alto') : 'bajo';
    trackEvent(uid, 'ejercicio_completado', {
      ejercicio_id: exerciseId,
      tema: moduleId,
      subtema: lessonId,
      dificultad,
      resultado: 'incorrecto',
      tiempo_segundos: body.tiempo_segundos !== undefined ? Number(body.tiempo_segundos) : null,
    });

    // Incrementar contadores de ejercicios (sin costo extra de lectura)
    db.collection(COLECCION_USUARIOS).doc(uid).update({
      ejercicios_totales: admin.firestore.FieldValue.increment(1),
    }).catch(() => {});

    const user = await obtenerUsuario(uid);

    return {
      correcto: false,
      puntosGanados: 0,
      explicacionError:
        ejercicio.explicacionError ??
        'No te preocupes: en Mate-Matico podés intentar de nuevo las veces que necesites.',
      habilitarComodin: erroresConsecutivos >= UMBRAL_COMODIN,
      comodinPista:
        erroresConsecutivos >= UMBRAL_COMODIN ? ejercicio.comodinPista ?? null : null,
      rolActual: user?.rolActual ?? 'principiante',
    };
  }

  const puntosGanados = ejercicio.puntos ?? 10;

  // Telemetría en segundo plano
  const lessonData = findLesson(moduleId, lessonId);
  const dificultad = lessonData ? (lessonData.level.difficulty === 1 ? 'bajo' : lessonData.level.difficulty === 2 ? 'medio' : 'alto') : 'bajo';
  trackEvent(uid, 'ejercicio_completado', {
    ejercicio_id: exerciseId,
    tema: moduleId,
    subtema: lessonId,
    dificultad,
    resultado: 'correcto',
    tiempo_segundos: body.tiempo_segundos !== undefined ? Number(body.tiempo_segundos) : null,
  });

  // Incrementar contadores de ejercicios (sin costo extra de lectura)
  db.collection(COLECCION_USUARIOS).doc(uid).update({
    ejercicios_correctos: admin.firestore.FieldValue.increment(1),
    ejercicios_totales: admin.firestore.FieldValue.increment(1),
  }).catch(() => {});

  const recompensaPromise = aplicarRecompensaActividad(uid, puntosGanados, {
    actualizarRacha: true,
    timezone,
  });

  const progressPromise = updateLessonProgress(uid, {
    moduleId,
    lessonId,
    completada: true,
    puntaje: puntosGanados,
    tiempo_segundos: body.tiempo_segundos !== undefined ? Number(body.tiempo_segundos) : null,
  });

  const [recompensa] = await Promise.all([
    recompensaPromise,
    progressPromise,
  ]);

  return {
    correcto: true,
    puntosGanados,
    rolActual: recompensa.rolActual,
    rolSubio: recompensa.rolSubio ?? false,
    puntosTotales: recompensa.puntosTotales,
    rachaDias: recompensa.rachaDias,
    recordRacha: recompensa.recordRacha,
    mensajeRacha: recompensa.mensajeRacha,
  };
}
