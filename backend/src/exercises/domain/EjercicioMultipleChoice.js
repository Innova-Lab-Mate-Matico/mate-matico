import { Ejercicio } from './Ejercicio.js';

export class EjercicioMultipleChoice extends Ejercicio {
  constructor(datos) {
    super(datos);
    this.opciones = datos.opciones ?? [];
  }

  validar(respuesta) {
    if (respuesta === null || respuesta === undefined) return false;

    const rawUser = String(respuesta).trim().toLowerCase();
    const rawExpected = String(this.respuestaCorrecta).trim().toLowerCase();

    // 1. Coincidencia exacta de texto (ej: "Suma" === "Suma")
    if (rawUser === rawExpected) return true;

    // 2. Coincidencia ignorando el símbolo de moneda $ y espacios adicionales
    const cleanUser = rawUser.replace(/^\$\s*/, '').replace(/\s+/g, '').trim();
    const cleanExpected = rawExpected.replace(/^\$\s*/, '').replace(/\s+/g, '').trim();
    if (cleanUser === cleanExpected) return true;

    // 3. Coincidencia numérica (convertir texto numérico o con comas a números float)
    const numUser = parseFloat(cleanUser.replace(',', '.'));
    const numExpected = parseFloat(cleanExpected.replace(',', '.'));

    if (!isNaN(numUser) && !isNaN(numExpected)) {
      return Math.abs(numUser - numExpected) < 0.01;
    }

    return false;
  }
}
