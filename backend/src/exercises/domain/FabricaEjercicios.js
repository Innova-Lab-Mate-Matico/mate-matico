import { EjercicioMultipleChoice } from './EjercicioMultipleChoice.js';
import { EjercicioNumerico } from './EjercicioNumerico.js';

export class FabricaEjercicios {
  static crear(datos) {
    const tipo = datos.tipo || datos.type;
    switch (tipo) {
      case 'multiple_choice':
        return new EjercicioMultipleChoice(datos);
      case 'numeric':
        return new EjercicioNumerico(datos);
      case 'detective':
      case 'decision':
      case 'estimacion':
        return {
          ...datos,
          tipo: tipo,
          type: tipo,
          validar(userResponse) {
            const userStr = String(userResponse || '').trim().toLowerCase();
            const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();
            const userNorm = norm(userResponse);

            if (tipo === 'detective' || tipo === 'estimacion') {
              const optMatch = (datos.opciones || []).find(o => {
                const idStr = String(o.id || '').trim().toLowerCase();
                if (idStr === userStr) return true;
                const oNorm = norm(o.texto);
                if (oNorm === userNorm) return true;
                if (userNorm.length > 8 && (oNorm.includes(userNorm) || userNorm.includes(oNorm))) return true;
                return false;
              });
              return optMatch ? !!optMatch.correcta : false;
            }
            if (tipo === 'decision') {
              const targetStr = String(datos.respuestaCorrecta || 'A').trim().toLowerCase();
              return userStr === targetStr || (userStr && targetStr.includes(userStr));
            }
            return false;
          },
          serializarParaCliente() {
            return {
              id: datos.id,
              semilla: datos.semilla,
              userRole: datos.userRole,
              tipo: tipo,
              type: tipo,
              title: datos.title,
              consigna: datos.consigna,
              ticket: datos.ticket,
              opciones: datos.opciones,
              opcionA: datos.opcionA,
              opcionB: datos.opcionB,
              opcionC: datos.opcionC,
              pista: datos.pista,
              explicacion: datos.explicacion,
              correctAnswer: datos.respuestaCorrecta || datos.correctAnswer
            };
          }
        };
      default:
        throw new Error(`Tipo de ejercicio no soportado: ${tipo}`);
    }
  }
}
