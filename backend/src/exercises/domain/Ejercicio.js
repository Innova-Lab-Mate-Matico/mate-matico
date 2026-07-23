export class Ejercicio {
  constructor(datos) {
    if (this.constructor === Ejercicio) {
      throw new Error("No podés instanciar una clase abstracta directamente.");
    }
    this.id = datos.id;
    this.tipo = datos.tipo;
    this.enunciado = datos.enunciado;
    this.puntos = datos.puntos ?? 10;
    this.comodinPista = datos.comodinPista ?? null;
    this.explicacionError = datos.explicacionError ?? null;
    this.operandos = datos.operandos ?? {};
    this.respuestaCorrecta = datos.respuestaCorrecta;
    this.semilla = datos.semilla ?? null;
    this.tipoGenerador = datos.tipoGenerador ?? null;
  }

  /**
   * Genera dinámicamente un ejercicio a partir de una semilla numérica.
   * @abstract
   * @param {number} semilla 
   * @returns {Ejercicio}
   */
  generar(semilla) {
    throw new Error("El método generar(semilla) debe ser implementado.");
  }

  /**
   * Compara la respuesta del usuario con la correcta.
   * @abstract
   * @param {any} respuesta 
   * @returns {boolean}
   */
  validar(respuesta) {
    throw new Error("El método validar(respuesta) debe ser implementado.");
  }

  /**
   * Filtra campos sensibles antes de mandar el ejercicio al Frontend.
   * @returns {Object}
   */
  serializarParaCliente() {
    return {
      id: this.id,
      tipo: this.tipo,
      tipoGenerador: this.tipoGenerador,
      enunciado: this.enunciado,
      puntos: this.puntos,
      operandos: this.operandos,
      semilla: this.semilla,
      comodinPista: this.comodinPista,
      ...(this.opciones ? { opciones: this.opciones } : {})
    };
  }
}
