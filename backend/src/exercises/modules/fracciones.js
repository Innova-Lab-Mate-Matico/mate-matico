import { crearGeneradorSemilla, enteroAleatorio } from '../utils/seededRandom.js';
import { opcionesMultiples } from '../utils/distractores.js';

const FRACCIONES = [
  { num: 1, den: 2, decimal: 0.5 },
  { num: 1, den: 4, decimal: 0.25 },
  { num: 3, den: 4, decimal: 0.75 },
  { num: 1, den: 3, decimal: 0.33 },
  { num: 1, den: 5, decimal: 0.2 },
  { num: 2, den: 5, decimal: 0.4 },
  { num: 3, den: 5, decimal: 0.6 },
  { num: 4, den: 5, decimal: 0.8 },
  { num: 1, den: 10, decimal: 0.1 },
  { num: 3, den: 10, decimal: 0.3 },
  { num: 7, den: 10, decimal: 0.7 },
  { num: 9, den: 10, decimal: 0.9 },
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
  decimal_fraccion_mc: {
    generar: (rng) => {
      const f = FRACCIONES[enteroAleatorio(rng, 0, FRACCIONES.length - 1)];
      const correctFraction = `${f.num}/${f.den}`;
      const distractores = [
        `${f.num}/${f.den + 1}`,
        `${f.num + 1}/${f.den}`,
        `${f.den}/${f.num}`,
        '1/6',
        '2/3',
        '3/8'
      ].filter(d => d !== correctFraction);
      
      const opciones = [correctFraction, ...distractores.slice(0, 3)].sort(() => enteroAleatorio(rng, -1, 1));
      
      return {
        id: 'dec-frac-mc',
        tipo: 'multiple_choice',
        enunciado: `¿Qué fracción representa el decimal ${f.decimal}?`,
        opciones: [...new Set(opciones)].slice(0, 4),
        operandos: { decimal: f.decimal, num: f.num, den: f.den, operacion: 'decimal_fraccion' },
        respuestaCorrecta: correctFraction,
        explicacionError: `${f.decimal} equivale a la fracción ${f.num}/${f.den}.`,
        comodinPista: `Pista: El decimal ${f.decimal} es igual a ${Math.round(f.decimal * 100)}/100, simplificado nos da ${f.num}/${f.den}.`,
        puntos: 10,
      };
    },
  },
  fraccion_comparar_mc: {
    generar: (rng) => {
      let f1 = FRACCIONES[enteroAleatorio(rng, 0, FRACCIONES.length - 1)];
      let f2 = FRACCIONES[enteroAleatorio(rng, 0, FRACCIONES.length - 1)];
      while (f1.decimal === f2.decimal) {
        f2 = FRACCIONES[enteroAleatorio(rng, 0, FRACCIONES.length - 1)];
      }
      
      const isGreater = f1.decimal > f2.decimal;
      const correctAns = isGreater ? `${f1.num}/${f1.den}` : `${f2.num}/${f2.den}`;
      const opciones = [`${f1.num}/${f1.den}`, `${f2.num}/${f2.den}`, 'Son iguales'];
      
      return {
        id: 'frac-comp-mc',
        tipo: 'multiple_choice',
        enunciado: `¿Cuál de las siguientes fracciones es mayor?`,
        opciones,
        operandos: { 
          num1: f1.num, den1: f1.den, val1: f1.decimal,
          num2: f2.num, den2: f2.den, val2: f2.decimal,
          operacion: 'comparacion' 
        },
        respuestaCorrecta: correctAns,
        explicacionError: `${f1.num}/${f1.den} = ${f1.decimal} y ${f2.num}/${f2.den} = ${f2.decimal}. Por lo tanto, la mayor es ${correctAns}.`,
        comodinPista: `Pista: Dividí cada fracción para ver su valor decimal: ${f1.num}/${f1.den} es ${f1.decimal} y ${f2.num}/${f2.den} es ${f2.decimal}.`,
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

export function resolverRespuestaFracciones(operandos, tipoGenerador = null) {
  if (tipoGenerador) {
    switch (tipoGenerador) {
      case 'fraccion_decimal_mc': {
        const { num, den } = operandos;
        return Math.round((num / den) * 100) / 100;
      }
      case 'decimal_fraccion_mc': {
        const { num, den } = operandos;
        return `${num}/${den}`;
      }
      case 'fraccion_comparar_mc': {
        const { num1, den1, val1, num2, den2, val2 } = operandos;
        return val1 > val2 ? `${num1}/${den1}` : `${num2}/${den2}`;
      }
      default:
        break;
    }
  }

  const { num, den } = operandos;
  if (num && den) {
    return Math.round((num / den) * 100) / 100;
  }
  return null;
}

export const TIPOS_FRACCIONES = Object.keys(PLANTILLAS);
