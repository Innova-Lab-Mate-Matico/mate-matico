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

export const LECCION_GENERADORES = {
  aritmetica: {
    'suma-basica': ['suma_mc', 'suma_numerica'],
    multiplicacion: ['multiplicacion_mc', 'multiplicacion_num'],
  },
  porcentajes: {
    'concepto-porcentaje': ['porcentaje_mc', 'porcentaje_numerico'],
    descuentos: ['descuento_mc', 'aumento_numerico'], // alineado con Figma Yerba + Internet
  },
  fracciones: {
    'fracciones-basicas': ['fraccion_decimal_mc', 'decimal_fraccion_mc', 'fraccion_comparar_mc'],
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
  const tiposOriginales = LECCION_GENERADORES[moduleId]?.[lessonId];
  if (!tiposOriginales?.length) return [];

  const generar = GENERADORES_MODULO[moduleId];
  if (!generar) return [];

  const base = semillaBase ?? semillaNueva();

  // Asegurar al menos 5 ejercicios ciclando los tipos de plantilla originales
  const tipos = [];
  for (let i = 0; i < Math.max(5, tiposOriginales.length); i++) {
    tipos.push(tiposOriginales[i % tiposOriginales.length]);
  }

  return tipos
    .map((tipo, index) => {
      const semilla = base + index * 9973;
      const datosEjercicio = generar(tipo, semilla);
      if (!datosEjercicio) return null;

      // Hacer el ID único agregando el índice para evitar colisiones
      // cuando la misma plantilla se cicla varias veces
      datosEjercicio.id = `${datosEjercicio.id}-${index}`;

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
export function reconstruirEjercicio(moduleId, lessonId, exerciseId, semilla, operandos) {
  // Los IDs de ejercicio ahora llevan un sufijo de índice (e.g. 'pct-mc-0').
  // Extraer el ID base quitando el último segmento '-N' para comparar con el generador.
  const baseExerciseId = exerciseId.replace(/-\d+$/, '');

  const meta = Object.values(META_TIPOS).find(
    (m) => m.moduleId === moduleId && m.lessonId === lessonId
  );

  const tipos = LECCION_GENERADORES[moduleId]?.[lessonId] ?? [];
  const generar = GENERADORES_MODULO[moduleId];
  const resolver = RESOLVERS_MODULO[moduleId];

  if (!generar || !resolver) return null;

  for (const tipo of tipos) {
    const ejercicio = generar(tipo, semilla);
    if (ejercicio?.id !== baseExerciseId) continue;

    const respuesta = resolver(operandos ?? ejercicio.operandos, tipo);
    return FabricaEjercicios.crear({
      ...ejercicio,
      semilla,
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
      semilla,
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
