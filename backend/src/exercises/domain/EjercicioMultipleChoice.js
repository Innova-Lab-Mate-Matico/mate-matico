import { Ejercicio } from './Ejercicio.js';

export class EjercicioMultipleChoice extends Ejercicio {
  constructor(datos) {
    super(datos);
    this.opciones = datos.opciones ?? [];
  }

  validar(respuesta) {
    if (respuesta === null || respuesta === undefined) return false;
    return String(respuesta).trim().toLowerCase() === String(this.respuestaCorrecta).trim().toLowerCase();
  }
}
