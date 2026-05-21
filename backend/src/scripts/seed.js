import { db } from '../config/firebase.js';
import { moduleCatalog } from '../data/moduleCatalog.js';
import { LECCION_GENERADORES } from '../exercises/registry.js';
import { generarEjercicioAritmetica } from '../exercises/modules/aritmeticaBasica.js';
import { generarEjercicioPorcentajes } from '../exercises/modules/porcentajes.js';
import { generarEjercicioFracciones } from '../exercises/modules/fracciones.js';

const GENERADORES = {
  aritmetica: generarEjercicioAritmetica,
  porcentajes: generarEjercicioPorcentajes,
  fracciones: generarEjercicioFracciones,
};

async function seed() {
  const batch = db.batch();

  for (const mod of moduleCatalog) {
    batch.set(db.collection('modulos').doc(mod.id), {
      titulo: mod.title,
      descripcion: mod.description,
      orden: mod.order,
      rolSugerido: mod.rolSugerido,
      actualizadoEn: new Date().toISOString(),
    });
  }

  for (const [moduleId, lecciones] of Object.entries(LECCION_GENERADORES)) {
    const generar = GENERADORES[moduleId];
    for (const [lessonId, tipos] of Object.entries(lecciones)) {
      for (const tipo of tipos) {
        const ej = generar(tipo, 42);
        if (!ej) continue;
        const docId = `${moduleId}_${lessonId}_${ej.id}`;
        batch.set(db.collection('plantillasEjercicio').doc(docId), {
          moduleId,
          lessonId,
          exerciseId: ej.id,
          tipoGenerador: tipo,
          explicacionError: ej.explicacionError,
          comodinPista: ej.comodinPista,
          actualizadoEn: new Date().toISOString(),
        });
      }
    }
  }

  await batch.commit();
  console.log('Seed OK: modulos + plantillasEjercicio');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error en seed:', err.message);
  process.exit(1);
});
