/**
 * Generador pseudoaleatorio determinista a partir de una semilla.
 * Permite regenerar el mismo ejercicio en validación que en GET lección.
 */
export function crearGeneradorSemilla(semilla) {
  let estado = (Number(semilla) >>> 0) || 1;
  return () => {
    estado = (estado * 1664525 + 1013904223) >>> 0;
    return estado / 0x100000000;
  };
}

export function enteroAleatorio(rng, min, max) {
  const intMin = Math.ceil(min);
  const intMax = Math.floor(max);
  return Math.floor(rng() * (intMax - intMin + 1)) + intMin;
}

export function semillaNueva() {
  return Math.floor(Math.random() * 1_000_000_000);
}
