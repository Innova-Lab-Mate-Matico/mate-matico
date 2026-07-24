import { semillaNueva } from './utils/seededRandom.js';
import { FabricaEjercicios } from './domain/FabricaEjercicios.js';
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
import {
  generarEjercicioEconomia,
  resolverRespuestaEconomia,
} from './modules/economiaBasica.js';

export const LECCION_GENERADORES = {
  aritmetica: {
    'suma-basica': ['suma_mc', 'suma_numerica'],
    'resta-basica': ['resta_mc', 'resta_num'],
    multiplicacion: ['multiplicacion_mc', 'multiplicacion_num'],
    division: ['division_mc', 'division_num'],
  },
  porcentajes: {
    'concepto-porcentaje': ['porcentaje_mc', 'porcentaje_numerico'],
    descuentos: ['descuento_mc', 'aumento_numerico'],
  },
  fracciones: {
    'fracciones-basicas': ['fraccion_decimal_mc', 'decimal_fraccion_mc', 'fraccion_comparar_mc'],
    'fracciones-equivalentes': ['fraccion_equivalente_mc'],
    'cocina-suma': ['cocina_suma_num'],
    'decimales-dinero': ['decimales_dinero_mc'],
  },
  economia: {
    'iva-basico':         ['iva_mc', 'iva_num'],
    'regla-de-tres':      ['regla3_mc', 'regla3_num'],
    'interes-simple':     ['interes_simple_mc', 'interes_simple_num'],
    'interes-compuesto':  ['interes_compuesto_mc', 'interes_compuesto_num'],
    'presupuesto':        ['presupuesto_mc', 'presupuesto_num'],
  },
};

const GENERADORES_MODULO = {
  aritmetica: generarEjercicioAritmetica,
  porcentajes: generarEjercicioPorcentajes,
  fracciones: generarEjercicioFracciones,
  economia: generarEjercicioEconomia,
};

const RESOLVERS_MODULO = {
  aritmetica: resolverRespuestaAritmetica,
  porcentajes: resolverRespuestaPorcentajes,
  fracciones: resolverRespuestaFracciones,
  economia: resolverRespuestaEconomia,
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

export function generarEjerciciosLeccion(moduleId, lessonId, semillaBase = null, userRole = 'principiante') {
  const tiposOriginales = LECCION_GENERADORES[moduleId]?.[lessonId];
  if (!tiposOriginales?.length) return [];

  const generar = GENERADORES_MODULO[moduleId];
  if (!generar) return [];

  let base = semillaBase ?? semillaNueva();
  if (typeof base === 'string') {
    base = Number(base);
  }
  if (isNaN(base)) {
    base = semillaNueva();
  }

  // Asegurar al menos 5 ejercicios ciclando los tipos de plantilla originales
  const tipos = [];
  for (let i = 0; i < Math.max(5, tiposOriginales.length); i++) {
    tipos.push(tiposOriginales[i % tiposOriginales.length]);
  }

  return tipos
    .map((tipo, index) => {
      const semilla = base + index * 9973;
      const datosEjercicio = generar(tipo, semilla, userRole);
      if (!datosEjercicio) return null;

      // Hacer el ID único agregando la semilla para evitar colisiones
      // cuando la misma plantilla se cicla varias veces
      datosEjercicio.id = `${datosEjercicio.id}-${semilla}`;

      // Instanciar usando la Fábrica
      datosEjercicio.semilla = semilla;
      datosEjercicio.tipoGenerador = tipo;
      const ejercicioObj = FabricaEjercicios.crear(datosEjercicio);
      return ejercicioObj.serializarParaCliente();
    })
    .filter(Boolean);
}

/**
 * Reconstruye el ejercicio para validar usando semilla + operandos enviados por el front.
 */
export function reconstruirEjercicio(moduleId, lessonId, exerciseId, semilla, operandos, userRole = 'principiante') {
  const parts = String(exerciseId).split('-');
  let baseExerciseId = exerciseId;
  let resolvedSemilla = NaN;

  if (parts.length > 1) {
    const ultimaParte = parts.pop();
    resolvedSemilla = Number(ultimaParte);
    baseExerciseId = parts.join('-');
  }

  // Fallback 1: Si no hay semilla en el ID (NaN), tomar el parámetro 'semilla' recibido
  if (isNaN(resolvedSemilla)) {
    resolvedSemilla = Number(semilla);
  }

  // Fallback 2: Buscar en los operandos si el parámetro tampoco es un número válido
  if (isNaN(resolvedSemilla) && operandos && (operandos.semilla !== undefined && operandos.semilla !== null)) {
    resolvedSemilla = Number(operandos.semilla);
  }

  // Fallback 3: Si todo falla, usar la constante estática segura
  if (isNaN(resolvedSemilla)) {
    resolvedSemilla = 12345;
  }

  const tipos = LECCION_GENERADORES[moduleId]?.[lessonId] ?? [];
  const generar = GENERADORES_MODULO[moduleId];
  const resolver = RESOLVERS_MODULO[moduleId];

  if (!generar || !resolver) return null;

  for (const tipo of tipos) {
    const ejercicio = generar(tipo, resolvedSemilla, userRole);
    if (ejercicio?.id !== baseExerciseId) continue;

    const respuesta = resolver(operandos ?? ejercicio.operandos, tipo);
    return FabricaEjercicios.crear({
      ...ejercicio,
      semilla: resolvedSemilla,
      tipoGenerador: tipo,
      operandos: operandos ?? ejercicio.operandos,
      respuestaCorrecta: respuesta ?? ejercicio.respuestaCorrecta,
    });
  }

  // Fallback: validación solo con operandos (el front reenvía lo mostrado en pantalla)
  if (operandos) {
    const respuesta = resolver(operandos);
    return FabricaEjercicios.crear({
      id: exerciseId,
      tipo: 'numeric',
      respuestaCorrecta: respuesta,
      operandos,
      explicacionError:
        'Revisá la operación con calma. No perdés puntos por equivocarte.',
      comodinPista: 'Mate-Matico te sugiere descomponer el cálculo en pasos pequeños.',
      puntos: 10,
      semilla: resolvedSemilla,
    });
  }

  return null;
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
