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

/**
 * Motor de Recomendación Inicial
 * Algoritmo determinista basado en el perfil cognitivo y de intereses del usuario.
 */
export function calcularRecomendacionOnboarding({ confianzaMath, edad, intereses, nivelEducativo }) {
  // Regla 1: Si la confianza matemática es muy baja (1 o 2), empezamos con Aritmética Básica.
  if (confianzaMath <= 2) {
    return 'aritmetica';
  }

  // Regla 2: Si tienen confianza media-alta y muestran interés explícito en temas prácticos
  // de la vida cotidiana o finanzas, les recomendamos Porcentajes directamente.
  const interesesPracticos = ['descuentos', 'finanzas', 'negocios', 'ahorro', 'compras', 'porcentajes'];
  const tieneInteresPractico = intereses && intereses.some(tag => 
    interesesPracticos.includes(tag.toLowerCase().trim())
  );

  if (tieneInteresPractico) {
    return 'porcentajes';
  }

  // Regla 3: Si son adultos (edad >= 18) o tienen nivel educativo secundario/superior,
  // y confianza matemática aceptable (>= 3), podemos retarlos con Porcentajes.
  const esAdulto = edad && edad >= 18;
  const nivelEducativoAvanzado = ['secundaria', 'terciaria', 'universitaria'].includes(nivelEducativo);
  
  if (esAdulto || nivelEducativoAvanzado) {
    return 'porcentajes';
  }

  // Por defecto, ante la duda o perfiles más jóvenes sin intereses marcados:
  return 'aritmetica';
}

/**
 * Guarda las respuestas de onboarding, calcula el módulo recomendado,
 * marca el onboarding como completado y actualiza Firestore.
 */
export async function guardarOnboardingUsuario(uid, respuestas) {
  const ref = usuariosCol().doc(uid);
  const recomendacion = calcularRecomendacionOnboarding(respuestas);

  const onboardingData = {
    completado: true,
    edad: respuestas.edad !== undefined ? Number(respuestas.edad) : null,
    nivelEducativo: respuestas.nivelEducativo ?? null,
    objetivo: respuestas.objetivo ?? null,
    confianzaMath: Number(respuestas.confianzaMath),
    intereses: respuestas.intereses ?? [],
    moduloRecomendado: recomendacion,
  };

  await ref.update({
    onboarding: onboardingData
  });

  const updatedDoc = await ref.get();
  return { uid, ...updatedDoc.data() };
}
