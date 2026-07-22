/**
 * Servicio de Logros (Badges) — Mate-Mático
 * Calcula los logros desbloqueados de forma pura, sin escritura a BD.
 */

export const CATALOGO_LOGROS = [
  // Inicio
  { id: 'primer-paso',       emoji: '🌱', nombre: 'Primer Paso',           descripcion: 'Completaste tu primera lección',                           categoria: 'inicio'  },
  // Racha
  { id: 'racha-3',           emoji: '🎯', nombre: 'Racha de 3 días',        descripcion: '3 días consecutivos de práctica',                          categoria: 'racha'   },
  { id: 'racha-7',           emoji: '🔥', nombre: 'Racha de 7 días',        descripcion: '7 días consecutivos de práctica',                          categoria: 'racha'   },
  { id: 'racha-30',          emoji: '⚡', nombre: 'Racha de 30 días',       descripcion: '30 días consecutivos de práctica',                         categoria: 'racha'   },
  // Lecciones — Aritmética
  { id: 'maestro-suma',      emoji: '➕', nombre: 'Maestro de la Suma',     descripcion: 'Completaste la lección de Suma básica',                    categoria: 'leccion' },
  { id: 'rey-resta',         emoji: '➖', nombre: 'Rey de la Resta',        descripcion: 'Completaste la lección de Resta básica',                   categoria: 'leccion' },
  { id: 'as-multiplicacion', emoji: '✖️', nombre: 'As de la Multiplicación',descripcion: 'Completaste la lección de Multiplicación',                 categoria: 'leccion' },
  { id: 'divisor-elite',     emoji: '➗', nombre: 'Divisor de Élite',       descripcion: 'Completaste la lección de División',                       categoria: 'leccion' },
  // Lecciones — Porcentajes
  { id: 'experto-pct',       emoji: '💯', nombre: 'Experto en Porcentajes', descripcion: 'Completaste la lección de Porcentajes',                    categoria: 'leccion' },
  // Lecciones — Economía
  { id: 'experto-iva',       emoji: '🧾', nombre: 'Experto en IVA',         descripcion: 'Completaste la lección de IVA y precios',                  categoria: 'leccion' },
  { id: 'calc-proporciones', emoji: '⚖️', nombre: 'Calculador de proporciones', descripcion: 'Completaste la lección de Regla de tres',             categoria: 'leccion' },
  { id: 'ahorrador',         emoji: '💰', nombre: 'Ahorrador Inteligente',  descripcion: 'Completaste la lección de Interés simple',                 categoria: 'leccion' },
  { id: 'inversor',          emoji: '📈', nombre: 'Inversor Junior',        descripcion: 'Completaste la lección de Interés compuesto',              categoria: 'leccion' },
  // Módulos completos
  { id: 'economista-hogar',  emoji: '🏠', nombre: 'Economista del Hogar',   descripcion: 'Completaste todas las lecciones de Economía doméstica',    categoria: 'modulo'  },
  { id: 'base-aritmetica',   emoji: '🧮', nombre: 'Base Aritmética',        descripcion: 'Completaste todas las lecciones de Base aritmética',       categoria: 'modulo'  },
  // Puntaje
  { id: 'pts-100',           emoji: '⭐', nombre: '100 Puntos',             descripcion: 'Acumulaste 100 puntos totales',                            categoria: 'puntaje' },
  { id: 'pts-500',           emoji: '🥈', nombre: 'Nivel Intermedio',       descripcion: 'Alcanzaste el rango Intermedio (500 puntos)',               categoria: 'puntaje' },
  { id: 'pts-1500',          emoji: '🥇', nombre: 'Nivel Avanzado',         descripcion: 'Alcanzaste el rango Avanzado (1.500 puntos)',               categoria: 'puntaje' },
];

/**
 * Calcula qué logros tiene desbloqueados el usuario.
 * @param {object} user   — documento del usuario de Firestore
 * @param {object} progreso — { modulos: { [moduleId]: { lecciones: { [lessonId]: { completada, ... } } } } }
 * @returns {Array} — CATALOGO_LOGROS con campo `desbloqueado: boolean` en cada item
 */
export function calcularLogros(user, progreso) {
  const modulos = progreso?.modulos || {};

  const leccionCompletada = (moduleId, lessonId) => {
    const mod = modulos[moduleId];
    if (!mod) return false;
    const lecciones = mod.lecciones || mod.lessons || {};
    return !!(lecciones[lessonId]?.completada || lecciones[lessonId]?.completed);
  };

  const totalLecciones = Object.values(modulos).reduce((acc, mod) => {
    const lecciones = mod.lecciones || mod.lessons || {};
    return acc + Object.values(lecciones).filter(l => l.completada || l.completed).length;
  }, 0);

  const economialessonIds = ['iva-basico', 'regla-de-tres', 'interes-simple', 'interes-compuesto', 'presupuesto'];
  const economiaCompletas = economialessonIds.filter(id => leccionCompletada('economia', id)).length;

  const aritmeticaLessonIds = ['suma-basica', 'resta-basica', 'multiplicacion', 'division'];
  const aritmeticaCompletas = aritmeticaLessonIds.filter(id => leccionCompletada('aritmetica', id)).length;

  const puntos  = user?.puntosTotales ?? 0;
  const racha   = user?.rachaDias     ?? 0;

  const condiciones = {
    'primer-paso':       totalLecciones >= 1,
    'racha-3':           racha >= 3,
    'racha-7':           racha >= 7,
    'racha-30':          racha >= 30,
    'maestro-suma':      leccionCompletada('aritmetica', 'suma-basica'),
    'rey-resta':         leccionCompletada('aritmetica', 'resta-basica'),
    'as-multiplicacion': leccionCompletada('aritmetica', 'multiplicacion'),
    'divisor-elite':     leccionCompletada('aritmetica', 'division'),
    'experto-pct':       leccionCompletada('porcentajes', 'concepto-porcentaje'),
    'experto-iva':       leccionCompletada('economia', 'iva-basico'),
    'calc-proporciones': leccionCompletada('economia', 'regla-de-tres'),
    'ahorrador':         leccionCompletada('economia', 'interes-simple'),
    'inversor':          leccionCompletada('economia', 'interes-compuesto'),
    'economista-hogar':  economiaCompletas >= 5,
    'base-aritmetica':   aritmeticaCompletas >= 4,
    'pts-100':           puntos >= 100,
    'pts-500':           puntos >= 500,
    'pts-1500':          puntos >= 1500,
  };

  return CATALOGO_LOGROS.map(logro => ({
    ...logro,
    desbloqueado: condiciones[logro.id] ?? false,
  }));
}
