import { crearGeneradorSemilla, enteroAleatorio } from '../utils/seededRandom.js';
import { opcionesMultiples } from '../utils/distractores.js';

const PLANTILLAS = {
  porcentaje_mc: {
    generar: (rng) => {
      const porcentaje = [10, 20, 25, 50][enteroAleatorio(rng, 0, 3)];
      const base = enteroAleatorio(rng, 20, 200);
      const resultado = Math.round((base * porcentaje) / 100);
      return ejercicio('pct-mc', 'multiple_choice', {
        porcentaje,
        base,
        operacion: 'porcentaje',
        resultado,
        enunciado: `¿Cuánto es el ${porcentaje}% de ${base}?`,
        opciones: opcionesMultiples(resultado, rng),
        explicacionError: `${porcentaje}% de ${base} = (${porcentaje}/100) × ${base} = ${resultado}.`,
        comodinPista: `Pista: el ${porcentaje}% es una fracción de ${base}. ${porcentaje === 50 ? 'Es la mitad.' : ''}`,
        puntos: 10,
      });
    },
  },
  descuento_mc: {
    generar: (rng) => {
      const precio = enteroAleatorio(rng, 100, 1000);
      const descuento = [10, 15, 20, 25][enteroAleatorio(rng, 0, 3)];
      const montoDescuento = Math.round((precio * descuento) / 100);
      const resultado = precio - montoDescuento;
      return ejercicio('desc-mc', 'multiple_choice', {
        precio,
        descuento,
        operacion: 'descuento',
        resultado,
        enunciado: `Un producto cuesta $${precio} con ${descuento}% de descuento. ¿Cuánto pagás?`,
        opciones: opcionesMultiples(resultado, rng),
        explicacionError: `Descuento: ${descuento}% de ${precio} = ${montoDescuento}. Pagás ${precio} − ${montoDescuento} = ${resultado}.`,
        comodinPista: `Pista: calculá primero cuánto es el ${descuento}% y restalo del precio.`,
        puntos: 10,
      });
    },
  },
  porcentaje_numerico: {
    generar: (rng) => {
      const porcentaje = 10;
      const base = enteroAleatorio(rng, 40, 120);
      const resultado = Math.round((base * porcentaje) / 100);
      return ejercicio('pct-num', 'numeric', {
        porcentaje,
        base,
        operacion: 'porcentaje',
        resultado,
        enunciado: `${porcentaje}% de ${base} = ___`,
        explicacionError: `${porcentaje}% de ${base} = ${resultado}.`,
        comodinPista: `Pista: el 10% es dividir ${base} entre 10.`,
        puntos: 15,
      });
    },
  },
};

function ejercicio(id, tipo, datos) {
  return {
    id,
    tipo,
    enunciado: datos.enunciado,
    opciones: datos.opciones,
    operandos: {
      porcentaje: datos.porcentaje,
      base: datos.base ?? datos.precio,
      precio: datos.precio,
      descuento: datos.descuento,
      operacion: datos.operacion,
    },
    respuestaCorrecta: datos.resultado,
    explicacionError: datos.explicacionError,
    comodinPista: datos.comodinPista,
    puntos: datos.puntos,
  };
}

export function generarEjercicioPorcentajes(tipoGenerador, semilla) {
  const plantilla = PLANTILLAS[tipoGenerador];
  if (!plantilla) return null;
  const rng = crearGeneradorSemilla(semilla);
  return { ...plantilla.generar(rng), semilla };
}

export function resolverRespuestaPorcentajes(operandos) {
  const { operacion, porcentaje, base, precio, descuento } = operandos;
  if (operacion === 'porcentaje') {
    return Math.round((base * porcentaje) / 100);
  }
  if (operacion === 'descuento') {
    const desc = Math.round((precio * descuento) / 100);
    return precio - desc;
  }
  return null;
}

export const TIPOS_PORCENTAJES = Object.keys(PLANTILLAS);
