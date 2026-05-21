/** Roles visuales de la mascota Mate-Matico */
export const ROLES = {
  PRINCIPIANTE: 'principiante',
  INTERMEDIO: 'intermedio',
  AVANZADO: 'avanzado',
};

export const COLECCION_USUARIOS = 'usuarios';

/** Perfil inicial al registrarse o primer login con Google */
export function crearPerfilUsuarioInicial({ uid, email, displayName, photoURL = null, provider = 'password' }) {
  return {
    uid,
    email: email ?? null,
    displayName: displayName ?? 'Usuario',
    photoURL,
    provider,
    puntosTotales: 0,
    rachaDias: 0,
    recordRacha: 0,
    rolActual: ROLES.PRINCIPIANTE,
    ultimaLeccionCompletada: null,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
}

/** Respuesta pública hacia el cliente (sin datos sensibles) */
export function serializarUsuario(doc) {
  if (!doc) return null;

  const ultima = doc.ultimaLeccionCompletada;
  let ultimaISO = null;
  if (ultima?.toDate) ultimaISO = ultima.toDate().toISOString();
  else if (ultima instanceof Date) ultimaISO = ultima.toISOString();
  else if (typeof ultima === 'string') ultimaISO = ultima;

  return {
    uid: doc.uid,
    email: doc.email ?? null,
    displayName: doc.displayName,
    photoURL: doc.photoURL ?? null,
    provider: doc.provider ?? null,
    puntosTotales: doc.puntosTotales ?? 0,
    rachaDias: doc.rachaDias ?? 0,
    recordRacha: doc.recordRacha ?? 0,
    rolActual: doc.rolActual ?? ROLES.PRINCIPIANTE,
    ultimaLeccionCompletada: ultimaISO,
    createdAt: doc.createdAt ?? null,
  };
}
