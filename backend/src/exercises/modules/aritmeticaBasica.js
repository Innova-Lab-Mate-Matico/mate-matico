import { crearGeneradorSemilla, enteroAleatorio } from '../utils/seededRandom.js';
import { opcionesMultiples } from '../utils/distractores.js';

const PUNTOS_MC = 10;
const PUNTOS_NUM = 15;

/** Rango principiante: enteros del 1 al 50 */
const MIN = 1;
const MAX = 50;

const PLANTILLAS = {
  suma_mc: {
    id: 'suma-mc',
    tipo: 'multiple_choice',
    generar: (rng) => {
      const a = enteroAleatorio(rng, MIN, MAX);
      const b = enteroAleatorio(rng, MIN, MAX);
      const resultado = a + b;
      return baseEjercicio('suma-mc', 'multiple_choice', {
        a,
        b,
        operacion: 'suma',
        resultado,
        enunciado: `¿Cuánto es ${a} + ${b}?`,
        opciones: opcionesMultiples(resultado, rng),
        explicacionError: `Sumá paso a paso: ${a} + ${b} = ${resultado}. Podés agrupar decenas y unidades si te resulta más cómodo.`,
        comodinPista: `Pista de Mate-Matico: empezá sumando las unidades (${a % 10} + ${b % 10}).`,
        puntos: PUNTOS_MC,
      });
    },
  },
  resta_mc: {
    id: 'resta-mc',
    tipo: 'multiple_choice',
    generar: (rng) => {
      const a = enteroAleatorio(rng, MIN, MAX);
      const b = enteroAleatorio(rng, MIN, Math.min(a, MAX));
      const resultado = a - b;
      return baseEjercicio('resta-mc', 'multiple_choice', {
        a,
        b,
        operacion: 'resta',
        resultado,
        enunciado: `¿Cuánto es ${a} − ${b}?`,
        opciones: opcionesMultiples(resultado, rng),
        explicacionError: `Restá en orden: ${a} − ${b} = ${resultado}.`,
        comodinPista: `Pista: pensá cuánto le falta a ${b} para llegar a ${a}.`,
        puntos: PUNTOS_MC,
      });
    },
  },
  multiplicacion_mc: {
    id: 'mult-mc',
    tipo: 'multiple_choice',
    generar: (rng) => {
      const a = enteroAleatorio(rng, 2, 12);
      const b = enteroAleatorio(rng, 2, 12);
      const resultado = a * b;
      return baseEjercicio('mult-mc', 'multiple_choice', {
        a,
        b,
        operacion: 'multiplicacion',
        resultado,
        enunciado: `¿Cuánto es ${a} × ${b}?`,
        opciones: opcionesMultiples(resultado, rng),
        explicacionError: `${a} × ${b} = ${resultado}. Recordá que es sumar ${a}, ${b} veces.`,
        comodinPista: `Pista: ${a} × ${b} es lo mismo que ${b} × ${a}.`,
        puntos: PUNTOS_MC,
      });
    },
  },
  suma_numerica: {
    id: 'suma-num',
    tipo: 'numeric',
    generar: (rng) => {
      const a = enteroAleatorio(rng, MIN, MAX);
      const b = enteroAleatorio(rng, MIN, MAX);
      const resultado = a + b;
      return baseEjercicio('suma-num', 'numeric', {
        a,
        b,
        operacion: 'suma',
        resultado,
        enunciado: `Completá: ${a} + ${b} = ___`,
        explicacionError: `${a} + ${b} = ${resultado}.`,
        comodinPista: `Pista: redondeá a la decena más cercana y ajustá (${Math.round(a / 10) * 10} + ${Math.round(b / 10) * 10}).`,
        puntos: PUNTOS_NUM,
      });
    },
  },
};

function baseEjercicio(id, tipo, datos) {
  return {
    id,
    tipo,
    enunciado: datos.enunciado,
    opciones: datos.opciones,
    operandos: {
      a: datos.a,
      b: datos.b,
      operacion: datos.operacion,
    },
    respuestaCorrecta: datos.resultado,
    explicacionError: datos.explicacionError,
    comodinPista: datos.comodinPista,
    puntos: datos.puntos,
  };
}

export function generarEjercicioAritmetica(tipoGenerador, semilla) {
  const plantilla = PLANTILLAS[tipoGenerador];
  if (!plantilla) return null;
  const rng = crearGeneradorSemilla(semilla);
  const ejercicio = plantilla.generar(rng);
  return { ...ejercicio, semilla };
}

export function resolverRespuestaAritmetica(operandos) {
  const { a, b, operacion } = operandos;
  switch (operacion) {
    case 'suma':
      return a + b;
    case 'resta':
      return a - b;
    case 'multiplicacion':
      return a * b;
    case 'division':
      return b !== 0 ? a / b : null;
    default:
      return null;
  }
}

export const TIPOS_ARITMETICA = Object.keys(PLANTILLAS);
