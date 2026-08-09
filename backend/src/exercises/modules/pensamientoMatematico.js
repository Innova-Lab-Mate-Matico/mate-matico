/**
 * MÓDULO DE EJERCICIOS DE PENSAMIENTO MATEMÁTICO — MATE-MÁTICO
 * Generadores dinámicos guiados por semilla y escalables según nivel de dificultad.
 */

function pseudoRandom(seed) {
  let x = Math.sin(Number(seed) || 1) * 10000;
  return x - Math.floor(x);
}

function randomIntSeeded(seed, min, max) {
  return Math.floor(pseudoRandom(seed) * (max - min + 1)) + min;
}

const EMPRESAS = [
  'Supermercado Coto', 'Resto Bar La Plaza', 'Electrodomésticos Musimundo',
  'Librería Yenny', 'Ferretería Industrial', 'Indumentaria Solo Deportes',
  'Farmacia Central', 'Bazar El Progreso'
];

export function generarEjercicioDetective(seed = 1, userRole = 'principiante') {
  const seedNum = typeof seed === 'number' ? seed : (Number(seed) || 1);
  const isIntermedio = userRole === 'intermedio' || userRole === 1 || userRole === '1';
  const isAvanzado = userRole === 'avanzado' || userRole === 2 || userRole === '2';

  const baseMult = isAvanzado ? 50000 : isIntermedio ? 20000 : 10000;
  const factor = randomIntSeeded(seedNum, 1, 4);
  const subtotal = factor * baseMult; // e.g. $10.000, $20.000, $50.000...

  const archetype = Math.abs(Math.floor(seedNum)) % 3;

  if (archetype === 0) {
    // Caso 1: Descuento mal calculado (det-01)
    const pct = randomIntSeeded(seedNum + 1, 1, 3) * 10; // 10%, 20% o 30%
    const descuentoCorrecto = Math.round((subtotal * pct) / 100);
    const descuentoErrono = descuentoCorrecto + randomIntSeeded(seedNum + 2, 15, 30) * 100;
    const totalCobrado = subtotal - descuentoErrono;

    const empresa = EMPRESAS[Math.abs(Math.floor(seedNum)) % EMPRESAS.length];

    return {
      id: 'det-01',
      title: 'Factura con Descuento Incorrecto',
      consigna: `Mirá el siguiente ticket de ${empresa}. Se aplicó un ${pct}% de descuento sobre la compra, pero hay un error en la cuenta. ¿Dónde está la falla?`,
      tipo: 'detective',
      type: 'detective',
      ticket: {
        empresa,
        fecha: '08/08/2026',
        items: [
          { nombre: 'Producto Principal', precio: Math.round(subtotal * 0.6) },
          { nombre: 'Accesorios / Varios', precio: Math.round(subtotal * 0.4) }
        ],
        subtotal,
        descuentoTexto: `Descuento Especial ${pct}%`,
        descuentoAplicado: descuentoErrono,
        totalCobrado
      },
      opciones: [
        { id: 'opt-1', texto: `El subtotal de $${subtotal.toLocaleString('es-AR')} está mal sumado.` },
        { id: 'opt-2', texto: `El descuento del ${pct}% debió ser de $${descuentoCorrecto.toLocaleString('es-AR')}, no de $${descuentoErrono.toLocaleString('es-AR')}.`, correcta: true },
        { id: 'opt-3', texto: `El total cobrado de $${totalCobrado.toLocaleString('es-AR')} es correcto.` }
      ],
      pista: `Calculá el ${pct}% de $${subtotal.toLocaleString('es-AR')} (multiplicá por ${pct} y dividí por 100).`,
      explicacion: `¡Excelente trabajo de detective! El ${pct}% de $${subtotal.toLocaleString('es-AR')} es $${descuentoCorrecto.toLocaleString('es-AR')}. Aplicaron $${descuentoErrono.toLocaleString('es-AR')} por error.`
    };
  }

  if (archetype === 1) {
    // Caso 2: Recargo IVA Duplicado o Excesivo (det-02)
    const pct = 20;
    const recargoCorrecto = Math.round((subtotal * pct) / 100);
    const recargoErrono = recargoCorrecto * 2;
    const totalCobrado = subtotal + recargoErrono;

    const empresa = EMPRESAS[(Math.abs(Math.floor(seedNum)) + 1) % EMPRESAS.length];

    return {
      id: 'det-02',
      title: 'Ticket con Recargo Excesivo',
      consigna: `Revisá la cuenta de ${empresa}. Se cobró un recargo del ${pct}% sobre el consumo, pero el cobro final es incorrecto. ¿Cuál es el error?`,
      tipo: 'detective',
      type: 'detective',
      ticket: {
        empresa,
        fecha: '08/08/2026',
        items: [
          { nombre: 'Servicio / Consumo A', precio: Math.round(subtotal * 0.75) },
          { nombre: 'Servicio / Consumo B', precio: Math.round(subtotal * 0.25) }
        ],
        subtotal,
        recargoTexto: `Recargo Servicio ${pct}%`,
        descuentoAplicado: recargoErrono,
        totalCobrado
      },
      opciones: [
        { id: 'opt-1', texto: `El recargo del ${pct}% sobre $${subtotal.toLocaleString('es-AR')} debió ser $${recargoCorrecto.toLocaleString('es-AR')} en vez de $${recargoErrono.toLocaleString('es-AR')}.`, correcta: true },
        { id: 'opt-2', texto: 'Los consumos individuales están mal sumados.' },
        { id: 'opt-3', texto: `El subtotal de $${subtotal.toLocaleString('es-AR')} es incorrecto.` }
      ],
      pista: `Calculá el ${pct}% de $${subtotal.toLocaleString('es-AR')} (el 10% es $${Math.round(subtotal * 0.1).toLocaleString('es-AR')}, el doble es el 20%).`,
      explicacion: `¡Detección perfecta! El ${pct}% de $${subtotal.toLocaleString('es-AR')} es $${recargoCorrecto.toLocaleString('es-AR')}. Cobraron el doble ($${recargoErrono.toLocaleString('es-AR')}).`
    };
  }

  // Caso 3: Error en cantidad de ítems (det-03)
  const cant = randomIntSeeded(seedNum + 3, 3, 5);
  const precioUnit = randomIntSeeded(seedNum + 4, 2, 8) * 1000;
  const subtotalCorrecto = cant * precioUnit;
  const subtotalErrono = (cant + 2) * precioUnit;

  return {
    id: 'det-03',
    title: 'Error en Cantidad de Productos',
    consigna: `En la verdulería/bazar compraste ${cant} unidades de un producto a $${precioUnit.toLocaleString('es-AR')} cada una. Revisá el ticket de caja. ¿Qué error se cometió?`,
    tipo: 'detective',
    type: 'detective',
    ticket: {
      empresa: 'Bazar El Progreso',
      fecha: '08/08/2026',
      items: [
        { nombre: `Unidades (x${cant})`, precio: subtotalErrono }
      ],
      subtotal: subtotalErrono,
      descuentoTexto: null,
      totalCobrado: subtotalErrono
    },
    opciones: [
      { id: 'opt-1', texto: `Cobraron ${cant + 2} unidades ($${subtotalErrono.toLocaleString('es-AR')}) en lugar de ${cant} unidades ($${subtotalCorrecto.toLocaleString('es-AR')}).`, correcta: true },
      { id: 'opt-2', texto: 'El precio unitario mostrado es incorrecto.' },
      { id: 'opt-3', texto: 'El total cobrado no incluye los impuestos.' }
    ],
    pista: `Multiplicá las ${cant} unidades compradas por $${precioUnit.toLocaleString('es-AR')}.`,
    explicacion: `¡Impecable! ${cant} unidades a $${precioUnit.toLocaleString('es-AR')} suman $${subtotalCorrecto.toLocaleString('es-AR')}. En la caja cobraron ${cant + 2} unidades.`
  };
}

export function generarEjercicioDecision(seed = 1, userRole = 'principiante') {
  const seedNum = typeof seed === 'number' ? seed : (Number(seed) || 1);
  const isIntermedio = userRole === 'intermedio' || userRole === 1 || userRole === '1';
  const isAvanzado = userRole === 'avanzado' || userRole === 2 || userRole === '2';

  const archetype = Math.abs(Math.floor(seedNum)) % 6;
  const flipWinner = Math.abs(Math.floor(pseudoRandom(seedNum + 77) * 10)) % 2 === 0;

  // ─────────────────────────────────────────────────────────
  // CASO 0: Dilema de cuotas vs contado (dec-01)
  // ─────────────────────────────────────────────────────────
  if (archetype === 0) {
    const base = randomIntSeeded(seedNum, 10, 30) * 10000;
    let totalA, totalB, totalC, mejorOpcion;
    const cuotasB = 12;
    const cuotasC = 6;

    if (flipWinner) {
      totalA = Math.round(base * 0.75);
      totalB = Math.round(base * 1.20);
      totalC = Math.round(base * 1.05);
      mejorOpcion = 'A';
    } else {
      totalA = base;
      totalB = Math.round(base * 0.85);
      totalC = Math.round(base * 1.10);
      mejorOpcion = 'B';
    }

    const cuotaB = Math.round(totalB / cuotasB);
    const cuotaC = Math.round(totalC / cuotasC);
    const minTotal = mejorOpcion === 'A' ? totalA : totalB;

    return {
      id: 'dec-01',
      semilla: seedNum,
      title: (isIntermedio || isAvanzado) ? 'Dilema Financiero: 3 Opciones de Pago' : '¿Contado con Descuento o Cuotas Fijas?',
      consigna: `Querés comprar un equipo de $${base.toLocaleString('es-AR')}. Tenés distintas opciones de pago. ¿Cuál opción te otorga el MENOR costo total a pagar?`,
      tipo: 'decision', type: 'decision',
      opcionA: {
        id: 'A',
        titulo: flipWinner ? 'Opción A: Contado 25% OFF' : 'Opción A: Contado Precio de Lista',
        detalle: flipWinner ? '25% de Descuento Inmediato' : '1 solo pago sin descuento',
        montoTotal: totalA,
        subtexto: `Pagás $${totalA.toLocaleString('es-AR')} en total`
      },
      opcionB: {
        id: 'B',
        titulo: flipWinner ? `Opción B: ${cuotasB} Cuotas con Interés` : `Opción B: ${cuotasB} Cuotas Promo Banco`,
        detalle: `${cuotasB} cuotas de $${cuotaB.toLocaleString('es-AR')}`,
        montoTotal: totalB,
        subtexto: `Pagás $${totalB.toLocaleString('es-AR')} en total`
      },
      opcionC: (isIntermedio || isAvanzado) ? {
        id: 'C', titulo: `Opción C: ${cuotasC} Cuotas Fijas`,
        detalle: `${cuotasC} cuotas de $${cuotaC.toLocaleString('es-AR')}`,
        montoTotal: totalC,
        subtexto: `Pagás $${totalC.toLocaleString('es-AR')} en total`
      } : null,
      respuestaCorrecta: mejorOpcion, correctAnswer: mejorOpcion,
      pista: `Compará los totales: A ($${totalA.toLocaleString('es-AR')}), B ($${totalB.toLocaleString('es-AR')}).`,
      explicacion: `¡Excelente análisis! La Opción ${mejorOpcion} es la más conveniente con un desembolso total de $${minTotal.toLocaleString('es-AR')}.`
    };
  }

  // ─────────────────────────────────────────────────────────
  // CASO 1: Comparativa de precio por litro (dec-02)
  // ─────────────────────────────────────────────────────────
  if (archetype === 1) {
    const cantA = 3, cantB = 2.4;
    let p1, p2;
    if (flipWinner) {
      p1 = randomIntSeeded(seedNum + 1, 4, 6) * 1000;
      p2 = Math.round(p1 * 1.3);
    } else {
      p1 = randomIntSeeded(seedNum + 1, 7, 9) * 1000;
      p2 = Math.round(p1 * 0.45);
    }
    const precioLitroA = Math.round(p1 / cantA);
    const precioLitroB = Math.round(p2 / cantB);
    const mejorOpcion = precioLitroA < precioLitroB ? 'A' : 'B';
    const minPrecio = Math.min(precioLitroA, precioLitroB);
    const maxPrecio = Math.max(precioLitroA, precioLitroB);

    return {
      id: 'dec-02', semilla: seedNum,
      title: 'Comparativa de Supermercado: Rendimiento por Litro',
      consigna: `Vas a comprar detergente líquido. Opción A: Botella de ${cantA} Litros por $${p1.toLocaleString('es-AR')}. Opción B: Pack de ${cantB} Litros por $${p2.toLocaleString('es-AR')}. ¿Cuál rinde el MEJOR precio por litro?`,
      tipo: 'decision', type: 'decision',
      opcionA: { id: 'A', titulo: `Opción A: Botella ${cantA}L`, detalle: `Precio: $${p1.toLocaleString('es-AR')}`, montoTotal: p1, subtexto: `$${precioLitroA.toLocaleString('es-AR')} por litro` },
      opcionB: { id: 'B', titulo: `Opción B: Pack ${cantB}L`, detalle: `Precio: $${p2.toLocaleString('es-AR')}`, montoTotal: p2, subtexto: `$${precioLitroB.toLocaleString('es-AR')} por litro` },
      respuestaCorrecta: mejorOpcion, correctAnswer: mejorOpcion,
      pista: 'Dividí el precio total entre la cantidad de litros de cada opción.',
      explicacion: `¡Muy bien! La Opción ${mejorOpcion} rinde mejor ($${minPrecio.toLocaleString('es-AR')}/L vs $${maxPrecio.toLocaleString('es-AR')}/L).`
    };
  }

  // ─────────────────────────────────────────────────────────
  // CASO 2: Precio por kilo — Carnicería (dec-03)
  // ─────────────────────────────────────────────────────────
  if (archetype === 2) {
    const cortes = ['asado', 'vacío', 'nalga', 'bife de chorizo', 'pollo entero'];
    const corte = cortes[Math.abs(seedNum) % cortes.length];
    const kgA = randomIntSeeded(seedNum, 2, 5);
    const kgB = kgA + randomIntSeeded(seedNum + 1, 1, 3);
    let precioA, precioB;
    if (flipWinner) {
      precioA = randomIntSeeded(seedNum + 2, 4, 7) * 1000 * kgA;
      precioB = Math.round(precioA / kgA * 1.25) * kgB;
    } else {
      precioB = randomIntSeeded(seedNum + 2, 4, 7) * 1000 * kgB;
      precioA = Math.round(precioB / kgB * 1.30) * kgA;
    }
    const pkA = Math.round(precioA / kgA);
    const pkB = Math.round(precioB / kgB);
    const mejorOpcion = pkA < pkB ? 'A' : 'B';
    const minP = Math.min(pkA, pkB);
    const maxP = Math.max(pkA, pkB);

    return {
      id: 'dec-03', semilla: seedNum,
      title: 'Carnicería: ¿Cuál Bandeja Conviene Más?',
      consigna: `Querés comprar ${corte}. Opción A: Bandeja de ${kgA} kg por $${precioA.toLocaleString('es-AR')}. Opción B: Bandeja de ${kgB} kg por $${precioB.toLocaleString('es-AR')}. ¿Cuál tiene el MENOR precio por kilo?`,
      tipo: 'decision', type: 'decision',
      opcionA: { id: 'A', titulo: `Opción A: ${kgA} kg`, detalle: `Total: $${precioA.toLocaleString('es-AR')}`, montoTotal: precioA, subtexto: `$${pkA.toLocaleString('es-AR')} por kg` },
      opcionB: { id: 'B', titulo: `Opción B: ${kgB} kg`, detalle: `Total: $${precioB.toLocaleString('es-AR')}`, montoTotal: precioB, subtexto: `$${pkB.toLocaleString('es-AR')} por kg` },
      respuestaCorrecta: mejorOpcion, correctAnswer: mejorOpcion,
      pista: 'Dividí el precio total de cada bandeja entre los kilos para obtener el precio por kilo.',
      explicacion: `¡Genial! La Opción ${mejorOpcion} sale más barata por kilo ($${minP.toLocaleString('es-AR')}/kg vs $${maxP.toLocaleString('es-AR')}/kg).`
    };
  }

  // ─────────────────────────────────────────────────────────
  // CASO 3: Suscripción mensual vs anual (dec-04)
  // ─────────────────────────────────────────────────────────
  if (archetype === 3) {
    const servicios = ['streaming de películas', 'música online', 'almacenamiento en la nube', 'gimnasio virtual', 'app de idiomas'];
    const servicio = servicios[Math.abs(seedNum) % servicios.length];
    const mensual = randomIntSeeded(seedNum + 1, 3, 12) * 1000;
    const costoAnualMensual = mensual * 12;
    let anual, mejorOpcion;
    if (flipWinner) {
      anual = Math.round(costoAnualMensual * 0.70);
      mejorOpcion = 'B';
    } else {
      anual = Math.round(costoAnualMensual * 1.05);
      mejorOpcion = 'A';
    }
    const mensualEquivAnual = Math.round(anual / 12);
    const minMes = Math.min(mensual, mensualEquivAnual);
    const maxMes = Math.max(mensual, mensualEquivAnual);

    return {
      id: 'dec-04', semilla: seedNum,
      title: 'Suscripción: ¿Mensual o Anual?',
      consigna: `Querés contratar un servicio de ${servicio}. Opción A: Plan Mensual a $${mensual.toLocaleString('es-AR')}/mes. Opción B: Plan Anual a $${anual.toLocaleString('es-AR')} (un solo pago). ¿Cuál te sale MÁS barato por mes?`,
      tipo: 'decision', type: 'decision',
      opcionA: { id: 'A', titulo: 'Opción A: Plan Mensual', detalle: `$${mensual.toLocaleString('es-AR')} por mes`, montoTotal: costoAnualMensual, subtexto: `$${costoAnualMensual.toLocaleString('es-AR')} al año (12 pagos)` },
      opcionB: { id: 'B', titulo: 'Opción B: Plan Anual', detalle: `$${anual.toLocaleString('es-AR')} pago único`, montoTotal: anual, subtexto: `Equivale a $${mensualEquivAnual.toLocaleString('es-AR')}/mes` },
      respuestaCorrecta: mejorOpcion, correctAnswer: mejorOpcion,
      pista: 'Calculá cuánto te sale por mes cada plan: el anual dividilo entre 12.',
      explicacion: `¡Bien pensado! La Opción ${mejorOpcion} te sale $${minMes.toLocaleString('es-AR')}/mes vs $${maxMes.toLocaleString('es-AR')}/mes de la otra.`
    };
  }

  // ─────────────────────────────────────────────────────────
  // CASO 4: Alquiler de auto — por día vs por semana (dec-05)
  // ─────────────────────────────────────────────────────────
  if (archetype === 4) {
    const dias = randomIntSeeded(seedNum, 5, 10);
    const precioDia = randomIntSeeded(seedNum + 1, 15, 35) * 1000;
    const totalDiario = precioDia * dias;
    let totalSemanal, mejorOpcion;
    const semanas = Math.ceil(dias / 7);

    if (flipWinner) {
      totalSemanal = Math.round(precioDia * 7 * semanas * 0.75);
      mejorOpcion = 'B';
    } else {
      totalSemanal = Math.round(precioDia * 7 * semanas * 1.10);
      mejorOpcion = 'A';
    }
    const costoDiarioSemanal = Math.round(totalSemanal / dias);
    const minDia = Math.min(precioDia, costoDiarioSemanal);
    const maxDia = Math.max(precioDia, costoDiarioSemanal);

    return {
      id: 'dec-05', semilla: seedNum,
      title: 'Alquiler de Auto: ¿Por Día o Por Semana?',
      consigna: `Necesitás alquilar un auto por ${dias} días. Opción A: Tarifa diaria de $${precioDia.toLocaleString('es-AR')}/día (total $${totalDiario.toLocaleString('es-AR')}). Opción B: Pack semanal por $${totalSemanal.toLocaleString('es-AR')} (${semanas} semana/s). ¿Cuál te sale MÁS barato en total?`,
      tipo: 'decision', type: 'decision',
      opcionA: { id: 'A', titulo: 'Opción A: Tarifa Diaria', detalle: `$${precioDia.toLocaleString('es-AR')} × ${dias} días`, montoTotal: totalDiario, subtexto: `Total: $${totalDiario.toLocaleString('es-AR')}` },
      opcionB: { id: 'B', titulo: `Opción B: Pack ${semanas} Semana/s`, detalle: `Pago fijo semanal`, montoTotal: totalSemanal, subtexto: `Total: $${totalSemanal.toLocaleString('es-AR')}` },
      respuestaCorrecta: mejorOpcion, correctAnswer: mejorOpcion,
      pista: 'Compará el total de ambas opciones para la misma cantidad de días.',
      explicacion: `¡Correcto! La Opción ${mejorOpcion} te ahorra plata: te sale $${minDia.toLocaleString('es-AR')}/día vs $${maxDia.toLocaleString('es-AR')}/día.`
    };
  }

  // ─────────────────────────────────────────────────────────
  // CASO 5: Combo de restaurante vs items sueltos (dec-06)
  // ─────────────────────────────────────────────────────────
  const restos = ['Burger King', 'McDonald\'s', 'Mostaza', 'Wendy\'s', 'KFC'];
  const resto = restos[Math.abs(seedNum) % restos.length];
  const precioBurger = randomIntSeeded(seedNum + 1, 4, 8) * 1000;
  const precioPapas = randomIntSeeded(seedNum + 2, 2, 5) * 1000;
  const precioBebida = randomIntSeeded(seedNum + 3, 1, 3) * 1000;
  const totalSuelto = precioBurger + precioPapas + precioBebida;
  let precioCombo, mejorOpcion;
  if (flipWinner) {
    precioCombo = Math.round(totalSuelto * 0.75);
    mejorOpcion = 'B';
  } else {
    precioCombo = Math.round(totalSuelto * 1.10);
    mejorOpcion = 'A';
  }

  return {
    id: 'dec-06', semilla: seedNum,
    title: `${resto}: ¿Combo o Items Sueltos?`,
    consigna: `En ${resto}, podés pedir los productos por separado: Hamburguesa $${precioBurger.toLocaleString('es-AR')} + Papas $${precioPapas.toLocaleString('es-AR')} + Bebida $${precioBebida.toLocaleString('es-AR')} (Total: $${totalSuelto.toLocaleString('es-AR')}). O elegir el Combo por $${precioCombo.toLocaleString('es-AR')}. ¿Qué conviene MÁS?`,
    tipo: 'decision', type: 'decision',
    opcionA: { id: 'A', titulo: 'Opción A: Items Sueltos', detalle: `Hamburguesa + Papas + Bebida`, montoTotal: totalSuelto, subtexto: `Total: $${totalSuelto.toLocaleString('es-AR')}` },
    opcionB: { id: 'B', titulo: 'Opción B: Combo', detalle: `Los 3 productos juntos`, montoTotal: precioCombo, subtexto: `Total: $${precioCombo.toLocaleString('es-AR')}` },
    respuestaCorrecta: mejorOpcion, correctAnswer: mejorOpcion,
    pista: 'Sumá los precios individuales y compará con el precio del combo.',
    explicacion: `¡Bien calculado! La Opción ${mejorOpcion} te sale más barata: $${Math.min(totalSuelto, precioCombo).toLocaleString('es-AR')} vs $${Math.max(totalSuelto, precioCombo).toLocaleString('es-AR')}.`
  };
}

export function generarEjercicioEstimacion(seed = 1, userRole = 'principiante') {
  const seedNum = typeof seed === 'number' ? seed : (Number(seed) || 1);
  const isIntermedio = userRole === 'intermedio' || userRole === 1 || userRole === '1';
  const isAvanzado = userRole === 'avanzado' || userRole === 2 || userRole === '2';

  const archetype = Math.abs(Math.floor(seedNum)) % 6;

  // ─────────────────────────────────────────────────────────
  // CASO 0: Suma de productos en supermercado (est-01)
  // ─────────────────────────────────────────────────────────
  if (archetype === 0) {
    const cant = isAvanzado ? 6 : isIntermedio ? 5 : 4;
    const precios = [];
    for (let i = 0; i < cant; i++) {
      precios.push(randomIntSeeded(seedNum + i, 8, 35) * 1000);
    }
    const totalExacto = precios.reduce((a, b) => a + b, 0);
    const base = isAvanzado ? 5000 : 1000;
    const estimacionCorrecta = Math.round(totalExacto / base) * base;
    const distractorMenos = estimacionCorrecta - base * (isAvanzado ? 3 : 5);
    const distractorMas = estimacionCorrecta + base * (isAvanzado ? 4 : 6);

    return {
      id: 'est-01', semilla: seedNum,
      title: 'Estimación Rápida en el Super',
      consigna: `Comprás ${cant} productos que cuestan: ${precios.map(p => `$${p.toLocaleString('es-AR')}`).join(', ')}. Sin calculadora, ¿cuál es la estimación MÁS CERCANA al total?`,
      tipo: 'estimacion', type: 'estimacion',
      opciones: [
        { id: 'opt-1', texto: `Alrededor de $${distractorMenos.toLocaleString('es-AR')}` },
        { id: 'opt-2', texto: `Alrededor de $${estimacionCorrecta.toLocaleString('es-AR')}`, correcta: true },
        { id: 'opt-3', texto: `Alrededor de $${distractorMas.toLocaleString('es-AR')}` }
      ],
      pista: `Redondeá cada precio al millar más cercano y sumalos mentalmente.`,
      explicacion: `¡Exacto! La suma exacta es $${totalExacto.toLocaleString('es-AR')}, que redondeada queda en ~$${estimacionCorrecta.toLocaleString('es-AR')}.`
    };
  }

  // ─────────────────────────────────────────────────────────
  // CASO 1: Propina en restaurante (est-02)
  // ─────────────────────────────────────────────────────────
  if (archetype === 1) {
    const pct = isAvanzado ? randomIntSeeded(seedNum + 1, 12, 18) : isIntermedio ? 15 : 10;
    const cuenta = randomIntSeeded(seedNum, 3, 12) * 10000;
    const propinaExacta = Math.round(cuenta * pct / 100);
    const propinaRedondeada = Math.round(propinaExacta / 1000) * 1000;
    const d1 = propinaRedondeada - 2000;
    const d2 = propinaRedondeada + 3000;

    return {
      id: 'est-02', semilla: seedNum,
      title: 'Estimá la Propina del Restaurante',
      consigna: `La cuenta en el restaurante fue de $${cuenta.toLocaleString('es-AR')}. Querés dejar una propina del ${pct}%. Sin calculadora, ¿cuánto sería aproximadamente?`,
      tipo: 'estimacion', type: 'estimacion',
      opciones: [
        { id: 'opt-1', texto: `Aproximadamente $${d1.toLocaleString('es-AR')}` },
        { id: 'opt-2', texto: `Aproximadamente $${propinaRedondeada.toLocaleString('es-AR')}`, correcta: true },
        { id: 'opt-3', texto: `Aproximadamente $${d2.toLocaleString('es-AR')}` }
      ],
      pista: `Para calcular el ${pct}%, dividí la cuenta entre 100 y multiplicá por ${pct}.`,
      explicacion: `¡Correcto! El ${pct}% de $${cuenta.toLocaleString('es-AR')} es exactamente $${propinaExacta.toLocaleString('es-AR')}, o sea ~$${propinaRedondeada.toLocaleString('es-AR')}.`
    };
  }

  // ─────────────────────────────────────────────────────────
  // CASO 2: Precio por unidad / precio unitario (est-03)
  // ─────────────────────────────────────────────────────────
  if (archetype === 2) {
    const productos = ['sachets de leche', 'latas de atún', 'barras de chocolate', 'botellas de agua', 'bolsas de arroz'];
    const producto = productos[Math.abs(seedNum) % productos.length];
    const unidades = randomIntSeeded(seedNum, 6, 20);
    const precioTotal = randomIntSeeded(seedNum + 1, 5, 30) * unidades * 100;
    const precioUnitExacto = Math.round(precioTotal / unidades);
    const precioUnitRedondeado = Math.round(precioUnitExacto / 100) * 100;
    const d1 = precioUnitRedondeado - 500;
    const d2 = precioUnitRedondeado + 600;

    return {
      id: 'est-03', semilla: seedNum,
      title: 'Estimá el Precio por Unidad',
      consigna: `Un pack de ${unidades} ${producto} cuesta $${precioTotal.toLocaleString('es-AR')} en total. Sin calculadora, ¿cuánto cuesta aproximadamente cada unidad?`,
      tipo: 'estimacion', type: 'estimacion',
      opciones: [
        { id: 'opt-1', texto: `Alrededor de $${d1.toLocaleString('es-AR')} por unidad` },
        { id: 'opt-2', texto: `Alrededor de $${precioUnitRedondeado.toLocaleString('es-AR')} por unidad`, correcta: true },
        { id: 'opt-3', texto: `Alrededor de $${d2.toLocaleString('es-AR')} por unidad` }
      ],
      pista: `Dividí el precio total ($${precioTotal.toLocaleString('es-AR')}) entre la cantidad de unidades (${unidades}).`,
      explicacion: `¡Muy bien! $${precioTotal.toLocaleString('es-AR')} ÷ ${unidades} unidades = $${precioUnitExacto.toLocaleString('es-AR')} exactos (~$${precioUnitRedondeado.toLocaleString('es-AR')} aprox).`
    };
  }

  // ─────────────────────────────────────────────────────────
  // CASO 3: Estimación de descuento (est-04)
  // ─────────────────────────────────────────────────────────
  if (archetype === 3) {
    const pct = isAvanzado ? randomIntSeeded(seedNum + 2, 3, 7) * 5 : isIntermedio ? 30 : 20;
    const precio = randomIntSeeded(seedNum, 4, 15) * 10000;
    const ahorroExacto = Math.round(precio * pct / 100);
    const ahorroRedondeado = Math.round(ahorroExacto / 1000) * 1000;
    const precioFinalExacto = precio - ahorroExacto;
    const precioFinalRedondeado = Math.round(precioFinalExacto / 1000) * 1000;
    const d1 = precioFinalRedondeado - 5000;
    const d2 = precioFinalRedondeado + 6000;

    return {
      id: 'est-04', semilla: seedNum,
      title: `Estimá el Precio con ${pct}% OFF`,
      consigna: `Un producto vale $${precio.toLocaleString('es-AR')} y está en ${pct}% de descuento. Sin calculadora, ¿cuánto pagarías aproximadamente?`,
      tipo: 'estimacion', type: 'estimacion',
      opciones: [
        { id: 'opt-1', texto: `Alrededor de $${d1.toLocaleString('es-AR')}` },
        { id: 'opt-2', texto: `Alrededor de $${precioFinalRedondeado.toLocaleString('es-AR')}`, correcta: true },
        { id: 'opt-3', texto: `Alrededor de $${d2.toLocaleString('es-AR')}` }
      ],
      pista: `Calculá el ${pct}% del precio ($${ahorroRedondeado.toLocaleString('es-AR')}) y restalo del total.`,
      explicacion: `¡Genial! El ${pct}% de $${precio.toLocaleString('es-AR')} = $${ahorroExacto.toLocaleString('es-AR')}, por lo que el precio final es $${precioFinalExacto.toLocaleString('es-AR')} (~$${precioFinalRedondeado.toLocaleString('es-AR')}).`
    };
  }

  // ─────────────────────────────────────────────────────────
  // CASO 4: Estimación de sueldo mensual vs. gastos (est-05)
  // ─────────────────────────────────────────────────────────
  if (archetype === 4) {
    const sueldo = randomIntSeeded(seedNum, 8, 25) * 50000;
    const alquiler = randomIntSeeded(seedNum + 1, 3, 7) * 50000;
    const comida = randomIntSeeded(seedNum + 2, 2, 5) * 50000;
    const servicios = randomIntSeeded(seedNum + 3, 1, 3) * 20000;
    const totalGastos = alquiler + comida + servicios;
    const sobrante = sueldo - totalGastos;
    const sobranteRedondeado = Math.round(sobrante / 10000) * 10000;
    const d1 = sobranteRedondeado - 50000;
    const d2 = sobranteRedondeado + 60000;

    return {
      id: 'est-05', semilla: seedNum,
      title: 'Estimá el Dinero que Sobra del Sueldo',
      consigna: `Ganás $${sueldo.toLocaleString('es-AR')} por mes. Tus gastos son: alquiler $${alquiler.toLocaleString('es-AR')}, comida $${comida.toLocaleString('es-AR')} y servicios $${servicios.toLocaleString('es-AR')}. ¿Cuánto te quedará aproximadamente?`,
      tipo: 'estimacion', type: 'estimacion',
      opciones: [
        { id: 'opt-1', texto: `Aproximadamente $${d1.toLocaleString('es-AR')}` },
        { id: 'opt-2', texto: `Aproximadamente $${sobranteRedondeado.toLocaleString('es-AR')}`, correcta: true },
        { id: 'opt-3', texto: `Aproximadamente $${d2.toLocaleString('es-AR')}` }
      ],
      pista: `Sumá todos los gastos y restá del sueldo: $${sueldo.toLocaleString('es-AR')} - ($${alquiler.toLocaleString('es-AR')} + $${comida.toLocaleString('es-AR')} + $${servicios.toLocaleString('es-AR')}).`,
      explicacion: `¡Muy bien! Total gastos: $${totalGastos.toLocaleString('es-AR')}. Te quedan exactamente $${sobrante.toLocaleString('es-AR')} (~$${sobranteRedondeado.toLocaleString('es-AR')}).`
    };
  }

  // ─────────────────────────────────────────────────────────
  // CASO 5: Estimación de ahorro a varios meses (est-06)
  // ─────────────────────────────────────────────────────────
  const meses = randomIntSeeded(seedNum, 4, 12);
  const ahorroPorMes = randomIntSeeded(seedNum + 1, 3, 15) * 10000;
  const totalExacto = ahorroPorMes * meses;
  const totalRedondeado = Math.round(totalExacto / 50000) * 50000;
  const meta = randomIntSeeded(seedNum + 2, 2, 6) * totalRedondeado;
  const d1 = totalRedondeado - 50000;
  const d2 = totalRedondeado + 80000;

  return {
    id: 'est-06', semilla: seedNum,
    title: 'Estimá tus Ahorros a Varios Meses',
    consigna: `Lográs ahorrar $${ahorroPorMes.toLocaleString('es-AR')} por mes. Si mantenés ese ritmo durante ${meses} meses, ¿a cuánto llegarán tus ahorros aproximadamente?`,
    tipo: 'estimacion', type: 'estimacion',
    opciones: [
      { id: 'opt-1', texto: `Alrededor de $${d1.toLocaleString('es-AR')}` },
      { id: 'opt-2', texto: `Alrededor de $${totalRedondeado.toLocaleString('es-AR')}`, correcta: true },
      { id: 'opt-3', texto: `Alrededor de $${d2.toLocaleString('es-AR')}` }
    ],
    pista: `Multiplicá $${ahorroPorMes.toLocaleString('es-AR')} × ${meses} meses.`,
    explicacion: `¡Excelente! $${ahorroPorMes.toLocaleString('es-AR')} × ${meses} meses = $${totalExacto.toLocaleString('es-AR')} exactos (~$${totalRedondeado.toLocaleString('es-AR')}).`
  };
}

export function resolverRespuestaPensamiento(exercise, userResponse) {
  if (!exercise) return { correcto: false, retroalimentacion: 'Revisá la opción elegida.' };

  const { type, tipo, opciones, respuestaCorrecta } = exercise;
  const currentType = type || tipo;
  const userStr = String(userResponse || '').trim().toLowerCase();
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();
  const userNorm = norm(userResponse);

  if (currentType === 'detective' || currentType === 'estimacion' || currentType === 'detective_mc' || currentType === 'estimacion_mc') {
    const optMatch = (opciones || []).find(o => {
      const idStr = String(o.id || '').trim().toLowerCase();
      if (idStr === userStr) return true;
      const oNorm = norm(o.texto);
      if (oNorm === userNorm) return true;
      if (userNorm.length > 8 && (oNorm.includes(userNorm) || userNorm.includes(oNorm))) return true;
      return false;
    });

    const esCorrecto = optMatch ? !!optMatch.correcta : false;
    return {
      correcto: esCorrecto,
      retroalimentacion: esCorrecto ? exercise.explicacion : 'Esa opción no señala el error exacto. ' + exercise.pista
    };
  }

  if (currentType === 'decision' || currentType === 'decision_mc') {
    const targetStr = String(respuestaCorrecta || 'A').trim().toLowerCase();
    const esCorrecto = userStr === targetStr || (userStr && targetStr.includes(userStr));
    return {
      correcto: esCorrecto,
      retroalimentacion: esCorrecto ? exercise.explicacion : 'Esa opción no es la más económica. ' + exercise.pista
    };
  }

  return { correcto: false, retroalimentacion: 'Revisá la opción elegida.' };
}
