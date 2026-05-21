import { db } from '../config/firebase.js';
import { COLECCION_USUARIOS } from '../models/usuario.model.js';

function progresoRef(uid) {
  return db.collection(COLECCION_USUARIOS).doc(uid).collection('progreso');
}

export async function getProgress(uid) {
  const snap = await progresoRef(uid).get();
  const modulos = {};
  snap.forEach((doc) => {
    modulos[doc.id] = doc.data();
  });
  return { modulos };
}

export async function updateLessonProgress(uid, { moduleId, lessonId, completada, puntaje }) {
  const ref = progresoRef(uid).doc(moduleId);
  const doc = await ref.get();
  const existing = doc.exists ? doc.data() : { moduleId };

  const lecciones = { ...(existing.lecciones ?? existing.lessons ?? {}) };
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

  await ref.set(payload, { merge: true });
  return payload;
}
