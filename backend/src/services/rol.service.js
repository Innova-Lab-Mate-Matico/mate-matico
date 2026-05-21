import { ROLES } from '../models/usuario.model.js';

/** Umbrales de puntos para evolución de la mascota */
const UMBRAL_INTERMEDIO = 500;
const UMBRAL_AVANZADO = 1500;

/**
 * Determina el rol visual según puntos acumulados y lecciones completadas.
 * El front renderiza el outfit de Mate-Matico según este string.
 */
export function calcularRolActual(puntosTotales = 0, leccionesCompletadas = 0) {
  if (puntosTotales >= UMBRAL_AVANZADO || leccionesCompletadas >= 45) {
    return ROLES.AVANZADO;
  }
  if (puntosTotales >= UMBRAL_INTERMEDIO || leccionesCompletadas >= 30) {
    return ROLES.INTERMEDIO;
  }
  return ROLES.PRINCIPIANTE;
}

export function rolSubio(rolAnterior, rolNuevo) {
  const orden = [ROLES.PRINCIPIANTE, ROLES.INTERMEDIO, ROLES.AVANZADO];
  return orden.indexOf(rolNuevo) > orden.indexOf(rolAnterior);
}
