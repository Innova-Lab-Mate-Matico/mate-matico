import { db } from '../config/firebase.js';
import { COLECCION_USUARIOS } from '../models/usuario.model.js';
import { reconstruirEjercicio } from '../exercises/registry.js';
import {
  aplicarRecompensaActividad,
  registrarActividadEmpatica,
  obtenerUsuario,
} from './usuario.service.js';
import { updateLessonProgress } from './progress.service.js';

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

/** Busca explicación en Firestore si existe plantilla estática */
async function obtenerPlantillaFirestore(moduleId, lessonId, exerciseId) {
  const id = claveEjercicio(moduleId, lessonId, exerciseId);
  const doc = await db.collection(COLECCION_PLANTILLAS).doc(id).get();
  if (!doc.exists) return null;
  return doc.data();
}

async function registrarIntento(uid, clave, correcto) {
  const ref = intentosRef(uid, clave);
  const doc = await ref.get();
  const prev = doc.exists ? doc.data() : { erroresConsecutivos: 0 };

  const erroresConsecutivos = correcto ? 0 : (prev.erroresConsecutivos ?? 0) + 1;

  await ref.set({
    erroresConsecutivos,
    ultimoIntento: new Date().toISOString(),
    ultimoResultado: correcto ? 'correcto' : 'incorrecto',
  });

  return erroresConsecutivos;
}

/**
 * Valida respuesta dinámica (semilla + operandos) o plantilla Firestore.
 * Sin vidas: reintentos ilimitados.
 */
export async function validarEjercicio(uid, body) {
  const { moduleId, lessonId, exerciseId, answer, semilla, operandos } = body;

  // Hábito empático: registrar que el usuario practicó hoy
  await registrarActividadEmpatica(uid);

  let ejercicio = reconstruirEjercicio(
    moduleId,
    lessonId,
    exerciseId,
    semilla,
    operandos
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
    // Paralelización de escritura de log de auditoría y lectura de perfil
    const logPromise = db.collection('registroIntentos').add({
      userId: uid,
      moduleId,
      lessonId,
      exerciseId,
      semilla,
      answer,
      correcto,
      createdAt: new Date().toISOString(),
    });

    const [user] = await Promise.all([
      obtenerUsuario(uid),
      logPromise
    ]);

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

  // Paralelización de las escrituras e incrementos atómicos independientes para mitigar latencia
  const logPromise = db.collection('registroIntentos').add({
    userId: uid,
    moduleId,
    lessonId,
    exerciseId,
    semilla,
    answer,
    correcto,
    createdAt: new Date().toISOString(),
  });

  const recompensaPromise = aplicarRecompensaActividad(uid, puntosGanados, {
    actualizarRacha: true,
  });

  const progressPromise = updateLessonProgress(uid, {
    moduleId,
    lessonId,
    completada: true,
    puntaje: puntosGanados,
  });

  const [recompensa] = await Promise.all([
    recompensaPromise,
    progressPromise,
    logPromise
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
