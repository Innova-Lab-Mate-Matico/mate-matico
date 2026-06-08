import { Ejercicio } from './Ejercicio.js';

export class EjercicioNumerico extends Ejercicio {
  constructor(datos) {
    super(datos);
  }

  validar(respuesta) {
    const userNum = Number(respuesta);
    const expectedNum = Number(this.respuestaCorrecta);

    if (Number.isNaN(userNum) || Number.isNaN(expectedNum)) {
      return false;
    }

    return Math.abs(userNum - expectedNum) < 0.01;
  }
}
