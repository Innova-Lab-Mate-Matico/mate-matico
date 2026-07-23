import { Ejercicio } from './Ejercicio.js';

export class EjercicioNumerico extends Ejercicio {
  constructor(datos) {
    super(datos);
  }

  validar(respuesta) {
    if (respuesta === null || respuesta === undefined) return false;

    const cleanUser = String(respuesta).replace(/^\$\s*/, '').replace(/\s+/g, '').replace(',', '.').trim();
    const cleanExpected = String(this.respuestaCorrecta).replace(/^\$\s*/, '').replace(/\s+/g, '').replace(',', '.').trim();

    const userNum = parseFloat(cleanUser);
    const expectedNum = parseFloat(cleanExpected);

    if (Number.isNaN(userNum) || Number.isNaN(expectedNum)) {
      return cleanUser.toLowerCase() === cleanExpected.toLowerCase();
    }

    return Math.abs(userNum - expectedNum) < 0.01;
  }
}
