const MS_24H = 24 * 60 * 60 * 1000;

function toDate(valor) {
  if (!valor) return null;
  if (valor.toDate) return valor.toDate();
  if (valor instanceof Date) return valor;
  return new Date(valor);
}

function esMismoDiaCalendario(a, b, timezone = 'America/Argentina/Buenos_Aires') {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(a) === formatter.format(b);
  } catch (err) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}

/**
 * Evalúa y actualiza la racha empática (premia el hábito, no la perfección).
 * Se invoca tras validación exitosa o intento significativo en micro-lección.
 *
 * @returns {{ rachaDias, recordRacha, ultimaLeccionCompletada, rachaRota, mensajeRacha? }}
 */
export function evaluarRacha(usuario, ahora = new Date(), timezone = 'America/Argentina/Buenos_Aires') {
  const rachaActual = usuario.rachaDias ?? 0;
  const recordActual = usuario.recordRacha ?? 0;
  const ultima = toDate(usuario.ultimaLeccionCompletada);

  // Primer hábito del usuario
  if (!ultima) {
    return {
      rachaDias: 1,
      recordRacha: Math.max(recordActual, 1),
      ultimaLeccionCompletada: ahora,
      rachaRota: false,
    };
  }

  const diffMs = ahora.getTime() - ultima.getTime();

  // Más de 24 h: la racha "se lavó el mate"
  if (diffMs > MS_24H) {
    const nuevoRecord = Math.max(recordActual, rachaActual);
    return {
      rachaDias: 1,
      recordRacha: nuevoRecord,
      ultimaLeccionCompletada: ahora,
      rachaRota: rachaActual > 0,
      mensajeRacha: rachaActual > 0 ? 'Se lavó el mate: empezá una racha nueva hoy.' : undefined,
    };
  }

  // Mismo día calendario: mantener racha
  if (esMismoDiaCalendario(ultima, ahora, timezone)) {
    return {
      rachaDias: Math.max(rachaActual, 1),
      recordRacha: recordActual,
      ultimaLeccionCompletada: ahora,
      rachaRota: false,
    };
  }

  // Nuevo día dentro de la ventana de 48 h: incrementar racha
  const nuevaRacha = rachaActual <= 0 ? 1 : rachaActual + 1;
  return {
    rachaDias: nuevaRacha,
    recordRacha: Math.max(recordActual, nuevaRacha),
    ultimaLeccionCompletada: ahora,
    rachaRota: false,
  };
}
