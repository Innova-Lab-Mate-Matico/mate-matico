import { crearGeneradorSemilla, enteroAleatorio } from '../utils/seededRandom.js';
import { opcionesMultiples } from '../utils/distractores.js';

const PUNTOS_MC = 10;
const PUNTOS_NUM = 15;

function obtenerLimites(userRole) {
  let min = 1;
  let max = 50;
  if (userRole === 'intermedio') {
    min = 10;
    max = 200;
  } else if (userRole === 'avanzado') {
    min = 100;
    max = 1000;
  }
  return { min, max };
}

function obtenerLimitesMult(userRole) {
  let minA = 2, maxA = 12;
  let minB = 2, maxB = 12;
  if (userRole === 'intermedio') {
    minA = 3; maxA = 15;
    minB = 10; maxB = 40;
  } else if (userRole === 'avanzado') {
    minA = 10; maxA = 50;
    minB = 20; maxB = 100;
  }
  return { minA, maxA, minB, maxB };
}

function obtenerContextoAdulto(rng, operacion, a, b) {
  // Para tener variedad, a veces tiramos el enunciado abstracto y otras veces el contextualizado
  const usarContexto = rng() > 0.3; // 70% de probabilidad de usar contexto de adultos
  if (!usarContexto) {
    if (operacion === 'suma') return `Completá la operación: ${a} + ${b} = ___`;
    if (operacion === 'resta') return `Completá la operación: ${a} − ${b} = ___`;
    if (operacion === 'multiplicacion') return `Completá la operación: ${a} × ${b} = ___`;
    if (operacion === 'division') return `Completá la operación: ${a} ÷ ${b} = ___`;
  }

  const opciones = {
    suma: [
      `Enviás $${a} por Mercado Pago a un contacto y luego le transferís $${b} adicionales. ¿Cuánto le transferiste en total?`,
      `El saldo de tu tarjeta de transporte era de $${a} y le hiciste una carga de $${b}. ¿Cuál es tu nuevo saldo disponible?`,
      `El ticket de tu compra del súper marca un total de $${a} en alimentos y $${b} en productos de limpieza. ¿Cuánto gastaste en total?`
    ],
    resta: [
      `Tenías un saldo de $${a} en tu cuenta de Mercado Pago y realizaste una compra de $${b}. ¿Cuánto dinero te quedó de saldo?`,
      `Un repuesto para tu vehículo cuesta $${a}, pero el comercio te ofrece un descuento en efectivo de $${b}. ¿Cuánto pagás finalmente?`,
      `Tu jornada de trabajo de hoy requiere completar ${a} minutos de tareas y ya llevás acumulados ${b} minutos. ¿Cuántos minutos te restan trabajar?`
    ],
    multiplicacion: [
      `Trabajaste ${a} horas extras este mes y se pagan a $${b} la hora. ¿Cuánto dinero sumás a tu liquidación de sueldo?`,
      `Comprás ${a} paquetes de yerba para la oficina a un precio unitario de $${b} cada uno. ¿Cuánto gastás en total?`,
      `El abono mensual de un servicio de streaming de música es de $${b}. Si querés planificar tu gasto para los próximos ${a} meses, ¿cuánto vas a abonar en total?`
    ],
    division: [
      `La cuenta total de una cena grupal fue de $${a} y deciden dividir el gasto en partes iguales entre las ${b} personas presentes. ¿Cuánto le corresponde abonar a cada uno?`,
      `Comprás un pack cerrado que contiene ${b} botellas de gaseosa por un valor total de $${a}. ¿Cuál es el precio unitario de cada botella?`,
      `Tenés planeado dedicar ${a} minutos de estudio a lo largo del fin de semana y decidís organizarlo en ${b} sesiones iguales. ¿De cuántos minutos debe ser cada sesión?`
    ]
  };

  const lista = opciones[operacion] || [];
  if (lista.length === 0) return `¿Cuánto es ${a} ${operacion === 'suma' ? '+' : operacion === 'resta' ? '−' : operacion === 'multiplicacion' ? '×' : '÷'} ${b}?`;

  const idx = Math.floor(rng() * lista.length);
  return lista[idx];
}

const PLANTILLAS = {
  suma_mc: {
    id: 'suma-mc',
    tipo: 'multiple_choice',
    generar: (rng, userRole) => {
      const { min, max } = obtenerLimites(userRole);
      const a = enteroAleatorio(rng, min, max);
      const b = enteroAleatorio(rng, min, max);
      const resultado = a + b;
      return baseEjercicio('suma-mc', 'multiple_choice', {
        a,
        b,
        operacion: 'suma',
        resultado,
        enunciado: obtenerContextoAdulto(rng, 'suma', a, b),
        opciones: opcionesMultiples(resultado, rng),
        explicacionError: `Sumá paso a paso: ${a} + ${b} = ${resultado}. Podés agrupar decenas y unidades si te resulta más cómodo (por ejemplo: ${Math.floor(a/10)*10} + ${Math.floor(b/10)*10} = ${Math.floor(a/10)*10 + Math.floor(b/10)*10}, más ${a%10} + ${b%10} = ${a%10 + b%10}).`,
        comodinPista: `Pista de Mate-Matico: empezá sumando las unidades (${a % 10} + ${b % 10}).`,
        puntos: PUNTOS_MC,
      });
    },
  },
  resta_mc: {
    id: 'resta-mc',
    tipo: 'multiple_choice',
    generar: (rng, userRole) => {
      const { min, max } = obtenerLimites(userRole);
      const a = enteroAleatorio(rng, min, max);
      const b = enteroAleatorio(rng, min, Math.min(a, max));
      const resultado = a - b;
      return baseEjercicio('resta-mc', 'multiple_choice', {
        a,
        b,
        operacion: 'resta',
        resultado,
        enunciado: obtenerContextoAdulto(rng, 'resta', a, b),
        opciones: opcionesMultiples(resultado, rng),
        explicacionError: `Para restar, quitamos ${b} de ${a}: ${a} − ${b} = ${resultado}. Si te ayuda, restá primero las decenas y luego las unidades.`,
        comodinPista: `Pista: Pensá cuánto le falta a ${b} para llegar a ${a}, o restá por partes (primero decenas, luego unidades).`,
        puntos: PUNTOS_MC,
      });
    },
  },
  multiplicacion_mc: {
    id: 'mult-mc',
    tipo: 'multiple_choice',
    generar: (rng, userRole) => {
      const { minA, maxA, minB, maxB } = obtenerLimitesMult(userRole);
      const a = enteroAleatorio(rng, minA, maxA);
      const b = enteroAleatorio(rng, minB, maxB);
      const resultado = a * b;
      return baseEjercicio('mult-mc', 'multiple_choice', {
        a,
        b,
        operacion: 'multiplicacion',
        resultado,
        enunciado: obtenerContextoAdulto(rng, 'multiplicacion', a, b),
        opciones: opcionesMultiples(resultado, rng),
        explicacionError: `Multiplicar ${a} × ${b} equivale a sumar el número ${a} de manera consecutiva un total de ${b} veces: ${a} × ${b} = ${resultado}. También podés resolverlo multiplicando por partes.`,
        comodinPista: `Pista: Recordá que multiplicar por partes hace las cosas más fáciles (por ejemplo, descomponer ${b} en decenas y unidades).`,
        puntos: PUNTOS_MC,
      });
    },
  },
  suma_numerica: {
    id: 'suma-num',
    tipo: 'numeric',
    generar: (rng, userRole) => {
      const { min, max } = obtenerLimites(userRole);
      const a = enteroAleatorio(rng, min, max);
      const b = enteroAleatorio(rng, min, max);
      const resultado = a + b;
      return baseEjercicio('suma-num', 'numeric', {
        a,
        b,
        operacion: 'suma',
        resultado,
        enunciado: obtenerContextoAdulto(rng, 'suma', a, b),
        explicacionError: `La suma de ${a} y ${b} se calcula sumando primero sus unidades y luego sus decenas: ${a} + ${b} = ${resultado}.`,
        comodinPista: `Pista: Sumá las unidades (${a % 10} + ${b % 10}) y luego sumale las decenas.`,
        puntos: PUNTOS_NUM,
      });
    },
  },
  multiplicacion_num: {
    id: 'mult-num',
    tipo: 'numeric',
    generar: (rng, userRole) => {
      const { minA, maxA, minB, maxB } = obtenerLimitesMult(userRole);
      const a = enteroAleatorio(rng, minA, maxA);
      const b = enteroAleatorio(rng, minB, maxB);
      const resultado = a * b;
      return baseEjercicio('mult-num', 'numeric', {
        a,
        b,
        operacion: 'multiplicacion',
        resultado,
        enunciado: obtenerContextoAdulto(rng, 'multiplicacion', a, b),
        explicacionError: `La multiplicación ${a} × ${b} da como resultado ${resultado}. Podés calcularla de forma rápida multiplicando por partes, por ejemplo: ${a} × ${Math.floor(b/10)*10} más ${a} × ${b%10}.`,
        comodinPista: `Pista: Podés multiplicar por partes descomponiendo el multiplicador.`,
        puntos: PUNTOS_NUM,
      });
    },
  },
  resta_num: {
    id: 'resta-num',
    tipo: 'numeric',
    generar: (rng, userRole) => {
      const { min, max } = obtenerLimites(userRole);
      const a = enteroAleatorio(rng, min, max);
      const b = enteroAleatorio(rng, min, Math.min(a, max));
      const resultado = a - b;
      return baseEjercicio('resta-num', 'numeric', {
        a,
        b,
        operacion: 'resta',
        resultado,
        enunciado: obtenerContextoAdulto(rng, 'resta', a, b),
        explicacionError: `Al restarle ${b} a ${a}, obtenemos ${resultado}: ${a} − ${b} = ${resultado}.`,
        comodinPista: `Pista: Pensá cuánto le falta a ${b} para llegar a ${a}.`,
        puntos: PUNTOS_NUM,
      });
    },
  },
  division_mc: {
    id: 'div-mc',
    tipo: 'multiple_choice',
    generar: (rng, userRole) => {
      const { minA, maxA, minB, maxB } = obtenerLimitesMult(userRole);
      const divisor = enteroAleatorio(rng, minA, maxA);
      const resultado = enteroAleatorio(rng, minB, maxB);
      const a = divisor * resultado;
      const b = divisor;
      return baseEjercicio('div-mc', 'multiple_choice', {
        a,
        b,
        operacion: 'division',
        resultado,
        enunciado: obtenerContextoAdulto(rng, 'division', a, b),
        opciones: opcionesMultiples(resultado, rng),
        explicacionError: `La división es la operación contraria a la multiplicación: ${a} ÷ ${b} = ${resultado} porque ${b} × ${resultado} = ${a}.`,
        comodinPista: `Pista: Buscá qué número multiplicado por ${b} da como resultado exacto ${a}.`,
        puntos: PUNTOS_MC,
      });
    },
  },
  division_num: {
    id: 'div-num',
    tipo: 'numeric',
    generar: (rng, userRole) => {
      const { minA, maxA, minB, maxB } = obtenerLimitesMult(userRole);
      const divisor = enteroAleatorio(rng, minA, maxA);
      const resultado = enteroAleatorio(rng, minB, maxB);
      const a = divisor * resultado;
      const b = divisor;
      return baseEjercicio('div-num', 'numeric', {
        a,
        b,
        operacion: 'division',
        resultado,
        enunciado: obtenerContextoAdulto(rng, 'division', a, b),
        explicacionError: `Dividir ${a} entre ${b} nos da ${resultado} porque ${b} × ${resultado} = ${a}. Recordá que la división reparte de forma equitativa.`,
        comodinPista: `Pista: Buscá qué número multiplicado por ${b} te da ${a}.`,
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

export function generarEjercicioAritmetica(tipoGenerador, semilla, userRole = 'principiante') {
  const plantilla = PLANTILLAS[tipoGenerador];
  if (!plantilla) return null;
  const rng = crearGeneradorSemilla(semilla);
  const ejercicio = plantilla.generar(rng, userRole);
  return { ...ejercicio, semilla };
}

export function resolverRespuestaAritmetica(operandos, tipoGenerador = null) {
  const a = Number(operandos.a);
  const b = Number(operandos.b);
  const { operacion } = operandos;

  if (tipoGenerador) {
    switch (tipoGenerador) {
      case 'suma_mc':
      case 'suma_numerica':
      case 'suma_num':
        return a + b;
      case 'resta_mc':
      case 'resta_num':
        return a - b;
      case 'multiplicacion_mc':
      case 'multiplicacion_num':
        return a * b;
      case 'division_mc':
      case 'division_num':
        return a / b;
      default:
        break;
    }
  }

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
