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
      // Ejercicio de Ahorro de Yerba alineado con Figma
      const precio = 12000;
      const descuento = 20;
      const resultado = Math.round((precio * descuento) / 100);
      return ejercicio('desc-mc', 'multiple_choice', {
        precio,
        descuento,
        operacion: 'ahorro',
        resultado,
        enunciado: `Estás comprando yerba para el mate. El paquete cuesta $12.000 y tiene un 20% de descuento. ¿Cuánto dinero te ahorrás?`,
        opciones: [1200, 2400, 3400, 14400],
        explicacionError: `El 20% de $12.000 es: (20/100) × 12.000 = $2.400. Te ahorrás $2.400.`,
        comodinPista: `Pista: el 20% es la quinta parte del total. Dividí $12.000 por 5.`,
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
  aumento_numerico: {
    generar: (rng) => {
      // Ejercicio de Aumento de Tarifa alineado con Figma
      const precio = 18000;
      const porcentaje = 10;
      const resultado = precio + Math.round((precio * porcentaje) / 100);
      return ejercicio('aum-num', 'numeric', {
        precio,
        porcentaje,
        operacion: 'aumento',
        resultado,
        enunciado: `Tu servicio de internet cuesta $18.000 y aumenta un 10% este mes. ¿Cuál será el nuevo importe?`,
        explicacionError: `El 10% de $18.000 es $1.800. El nuevo importe con el aumento es: $18.000 + $1.800 = $19.800.`,
        comodinPista: `Pista: Calculá el 10% de $18.000 y sumalo al valor original.`,
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

export function resolverRespuestaPorcentajes(operandos, tipoGenerador = null) {
  const { operacion, porcentaje, base, precio, descuento } = operandos;

  if (tipoGenerador) {
    switch (tipoGenerador) {
      case 'descuento_mc':
        return Math.round((precio * descuento) / 100);
      case 'aumento_numerico': {
        const aum = Math.round((precio * (porcentaje ?? 10)) / 100);
        return precio + aum;
      }
      case 'porcentaje_mc':
      case 'porcentaje_numerico':
        return Math.round((base * porcentaje) / 100);
      default:
        break;
    }
  }

  if (operacion === 'porcentaje') {
    return Math.round((base * porcentaje) / 100);
  }
  if (operacion === 'descuento') {
    const desc = Math.round((precio * descuento) / 100);
    return precio - desc;
  }
  if (operacion === 'ahorro') {
    return Math.round((precio * descuento) / 100);
  }
  if (operacion === 'aumento') {
    const aum = Math.round((precio * porcentaje) / 100);
    return precio + aum;
  }
  return null;
}

export const TIPOS_PORCENTAJES = Object.keys(PLANTILLAS);
