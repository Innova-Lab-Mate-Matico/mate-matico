import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import {
  COLECCION_USUARIOS,
  crearPerfilUsuarioInicial,
  serializarUsuario,
  usuarioToDb,
  dbToUsuario,
} from '../models/usuario.model.js';
import { calcularRolActual, rolSubio } from './rol.service.js';
import { evaluarRacha } from './racha.service.js';

const usuariosCol = () => db.collection(COLECCION_USUARIOS);

export async function obtenerUsuario(uid) {
  const doc = await usuariosCol().doc(uid).get();
  if (!doc.exists) return null;
  const data = dbToUsuario(doc.data());
  data.uid = doc.id;
  return data;
}

export async function crearUsuarioSiNoExiste(datos) {
  const ref = usuariosCol().doc(datos.uid);
  const doc = await ref.get();

  if (doc.exists) {
    const data = dbToUsuario(doc.data());
    data.uid = doc.id;
    return { usuario: data, esNuevo: false };
  }

  const perfil = crearPerfilUsuarioInicial(datos);
  await ref.set(usuarioToDb(perfil));

  return { usuario: perfil, esNuevo: true };
}

export async function actualizarLogin(uid, { displayName, photoURL, provider }) {
  await usuariosCol().doc(uid).update(
    usuarioToDb({
      displayName,
      photoURL: photoURL ?? null,
      provider,
      lastLoginAt: new Date().toISOString(),
    })
  );
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

    const rawData = snap.data();
    const data = dbToUsuario(rawData);
    data.uid = snap.id;
    const puntosActuales = (data.puntosTotales ?? 0) + puntosGanados;
    const rolAnterior = data.rolActual;
    const rolNuevo = calcularRolActual(puntosActuales, leccionesCompletadas);

    const updates = usuarioToDb({
      puntosTotales: FieldValue.increment(puntosGanados),
      rolActual: rolNuevo,
    });

    let rachaInfo = {};
    if (actualizarRacha) {
      rachaInfo = evaluarRacha(data);
      const mappedRacha = usuarioToDb({
        rachaDias: rachaInfo.rachaDias,
        recordRacha: rachaInfo.recordRacha,
        ultimaLeccionCompletada: rachaInfo.ultimaLeccionCompletada,
      });
      Object.assign(updates, mappedRacha);
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

  const data = dbToUsuario(snap.data());
  data.uid = snap.id;
  const rachaInfo = evaluarRacha(data);
  await ref.update(
    usuarioToDb({
      ultimaLeccionCompletada: rachaInfo.ultimaLeccionCompletada,
      rachaDias: rachaInfo.rachaDias,
      recordRacha: rachaInfo.recordRacha,
    })
  );
}

export function perfilPublico(usuario) {
  return serializarUsuario(usuario);
}


