import { EjercicioMultipleChoice } from './EjercicioMultipleChoice.js';
import { EjercicioNumerico } from './EjercicioNumerico.js';

export class FabricaEjercicios {
  static crear(datos) {
    switch (datos.tipo) {
      case 'multiple_choice':
        return new EjercicioMultipleChoice(datos);
      case 'numeric':
        return new EjercicioNumerico(datos);
      default:
        throw new Error(`Tipo de ejercicio no soportado: ${datos.tipo}`);
    }
  }
}
