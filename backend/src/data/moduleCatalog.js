/**
 * Catálogo de módulos y lecciones (metadatos).
 * Los ejercicios se generan dinámicamente vía src/exercises/registry.js
 */
export const moduleCatalog = [
  {
    id: 'aritmetica',
    title: 'Base aritmética',
    description: 'Sumar, restar, multiplicar y dividir',
    branch: 'aritmetica',
    order: 1,
    rolSugerido: 'principiante',
    levels: [
      {
        id: 'nivel-1',
        title: 'Nivel 1 — Operaciones básicas',
        difficulty: 1,
        lessons: [
          { id: 'suma-basica', title: 'Suma básica', durationMinutes: 4 },
        ],
      },
      {
        id: 'nivel-2',
        title: 'Nivel 2 — Operaciones combinadas',
        difficulty: 2,
        lessons: [
          { id: 'multiplicacion', title: 'Multiplicación', durationMinutes: 5 },
        ],
      },
    ],
  },
  {
    id: 'porcentajes',
    title: 'Porcentajes',
    description: 'Descuentos, aumentos y significado del %',
    branch: 'porcentajes',
    order: 2,
    rolSugerido: 'intermedio',
    levels: [
      {
        id: 'nivel-1',
        title: 'Nivel 1 — Qué es un porcentaje',
        difficulty: 1,
        lessons: [
          { id: 'concepto-porcentaje', title: 'Concepto de porcentaje', durationMinutes: 4 },
        ],
      },
      {
        id: 'nivel-2',
        title: 'Nivel 2 — Descuentos',
        difficulty: 2,
        lessons: [
          { id: 'descuentos', title: 'Calcular descuentos', durationMinutes: 5 },
        ],
      },
    ],
  },
  {
    id: 'fracciones',
    title: 'Fracciones y decimales',
    description: 'Relación fracción ↔ decimal en la vida cotidiana',
    branch: 'fracciones',
    order: 3,
    rolSugerido: 'intermedio',
    levels: [
      {
        id: 'nivel-1',
        title: 'Nivel 1 — Fracciones habituales',
        difficulty: 1,
        lessons: [
          { id: 'fracciones-basicas', title: 'Fracciones básicas', durationMinutes: 4 },
        ],
      },
    ],
  },
];

export function findModule(moduleId) {
  return moduleCatalog.find((m) => m.id === moduleId);
}

export function findLesson(moduleId, lessonId) {
  const mod = findModule(moduleId);
  if (!mod) return null;
  for (const level of mod.levels) {
    const lesson = level.lessons.find((l) => l.id === lessonId);
    if (lesson) return { module: mod, level, lesson };
  }
  return null;
}
