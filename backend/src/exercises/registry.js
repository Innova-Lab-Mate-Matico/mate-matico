import { semillaNueva } from './utils/seededRandom.js';
import {
  generarEjercicioAritmetica,
  resolverRespuestaAritmetica,
} from './modules/aritmeticaBasica.js';
import {
  generarEjercicioPorcentajes,
  resolverRespuestaPorcentajes,
} from './modules/porcentajes.js';
import {
  generarEjercicioFracciones,
  resolverRespuestaFracciones,
} from './modules/fracciones.js';

export const LECCION_GENERADORES = {
  aritmetica: {
    'suma-basica': ['suma_mc', 'suma_numerica'],
    multiplicacion: ['multiplicacion_mc', 'resta_mc'],
  },
  porcentajes: {
    'concepto-porcentaje': ['porcentaje_mc', 'porcentaje_numerico'],
    descuentos: ['descuento_mc', 'porcentaje_mc'],
  },
  fracciones: {
    'fracciones-basicas': ['fraccion_decimal_mc'],
  },
};

const GENERADORES_MODULO = {
  aritmetica: generarEjercicioAritmetica,
  porcentajes: generarEjercicioPorcentajes,
  fracciones: generarEjercicioFracciones,
};

const RESOLVERS_MODULO = {
  aritmetica: resolverRespuestaAritmetica,
  porcentajes: resolverRespuestaPorcentajes,
  fracciones: resolverRespuestaFracciones,
};

const META_TIPOS = buildMetaTipos();

function buildMetaTipos() {
  const map = {};
  for (const [moduleId, lecciones] of Object.entries(LECCION_GENERADORES)) {
    for (const [lessonId, tipos] of Object.entries(lecciones)) {
      for (const tipo of tipos) {
        const ej = GENERADORES_MODULO[moduleId](tipo, 1);
        if (ej) {
          map[`${moduleId}.${lessonId}.${ej.id}`] = { moduleId, lessonId, tipo };
        }
      }
    }
  }
  return map;
}

export function generarEjerciciosLeccion(moduleId, lessonId, semillaBase = null) {
  const tipos = LECCION_GENERADORES[moduleId]?.[lessonId];
  if (!tipos?.length) return [];

  const generar = GENERADORES_MODULO[moduleId];
  if (!generar) return [];

  const base = semillaBase ?? semillaNueva();

  return tipos
    .map((tipo, index) => {
      const semilla = base + index * 9973;
      const ejercicio = generar(tipo, semilla);
      if (!ejercicio) return null;
      return ejercicioParaCliente(ejercicio, tipo);
    })
    .filter(Boolean);
}

/**
 * Reconstruye el ejercicio para validar usando semilla + operandos enviados por el front.
 */
export function reconstruirEjercicio(moduleId, lessonId, exerciseId, semilla, operandos) {
  const meta = Object.values(META_TIPOS).find(
    (m) => m.moduleId === moduleId && m.lessonId === lessonId
  );

  const tipos = LECCION_GENERADORES[moduleId]?.[lessonId] ?? [];
  const generar = GENERADORES_MODULO[moduleId];
  const resolver = RESOLVERS_MODULO[moduleId];

  if (!generar || !resolver) return null;

  for (const tipo of tipos) {
    const ejercicio = generar(tipo, semilla);
    if (ejercicio?.id !== exerciseId) continue;

    const respuesta = resolver(operandos ?? ejercicio.operandos);
    return {
      ...ejercicio,
      operandos: operandos ?? ejercicio.operandos,
      respuestaCorrecta: respuesta ?? ejercicio.respuestaCorrecta,
    };
  }

  // Fallback: validación solo con operandos (el front reenvía lo mostrado en pantalla)
  if (operandos) {
    const respuesta = resolver(operandos);
    return {
      id: exerciseId,
      tipo: 'numeric',
      respuestaCorrecta: respuesta,
      operandos,
      explicacionError:
        'Revisá la operación con calma. No perdés puntos por equivocarte.',
      comodinPista: 'Mate-Matico te sugiere descomponer el cálculo en pasos pequeños.',
      puntos: 10,
    };
  }

  return null;
}

export function compararRespuesta(ejercicio, answer) {
  const esperado = ejercicio.respuestaCorrecta;
  if (ejercicio.tipo === 'multiple_choice') {
    return String(answer).trim() === String(esperado).trim();
  }
  const user = Number(answer);
  const ok = Number(esperado);
  if (Number.isNaN(user) || Number.isNaN(ok)) return false;
  return Math.abs(user - ok) < 0.01;
}

export function ejercicioParaCliente(ejercicio, tipoGenerador) {
  return {
    id: ejercicio.id,
    tipo: ejercicio.tipo,
    tipoGenerador,
    enunciado: ejercicio.enunciado,
    opciones: ejercicio.opciones,
    operandos: ejercicio.operandos,
    semilla: ejercicio.semilla,
    puntos: ejercicio.puntos,
  };
}
