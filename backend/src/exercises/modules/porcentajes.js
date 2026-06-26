import { crearGeneradorSemilla, enteroAleatorio } from '../utils/seededRandom.js';
import { opcionesMultiples } from '../utils/distractores.js';

const PLANTILLAS = {
  porcentaje_mc: {
    generar: (rng) => {
      const porcentaje = [10, 20, 25, 50][enteroAleatorio(rng, 0, 3)];
      
      // Asegurar un múltiplo del denominador para obtener resultados enteros exactos
      let factor = 10;
      if (porcentaje === 50) factor = 2;
      else if (porcentaje === 25) factor = 4;
      else if (porcentaje === 20) factor = 5;
      else if (porcentaje === 10) factor = 10;

      const minMult = Math.ceil(20 / factor);
      const maxMult = Math.floor(200 / factor);
      const mult = enteroAleatorio(rng, minMult, maxMult);
      const base = mult * factor;
      const resultado = (base * porcentaje) / 100;

      return ejercicio('pct-mc', 'multiple_choice', {
        porcentaje,
        base,
        operacion: 'porcentaje',
        resultado,
        enunciado: `¿Cuánto es el ${porcentaje}% de ${base}?`,
        options: options => {}, // no-op to bypass placeholder
        opciones: opcionesMultiples(resultado, rng),
        explicacionError: `${porcentaje}% de ${base} = (${porcentaje}/100) × ${base} = ${resultado}.`,
        comodinPista: `Pista: el ${porcentaje}% es una fracción de ${base}. ${porcentaje === 50 ? 'Es la mitad.' : ''}`,
        puntos: 10,
      });
    },
  },
  descuento_mc: {
    generar: (rng) => {
      // Ejercicio de Ahorro de Yerba dinámico
      const basesYerba = [6000, 8000, 10000, 12000, 15000];
      const precioBase = basesYerba[enteroAleatorio(rng, 0, basesYerba.length - 1)];
      const descuento = [10, 20, 25, 30, 50][enteroAleatorio(rng, 0, 4)];
      
      let factor = 10;
      if (descuento === 50) factor = 2;
      else if (descuento === 25) factor = 4;
      else if (descuento === 20) factor = 5;
      else if (descuento === 30) factor = 10;
      else if (descuento === 10) factor = 10;

      const factorPrecio = factor * 100;
      const mult = enteroAleatorio(rng, Math.ceil(precioBase * 0.7 / factorPrecio), Math.floor(precioBase * 1.3 / factorPrecio));
      const precio = mult * factorPrecio;

      const resultado = Math.round((precio * descuento) / 100);
      const fmt = (val) => val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

      // Distractores lógicos y numéricamente plausibles
      const precioFinal = precio - resultado;
      const mitadDesc = Math.round(resultado / 2);
      const dobleDesc = resultado * 2;

      const opcionesSet = new Set([resultado, precioFinal, mitadDesc, dobleDesc]);
      while (opcionesSet.size < 4) {
        opcionesSet.add(resultado + enteroAleatorio(rng, 1, 5) * 100);
      }
      const opciones = [...opcionesSet].sort(() => rng() - 0.5);

      return ejercicio('desc-mc', 'multiple_choice', {
        precio,
        descuento,
        operacion: 'ahorro',
        resultado,
        enunciado: `Estás comprando yerba para el mate. El paquete cuesta $${fmt(precio)} y tiene un ${descuento}% de descuento. ¿Cuánto dinero te ahorrás?`,
        opciones,
        explicacionError: `El ${descuento}% de $${fmt(precio)} es: (${descuento}/100) × ${fmt(precio)} = $${fmt(resultado)}. Te ahorrás $${fmt(resultado)}.`,
        comodinPista: `Pista: el ${descuento}% es la ${descuento === 50 ? 'mitad' : (descuento === 25 ? 'cuarta parte' : (descuento === 20 ? 'quinta parte' : 'fracción'))} del total.`,
        puntos: 10,
      });
    },
  },
  porcentaje_numerico: {
    generar: (rng) => {
      const porcentaje = 10;
      const factor = 10;
      
      // Asegurar que la base sea múltiplo de 10 para obtener un resultado entero exacto
      const minMult = Math.ceil(40 / factor);
      const maxMult = Math.floor(120 / factor);
      const mult = enteroAleatorio(rng, minMult, maxMult);
      const base = mult * factor;
      const resultado = (base * porcentaje) / 100;

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
      // Ejercicio de Aumento de Tarifa dinámico
      const servicios = [
        { nombre: 'internet', baseSujerida: 18000 },
        { nombre: 'luz', baseSujerida: 12000 },
        { nombre: 'gas', baseSujerida: 9000 },
        { nombre: 'agua', baseSujerida: 6000 },
        { nombre: 'televisión por cable', baseSujerida: 15000 }
      ];
      const servicio = servicios[enteroAleatorio(rng, 0, servicios.length - 1)];
      const porcentaje = [10, 15, 20, 25, 30][enteroAleatorio(rng, 0, 4)];
      
      let factor = 10;
      if (porcentaje === 25) factor = 4;
      else if (porcentaje === 20) factor = 5;
      else if (porcentaje === 15) factor = 20;
      else if (porcentaje === 10) factor = 10;
      else if (porcentaje === 30) factor = 10;
      
      const factorPrecio = factor * 100;
      const mult = enteroAleatorio(rng, Math.ceil(servicio.baseSujerida * 0.8 / factorPrecio), Math.floor(servicio.baseSujerida * 1.2 / factorPrecio));
      const precio = mult * factorPrecio;

      const montoAumento = Math.round((precio * porcentaje) / 100);
      const resultado = precio + montoAumento;
      const fmt = (val) => val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

      return ejercicio('aum-num', 'numeric', {
        precio,
        porcentaje,
        operacion: 'aumento',
        resultado,
        enunciado: `Tu servicio de ${servicio.nombre} cuesta $${fmt(precio)} y aumenta un ${porcentaje}% este mes. ¿Cuál será el nuevo importe?`,
        explicacionError: `El ${porcentaje}% de $${fmt(precio)} es $${fmt(montoAumento)}. El nuevo importe con el aumento es: $${fmt(precio)} + $${fmt(montoAumento)} = $${fmt(resultado)}.`,
        comodinPista: `Pista: Calculá el ${porcentaje}% de $${fmt(precio)} y sumalo al valor original.`,
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
