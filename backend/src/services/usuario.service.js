import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import {
  COLECCION_USUARIOS,
  crearPerfilUsuarioInicial,
  serializarUsuario,
} from '../models/usuario.model.js';
import { calcularRolActual, rolSubio } from './rol.service.js';
import { evaluarRacha } from './racha.service.js';

const usuariosCol = () => db.collection(COLECCION_USUARIOS);

export async function obtenerUsuario(uid) {
  const doc = await usuariosCol().doc(uid).get();
  if (!doc.exists) return null;
  return { uid, ...doc.data() };
}

export async function crearUsuarioSiNoExiste(datos) {
  const ref = usuariosCol().doc(datos.uid);
  const doc = await ref.get();

  if (doc.exists) {
    return { usuario: { uid: doc.id, ...doc.data() }, esNuevo: false };
  }

  const perfil = crearPerfilUsuarioInicial(datos);
  await ref.set({
    ...perfil,
    ultimaLeccionCompletada: null,
  });

  return { usuario: perfil, esNuevo: true };
}

export async function actualizarLogin(uid, { displayName, photoURL, provider }) {
  await usuariosCol().doc(uid).update({
    displayName,
    photoURL: photoURL ?? null,
    provider,
    lastLoginAt: new Date().toISOString(),
  });
}

export async function contarLeccionesCompletadas(uid) {
  const snap = await usuariosCol().doc(uid).collection('progreso').get();
  let total = 0;
  snap.forEach((doc) => {
    const lessons = doc.data().lecciones ?? doc.data().lessons ?? {};
    total += Object.values(lessons).filter((l) => l.completada || l.completed).length;
  });
  return total;
}

/**
 * Actualiza puntos, rol y racha tras actividad en lección (transaccional).
 */
export async function aplicarRecompensaActividad(uid, puntosGanados, { actualizarRacha = true } = {}) {
  const ref = usuariosCol().doc(uid);
  const leccionesCompletadas = await contarLeccionesCompletadas(uid);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      const err = new Error('Usuario no encontrado');
      err.status = 404;
      throw err;
    }

    const data = snap.data();
    const puntosActuales = (data.puntosTotales ?? 0) + puntosGanados;
    const rolAnterior = data.rolActual;
    const rolNuevo = calcularRolActual(puntosActuales, leccionesCompletadas);

    const updates = {
      puntosTotales: FieldValue.increment(puntosGanados),
      rolActual: rolNuevo,
    };

    let rachaInfo = {};
    if (actualizarRacha) {
      rachaInfo = evaluarRacha(data);
      updates.rachaDias = rachaInfo.rachaDias;
      updates.recordRacha = rachaInfo.recordRacha;
      updates.ultimaLeccionCompletada = rachaInfo.ultimaLeccionCompletada;
    }

    tx.update(ref, updates);

    return {
      puntosTotales: puntosActuales,
      rolActual: rolNuevo,
      rolSubio: rolSubio(rolAnterior, rolNuevo),
      ...rachaInfo,
    };
  });
}

/** Registra intento significativo (actualiza última actividad sin sumar puntos) */
export async function registrarActividadEmpatica(uid) {
  const ref = usuariosCol().doc(uid);
  const snap = await ref.get();
  if (!snap.exists) return;

  const rachaInfo = evaluarRacha(snap.data());
  await ref.update({
    ultimaLeccionCompletada: rachaInfo.ultimaLeccionCompletada,
    rachaDias: rachaInfo.rachaDias,
    recordRacha: rachaInfo.recordRacha,
  });
}

export function perfilPublico(usuario) {
  return serializarUsuario(usuario);
}

