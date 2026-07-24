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

// Store local en memoria para fallback cuando la cuota de Firestore se excede en desarrollo
const memoryUsers = new Map();

function isQuotaError(err) {
  return err && (err.code === 8 || err.message?.includes('Quota exceeded') || err.details?.includes('Quota exceeded'));
}

export async function obtenerUsuario(uid) {
  try {
    const doc = await usuariosCol().doc(uid).get();
    if (!doc.exists) return memoryUsers.get(uid) || null;
    const data = dbToUsuario(doc.data());
    data.uid = doc.id;
    memoryUsers.set(uid, data);
    return data;
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn('⚠️ Firestore cuota superada. Usando perfil en memoria local para usuario:', uid);
      return memoryUsers.get(uid) || {
        uid,
        email: 'usuario@local.com',
        displayName: 'Usuario Local',
        puntosTotales: 100,
        rachaDias: 1,
        rolActual: 'Estudiante',
      };
    }
    throw err;
  }
}

export async function crearUsuarioSiNoExiste(datos) {
  try {
    const ref = usuariosCol().doc(datos.uid);
    const doc = await ref.get();

    if (doc.exists) {
      const data = dbToUsuario(doc.data());
      data.uid = doc.id;
      memoryUsers.set(datos.uid, data);
      return { usuario: data, esNuevo: false };
    }

    const perfil = crearPerfilUsuarioInicial(datos);
    await ref.set(usuarioToDb(perfil));
    memoryUsers.set(datos.uid, perfil);

    return { usuario: perfil, esNuevo: true };
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn('⚠️ Firestore cuota superada. Creando perfil local en memoria.');
      const perfil = memoryUsers.get(datos.uid) || crearPerfilUsuarioInicial(datos);
      memoryUsers.set(datos.uid, perfil);
      return { usuario: perfil, esNuevo: !memoryUsers.has(datos.uid) };
    }
    throw err;
  }
}

import { updateWeeklyLogins } from './progress.service.js';

export async function actualizarLogin(uid, { displayName, photoURL, provider }, timezone = 'America/Argentina/Buenos_Aires') {
  try {
    const docRef = usuariosCol().doc(uid);
    const snap = await docRef.get();
    const existingData = snap.exists ? dbToUsuario(snap.data()) : {};

    const { updatedLogins } = updateWeeklyLogins(existingData, timezone);

    await docRef.update(
      usuarioToDb({
        displayName: displayName || existingData.displayName,
        photoURL: photoURL ?? existingData.photoURL ?? null,
        provider: provider || existingData.provider,
        lastLoginAt: new Date().toISOString(),
        loginsSemana: updatedLogins,
      })
    );
  } catch (err) {
    if (isQuotaError(err)) {
      const user = memoryUsers.get(uid);
      if (user) {
        user.displayName = displayName || user.displayName;
        user.photoURL = photoURL || user.photoURL;
      }
      return;
    }
    throw err;
  }
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
export async function aplicarRecompensaActividad(uid, puntosGanados, { actualizarRacha = true, timezone = 'America/Argentina/Buenos_Aires' } = {}) {
  try {
    const ref = usuariosCol().doc(uid);
    const leccionesCompletadas = await contarLeccionesCompletadas(uid);

    return await db.runTransaction(async (tx) => {
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
        rachaInfo = evaluarRacha(data, new Date(), timezone);
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
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn('⚠️ Firestore cuota superada en aplicarRecompensaActividad. Actualizando perfil local.');
      const user = memoryUsers.get(uid) || { uid, puntosTotales: 0, rolActual: 'Estudiante', rachaDias: 1 };
      user.puntosTotales = (user.puntosTotales ?? 0) + puntosGanados;
      user.rolActual = calcularRolActual(user.puntosTotales, 1);
      memoryUsers.set(uid, user);
      return {
        puntosTotales: user.puntosTotales,
        rolActual: user.rolActual,
        rolSubio: false,
        rachaDias: user.rachaDias ?? 1,
        recordRacha: 1,
      };
    }
    throw err;
  }
}

/** Registra intento significativo (actualiza última actividad sin sumar puntos) */
export async function registrarActividadEmpatica(uid, timezone = 'America/Argentina/Buenos_Aires') {
  try {
    const ref = usuariosCol().doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return;

    const data = dbToUsuario(snap.data());
    data.uid = snap.id;
    const rachaInfo = evaluarRacha(data, new Date(), timezone);
    await ref.update(
      usuarioToDb({
        ultimaLeccionCompletada: rachaInfo.ultimaLeccionCompletada,
        rachaDias: rachaInfo.rachaDias,
        recordRacha: rachaInfo.recordRacha,
      })
    );
  } catch (err) {
    if (isQuotaError(err)) {
      return; // Fallback silencioso en memoria
    }
    throw err;
  }
}

export function perfilPublico(usuario) {
  return serializarUsuario(usuario);
}


