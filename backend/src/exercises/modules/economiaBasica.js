/**
 * Módulo: Economía Doméstica
 * Lecciones: IVA y precios, Regla de tres, Interés simple,
 *            Interés compuesto, Presupuesto mensual
 */
import { crearGeneradorSemilla, enteroAleatorio } from '../utils/seededRandom.js';
import { opcionesMultiples } from '../utils/distractores.js';

const PUNTOS_MC  = 10;
const PUNTOS_NUM = 15;

// ─── Límites de dificultad ─────────────────────────────────────────────────
function obtenerLimites(userRole) {
  switch (userRole) {
    case 'avanzado':    return { precioMin: 5000,  precioMax: 50000, tasaMax: 15, mesesMax: 12 };
    case 'intermedio':  return { precioMin: 1000,  precioMax: 20000, tasaMax: 10, mesesMax: 6  };
    default:            return { precioMin: 100,   precioMax: 5000,  tasaMax: 5,  mesesMax: 3  };
  }
}

// ─── Plantillas ────────────────────────────────────────────────────────────
const PLANTILLAS = {

  // ── IVA ──────────────────────────────────────────────────────────────────
  iva_mc(semilla, userRole) {
    const rng = crearGeneradorSemilla(semilla);
    const { precioMin, precioMax } = obtenerLimites(userRole);
    const precio = enteroAleatorio(rng, precioMin / 100, precioMax / 100) * 100;
    const ivaPct = 21;
    const respuestaCorrecta = Math.round(precio * (1 + ivaPct / 100));
    const productos = ['remera', 'zapatillas', 'mochila', 'auriculares', 'campera', 'libro técnico'];
    const producto = productos[enteroAleatorio(rng, 0, productos.length - 1)];
 
    return {
      id: 'iva-mc',
      tipo: 'multiple_choice',
      enunciado: `Una ${producto} vale $${precio.toLocaleString('es-AR')} antes de impuestos. Con el IVA del ${ivaPct}%, ¿cuánto pagás en total?`,
      opciones: opcionesMultiples(respuestaCorrecta, rng),
      operandos: { tipo: 'iva', precio, iva_pct: ivaPct },
      respuestaCorrecta,
      explicacionError: `El IVA del 21% significa que sumamos $21 por cada $100 de precio neto. Calculamos el 21% de $${precio.toLocaleString('es-AR')} (es decir, $${precio} × 0.21 = $${(precio * 0.21).toLocaleString('es-AR')}) y se lo sumamos al precio original: $${precio.toLocaleString('es-AR')} + $${(precio * 0.21).toLocaleString('es-AR')} = $${respuestaCorrecta.toLocaleString('es-AR')}. De manera directa, podés multiplicar el precio por 1.21.`,
      comodinPista: `Pista: El IVA del 21% se agrega multiplicando el precio original por 1.21 (que equivale al 100% del precio + 21% de impuesto).`,
      puntos: PUNTOS_MC,
    };
  },
 
  iva_num(semilla, userRole) {
    const rng = crearGeneradorSemilla(semilla);
    const { precioMin, precioMax } = obtenerLimites(userRole);
    const precio = enteroAleatorio(rng, precioMin / 100, precioMax / 100) * 100;
    const ivaPct = 21;
    const respuestaCorrecta = Math.round(precio * (1 + ivaPct / 100));
    const contextos = [
      `un servicio de internet que cuesta $${precio.toLocaleString('es-AR')} sin IVA`,
      `una consulta médica de $${precio.toLocaleString('es-AR')} antes de impuestos`,
      `un electrodoméstico de $${precio.toLocaleString('es-AR')} neto`,
    ];
    const ctx = contextos[enteroAleatorio(rng, 0, contextos.length - 1)];
 
    return {
      id: 'iva-num',
      tipo: 'numeric',
      enunciado: `Tenés que pagar ${ctx}. ¿Cuánto pagás en total con el IVA del ${ivaPct}%? (Ingresá el monto en pesos, sin centavos)`,
      operandos: { tipo: 'iva', precio, iva_pct: ivaPct },
      respuestaCorrecta,
      explicacionError: `El importe con IVA del 21% se obtiene calculando el recargo sobre el neto: $${precio.toLocaleString('es-AR')} × 0.21 = $${(precio * 0.21).toLocaleString('es-AR')}. Sumándole ese recargo al importe neto original, obtenemos: $${precio.toLocaleString('es-AR')} + $${(precio * 0.21).toLocaleString('es-AR')} = $${respuestaCorrecta.toLocaleString('es-AR')}. De forma directa, podés multiplicar el precio por 1.21.`,
      comodinPista: `Pista: Multiplicá el precio neto por 1.21 para sumarle el 21% directamente.`,
      puntos: PUNTOS_NUM,
    };
  },
 
  // ── REGLA DE TRES ─────────────────────────────────────────────────────────
  regla3_mc(semilla, userRole) {
    const rng = crearGeneradorSemilla(semilla);
    const { precioMin, precioMax } = obtenerLimites(userRole);
    const cant1 = enteroAleatorio(rng, 1, 5) * 100; // e.g., 200g
    // Generar un precio por 100g razonable
    const unitPricePer100g = enteroAleatorio(rng, Math.max(10, precioMin / 50), Math.min(1000, precioMax / 50)) * 10;
    const precio1 = (cant1 / 100) * unitPricePer100g;
    
    let cant2 = enteroAleatorio(rng, 1, 8) * 100;
    if (cant2 === cant1) {
      cant2 = cant1 + (cant1 >= 500 ? -100 : 100);
    }
    const respuestaCorrecta = Math.round((cant2 / 100) * unitPricePer100g);
    const productos = ['manzanas', 'arroz', 'lentejas', 'queso', 'jamón', 'papa'];
    const prod = productos[enteroAleatorio(rng, 0, productos.length - 1)];
 
    return {
      id: 'regla3-mc',
      tipo: 'multiple_choice',
      enunciado: `En el super, ${cant1}g de ${prod} cuestan $${precio1.toLocaleString('es-AR')}. ¿Cuánto cuestan ${cant2}g?`,
      opciones: opcionesMultiples(respuestaCorrecta, rng),
      operandos: { tipo: 'regla3', cantidad1: cant1, precio1, cantidad2: cant2 },
      respuestaCorrecta,
      explicacionError: `Primero calculás el precio por cada 100g: $${precio1.toLocaleString('es-AR')} ÷ ${cant1 / 100} = $${unitPricePer100g.toLocaleString('es-AR')}. Luego lo multiplicás por los ${cant2 / 100} paquetes de 100g: $${unitPricePer100g.toLocaleString('es-AR')} × ${cant2 / 100} = $${respuestaCorrecta.toLocaleString('es-AR')}.`,
      comodinPista: `Averiguá cuánto cuesta 100g dividiendo el precio por ${cant1/100}, luego multiplicá eso por ${cant2/100}.`,
      puntos: PUNTOS_MC,
    };
  },
 
  regla3_num(semilla, userRole) {
    const rng = crearGeneradorSemilla(semilla);
    const { precioMin, precioMax } = obtenerLimites(userRole);
    const cant1 = enteroAleatorio(rng, 2, 6);
    // Generamos un precio unitario limpio
    const precioUnitario = enteroAleatorio(rng, Math.max(10, precioMin / 6), Math.min(2000, precioMax / 6));
    const precio1 = cant1 * precioUnitario;
    
    let cant2 = enteroAleatorio(rng, 1, 10);
    if (cant2 === cant1) {
      cant2 = cant1 + (cant1 >= 6 ? -1 : 1);
    }
    const respuestaCorrecta = cant2 * precioUnitario;
    const items = [
      { cosa: 'medialunas', unidad: 'unidades' },
      { cosa: 'empanadas', unidad: 'unidades' },
      { cosa: 'facturas', unidad: 'unidades' },
      { cosa: 'bizcochos', unidad: 'unidades' },
    ];
    const item = items[enteroAleatorio(rng, 0, items.length - 1)];
 
    return {
      id: 'regla3-num',
      tipo: 'numeric',
      enunciado: `${cant1} ${item.cosa} cuestan $${precio1.toLocaleString('es-AR')}. ¿Cuánto cuestan ${cant2} ${item.cosa}? (Redondeá al peso más cercano)`,
      operandos: { tipo: 'regla3', cantidad1: cant1, precio1, cantidad2: cant2 },
      respuestaCorrecta,
      explicacionError: `El precio de 1 ${item.cosa} es: $${precio1.toLocaleString('es-AR')} ÷ ${cant1} = $${precioUnitario.toLocaleString('es-AR')}. Por lo tanto, ${cant2} ${item.cosa} cuestan: $${precioUnitario.toLocaleString('es-AR')} × ${cant2} = $${respuestaCorrecta.toLocaleString('es-AR')}.`,
      comodinPista: `Dividí el precio total por ${cant1} para obtener el precio de una sola unidad, luego multiplicá por ${cant2}.`,
      puntos: PUNTOS_NUM,
    };
  },
 
  // ── INTERÉS SIMPLE ────────────────────────────────────────────────────────
  interes_simple_mc(semilla, userRole) {
    const rng = crearGeneradorSemilla(semilla);
    const { precioMin, precioMax, tasaMax, mesesMax } = obtenerLimites(userRole);
    const capital = enteroAleatorio(rng, precioMin / 100, precioMax / 100) * 100;
    const tasa = enteroAleatorio(rng, 1, tasaMax);
    const meses = enteroAleatorio(rng, 1, mesesMax);
    const interes = Math.round(capital * (tasa / 100) * meses);
    const respuestaCorrecta = interes;
 
    return {
      id: 'interes-simple-mc',
      tipo: 'multiple_choice',
      enunciado: `Pediste un préstamo de $${capital.toLocaleString('es-AR')} al ${tasa}% mensual por ${meses} ${meses === 1 ? 'mes' : 'meses'}. ¿Cuánto interés total vas a pagar?`,
      opciones: opcionesMultiples(respuestaCorrecta, rng),
      operandos: { tipo: 'interes_simple', capital, tasa, meses },
      respuestaCorrecta,
      explicacionError: `El interés simple de ${tasa}% sobre $${capital.toLocaleString('es-AR')} significa que cada mes se pagan $${(capital * tasa / 100).toLocaleString('es-AR')} fijos ($${capital} × ${tasa/100}). En ${meses} meses, el interés acumulado es: $${(capital * tasa / 100).toLocaleString('es-AR')} × ${meses} = $${respuestaCorrecta.toLocaleString('es-AR')}.`,
      comodinPista: `Pista: Calculá el interés de un mes ($${capital} × ${tasa/100}) y multiplicalo por los ${meses} meses.`,
      puntos: PUNTOS_MC,
    };
  },
 
  interes_simple_num(semilla, userRole) {
    const rng = crearGeneradorSemilla(semilla);
    const { precioMin, precioMax, tasaMax, mesesMax } = obtenerLimites(userRole);
    const capital = enteroAleatorio(rng, precioMin / 100, precioMax / 100) * 100;
    const tasa = enteroAleatorio(rng, 1, tasaMax);
    const meses = enteroAleatorio(rng, 1, mesesMax);
    const totalDevolver = capital + Math.round(capital * (tasa / 100) * meses);
    const respuestaCorrecta = totalDevolver;
 
    return {
      id: 'interes-simple-num',
      tipo: 'numeric',
      enunciado: `Pusiste $${capital.toLocaleString('es-AR')} en una caja de ahorro con ${tasa}% de interés mensual simple. Después de ${meses} ${meses === 1 ? 'mes' : 'meses'}, ¿cuánto dinero tenés en total (capital + interés)?`,
      operandos: { tipo: 'interes_simple_total', capital, tasa, meses },
      respuestaCorrecta,
      explicacionError: `Cada mes ganás un interés del ${tasa}% sobre tu capital original: $${capital} × ${tasa/100} = $${(capital * tasa / 100).toLocaleString('es-AR')} al mes. En ${meses} meses, acumulás $${(capital * (tasa / 100) * meses).toLocaleString('es-AR')} de interés. Al sumarlo a tu capital inicial ($${capital.toLocaleString('es-AR')}), tenés en total $${respuestaCorrecta.toLocaleString('es-AR')}.`,
      comodinPista: `Pista: Primero calculá el interés acumulado en los ${meses} meses y sumáselo a tu capital inicial.`,
      puntos: PUNTOS_NUM,
    };
  },
 
  // ── INTERÉS COMPUESTO ─────────────────────────────────────────────────────
  interes_compuesto_mc(semilla, userRole) {
    const rng = crearGeneradorSemilla(semilla);
    const { precioMin, precioMax, tasaMax } = obtenerLimites(userRole);
    const capital = enteroAleatorio(rng, precioMin / 100, precioMax / 100) * 100;
    const tasa = enteroAleatorio(rng, 1, Math.min(tasaMax, 5));
    const periodos = enteroAleatorio(rng, 2, 4);
    const respuestaCorrecta = Math.round(capital * Math.pow(1 + tasa / 100, periodos));
 
    return {
      id: 'interes-compuesto-mc',
      tipo: 'multiple_choice',
      enunciado: `Hacés un plazo fijo de $${capital.toLocaleString('es-AR')} al ${tasa}% mensual, capitalizable mensualmente, por ${periodos} meses. ¿Cuánto dinero tenés al vencer el plazo?`,
      opciones: opcionesMultiples(respuestaCorrecta, rng),
      operandos: { tipo: 'interes_compuesto', capital, tasa, periodos },
      respuestaCorrecta,
      explicacionError: `Con interés compuesto, al final de cada mes los intereses ganados se suman al capital, de forma que el mes siguiente generan nuevos intereses (capitalización). Usando la fórmula: Capital × (1 + tasa/100)^meses = $${capital.toLocaleString('es-AR')} × ${(1 + tasa/100).toFixed(2)}^${periodos} = $${respuestaCorrecta.toLocaleString('es-AR')}.`,
      comodinPista: `Pista: El capital crece multiplicándose por ${(1 + tasa/100).toFixed(2)} cada mes. Hacé la cuenta mes a mes o usá la potencia: Capital × ${(1 + tasa/100).toFixed(2)}^${periodos}.`,
      puntos: PUNTOS_MC,
    };
  },
 
  interes_compuesto_num(semilla, userRole) {
    const rng = crearGeneradorSemilla(semilla);
    const { precioMin, precioMax, tasaMax } = obtenerLimites(userRole);
    const capital = enteroAleatorio(rng, precioMin / 100, precioMax / 100) * 100;
    const tasa = enteroAleatorio(rng, 1, Math.min(tasaMax, 5));
    const periodos = enteroAleatorio(rng, 2, 3);
    const respuestaCorrecta = Math.round(capital * Math.pow(1 + tasa / 100, periodos));
 
    return {
      id: 'interes-compuesto-num',
      tipo: 'numeric',
      enunciado: `Invertís $${capital.toLocaleString('es-AR')} en un instrumento financiero al ${tasa}% mensual con capitalización. ¿Cuánto tenés después de ${periodos} meses? (Redondeá al peso)`,
      operandos: { tipo: 'interes_compuesto', capital, tasa, periodos },
      respuestaCorrecta,
      explicacionError: `Al capitalizarse mensualmente, los intereses se reinvierten. El cálculo es: Capital × (1 + tasa/100)^meses = $${capital.toLocaleString('es-AR')} × ${(1 + tasa/100).toFixed(2)}^${periodos} = $${respuestaCorrecta.toLocaleString('es-AR')}.`,
      comodinPista: `Pista: Multiplicá tu capital por ${(1 + tasa/100).toFixed(2)} tantas veces como periodos de meses transcurran.`,
      puntos: PUNTOS_NUM,
    };
  },

  // ── PRESUPUESTO ───────────────────────────────────────────────────────────
  presupuesto_mc(semilla, userRole) {
    const rng = crearGeneradorSemilla(semilla);
    const { precioMin, precioMax } = obtenerLimites(userRole);
    const ingreso = enteroAleatorio(rng, precioMin / 100, precioMax / 100) * 1000;
    const porcentaje = enteroAleatorio(rng, 10, 40);
    const respuestaCorrecta = Math.round(ingreso * porcentaje / 100);
    const rubros = ['alquiler', 'alimentación', 'transporte', 'servicios (luz, agua, gas)', 'salud'];
    const rubro = rubros[enteroAleatorio(rng, 0, rubros.length - 1)];
 
    return {
      id: 'presupuesto-mc',
      tipo: 'multiple_choice',
      enunciado: `Ganás $${ingreso.toLocaleString('es-AR')} por mes y querés destinar el ${porcentaje}% a ${rubro}. ¿Cuánto dinero es eso?`,
      opciones: opcionesMultiples(respuestaCorrecta, rng),
      operandos: { tipo: 'presupuesto', ingreso, porcentaje },
      respuestaCorrecta,
      explicacionError: `Para calcular el presupuesto destinado a ${rubro}, calculamos el ${porcentaje}% de $${ingreso.toLocaleString('es-AR')}: ($${ingreso.toLocaleString('es-AR')} × ${porcentaje}) ÷ 100 = $${respuestaCorrecta.toLocaleString('es-AR')}.`,
      comodinPista: `Pista: Multiplicá el ingreso total de $${ingreso.toLocaleString('es-AR')} por el porcentaje dividido 100 (es decir, por ${(porcentaje/100).toFixed(2)}).`,
      puntos: PUNTOS_MC,
    };
  },

  presupuesto_num(semilla, userRole) {
    const rng = crearGeneradorSemilla(semilla);
    const { precioMin, precioMax } = obtenerLimites(userRole);
    const ingreso = enteroAleatorio(rng, precioMin / 100, precioMax / 100) * 1000;
    const gastoFijo = enteroAleatorio(rng, Math.floor(ingreso * 0.2 / 1000), Math.floor(ingreso * 0.5 / 1000)) * 1000;
    const respuestaCorrecta = ingreso - gastoFijo;

    return {
      id: 'presupuesto-num',
      tipo: 'numeric',
      enunciado: `Tus ingresos mensuales son $${ingreso.toLocaleString('es-AR')}. Tus gastos fijos (alquiler, servicios, comida) suman $${gastoFijo.toLocaleString('es-AR')}. ¿Cuánto te queda disponible para ahorro o gastos variables?`,
      operandos: { tipo: 'presupuesto_disponible', ingreso, gastoFijo },
      respuestaCorrecta,
      explicacionError: `Dinero disponible = Ingresos − Gastos fijos = ${ingreso.toLocaleString('es-AR')} − ${gastoFijo.toLocaleString('es-AR')} = $${respuestaCorrecta.toLocaleString('es-AR')}.`,
      comodinPista: `Restá tus gastos fijos de tu ingreso total para saber cuánto te queda libre.`,
      puntos: PUNTOS_NUM,
    };
  },
};

// ─── Función principal exportada (usada por registry.js) ───────────────────
export function generarEjercicioEconomia(tipoGenerador, semilla, userRole = 'principiante') {
  const plantilla = PLANTILLAS[tipoGenerador];
  if (!plantilla) return null;
  return plantilla(semilla, userRole);
}

// ─── Resolver de respuesta (usado en validación) ───────────────────────────
export function resolverRespuestaEconomia(operandos, tipoGenerador = null) {
  const { tipo } = operandos;

  if (tipo === 'iva') {
    return Math.round(Number(operandos.precio) * (1 + Number(operandos.iva_pct) / 100));
  }
  if (tipo === 'regla3') {
    return Math.round((Number(operandos.precio1) * Number(operandos.cantidad2)) / Number(operandos.cantidad1));
  }
  if (tipo === 'interes_simple') {
    const { capital, tasa, meses } = operandos;
    return Math.round(Number(capital) * (Number(tasa) / 100) * Number(meses));
  }
  if (tipo === 'interes_simple_total') {
    const { capital, tasa, meses } = operandos;
    return capital + Math.round(Number(capital) * (Number(tasa) / 100) * Number(meses));
  }
  if (tipo === 'interes_compuesto') {
    const { capital, tasa, periodos } = operandos;
    return Math.round(Number(capital) * Math.pow(1 + Number(tasa) / 100, Number(periodos)));
  }
  if (tipo === 'presupuesto') {
    return Math.round(Number(operandos.ingreso) * Number(operandos.porcentaje) / 100);
  }
  if (tipo === 'presupuesto_disponible') {
    return Number(operandos.ingreso) - Number(operandos.gastoFijo);
  }

  return null;
}

export const TIPOS_ECONOMIA = Object.keys(PLANTILLAS);
