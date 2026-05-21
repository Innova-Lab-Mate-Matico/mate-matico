/** Arma opciones incorrectas plausibles para multiple choice */
export function opcionesMultiples(respuestaCorrecta, rng, cantidad = 4) {
  const correcta = Number(respuestaCorrecta);
  const opciones = new Set([String(correcta)]);

  while (opciones.size < cantidad) {
    const delta = enteroDesdeRng(rng, 1, 12) * (rng() > 0.5 ? 1 : -1);
    const candidata = correcta + delta;
    if (candidata >= 0 && candidata !== correcta) {
      opciones.add(String(candidata));
    }
  }

  return mezclar([...opciones], rng);
}

function enteroDesdeRng(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function mezclar(arr, rng) {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
