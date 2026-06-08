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
    temaActual: '',
    nivelActual: '',
    porcentajeProgreso: 0,
    onboarding: {
      completado: false,
      edad: null,
      nivelEducativo: null,
      objetivo: null,
      confianzaMath: null,
      intereses: [],
      moduloRecomendado: null,
    },
  };
}

/**
 * Traduce el modelo interno de la app al formato físico de la base de datos (Firestore).
 * Soporta mapeos parciales para actualizaciones (update).
 */
export function usuarioToDb(usuario) {
  if (!usuario) return null;
  const dbData = {};

  const mapping = {
    uid: 'usuario_id',
    displayName: 'nombre',
    email: 'email',
    createdAt: 'fecha_registro',
    lastLoginAt: 'ultima_conexion',
    puntosTotales: 'puntos_totales',
    rachaDias: 'racha_actual',
    recordRacha: 'recordRacha',
    rolActual: 'rolActual',
    photoURL: 'photoURL',
    provider: 'provider',
    ultimaLeccionCompletada: 'ultimaLeccionCompletada',
    onboarding: 'onboarding',
    temaActual: 'tema_actual',
    nivelActual: 'nivel_actual',
    porcentajeProgreso: 'porcentaje_progreso'
  };

  for (const [key, val] of Object.entries(usuario)) {
    const dbKey = mapping[key] || key;
    dbData[dbKey] = val;
  }

  return dbData;
}

/**
 * Traduce el documento crudo recuperado de Firestore al formato interno de la aplicación.
 */
export function dbToUsuario(docData) {
  if (!docData) return null;
  const usuario = {};

  const reverseMapping = {
    usuario_id: 'uid',
    nombre: 'displayName',
    email: 'email',
    fecha_registro: 'createdAt',
    ultima_conexion: 'lastLoginAt',
    puntos_totales: 'puntosTotales',
    racha_actual: 'rachaDias',
    recordRacha: 'recordRacha',
    rolActual: 'rolActual',
    photoURL: 'photoURL',
    provider: 'provider',
    ultimaLeccionCompletada: 'ultimaLeccionCompletada',
    onboarding: 'onboarding',
    tema_actual: 'temaActual',
    nivel_actual: 'nivelActual',
    porcentaje_progreso: 'porcentajeProgreso'
  };

  for (const [key, val] of Object.entries(docData)) {
    const appKey = reverseMapping[key] || key;
    usuario[appKey] = val;
  }

  return usuario;
}

/** Respuesta pública hacia el cliente (sin datos sensibles) */
export function serializarUsuario(doc) {
  if (!doc) return null;

  const ultima = doc.ultimaLeccionCompletada;
  let ultimaISO = null;
  if (ultima?.toDate) {
    ultimaISO = ultima.toDate().toISOString();
  } else if (ultima instanceof Date) {
    ultimaISO = ultima.toISOString();
  } else if (typeof ultima === 'string') {
    ultimaISO = ultima;
  }

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
    temaActual: doc.temaActual ?? '',
    nivelActual: doc.nivelActual ?? '',
    porcentajeProgreso: doc.porcentajeProgreso ?? 0,
    onboarding: doc.onboarding ?? {
      completado: false,
      edad: null,
      nivelEducativo: null,
      objetivo: null,
      confianzaMath: null,
      intereses: [],
      moduloRecomendado: null,
    },
  };
}
