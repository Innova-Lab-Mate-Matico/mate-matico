import { crearGeneradorSemilla, enteroAleatorio } from '../utils/seededRandom.js';
import { opcionesMultiples } from '../utils/distractores.js';

const FRACCIONES = [
  { num: 1, den: 2, decimal: 0.5 },
  { num: 1, den: 4, decimal: 0.25 },
  { num: 3, den: 4, decimal: 0.75 },
  { num: 1, den: 3, decimal: 0.33 },
];

const PLANTILLAS = {
  fraccion_decimal_mc: {
    generar: (rng) => {
      const f = FRACCIONES[enteroAleatorio(rng, 0, FRACCIONES.length - 1)];
      const opciones = opcionesMultiples(f.decimal, rng).map((o) =>
        o === String(f.decimal) ? String(f.decimal) : o
      );
      return {
        id: 'frac-mc',
        tipo: 'multiple_choice',
        enunciado: `¿Qué decimal representa ${f.num}/${f.den}?`,
        opciones: [...new Set([...opciones, '0.5', '0.25', '0.75'])].slice(0, 4),
        operandos: { num: f.num, den: f.den, operacion: 'fraccion_decimal' },
        respuestaCorrecta: f.decimal,
        explicacionError: `${f.num}/${f.den} = ${f.decimal}. Dividí ${f.num} ÷ ${f.den}.`,
        comodinPista: `Pista: ${f.den} partes iguales; te quedás con ${f.num}.`,
        puntos: 10,
      };
    },
  },
};

export function generarEjercicioFracciones(tipoGenerador, semilla) {
  const plantilla = PLANTILLAS[tipoGenerador];
  if (!plantilla) return null;
  const rng = crearGeneradorSemilla(semilla);
  return { ...plantilla.generar(rng), semilla };
}

export function resolverRespuestaFracciones(operandos) {
  const { num, den } = operandos;
  if (!den) return null;
  return Math.round((num / den) * 100) / 100;
}

export const TIPOS_FRACCIONES = Object.keys(PLANTILLAS);
