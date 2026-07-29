import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../config/env.js';
import { aplicarRecompensaActividad, obtenerUsuario, registrarActividadEmpatica } from './usuario.service.js';

const PUNTOS_EJERCICIO = 10;
const TTL_MS = 30 * 60 * 1000;
const MAX_RECENT_EXERCISES = 25;
const recentDescriptions = new Map();
const SECCIONES = ['Suma y Resta', 'Multiplicación', 'División', 'Fracciones', 'Ecuaciones'];
const TIPOS = ['multiple_choice', 'input'];
const PROHIBITED_WORDS = /\bconchas?\b/iu;
let aiClient;

function httpError(message, status = 400) { const error = new Error(message); error.status = status; return error; }
function normalizeAnswer(value) { return String(value).trim().replace(',', '.').toLowerCase(); }
function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}
function pointsForAttempt(attempt) {
  if (attempt <= 1) return 10;
  if (attempt === 2) return 5;
  return 0;
}
function hasInappropriateVocabulary(exercise) {
  return [exercise.description, exercise.hint, exercise.explanation]
    .filter(Boolean)
    .some((text) => PROHIBITED_WORDS.test(String(text)));
}

function sign(encodedPayload) {
  return createHmac('sha256', env.firebase.privateKey).update(encodedPayload).digest('base64url');
}

function createValidationToken(uid, exerciseId, correctAnswer) {
  const payload = Buffer.from(JSON.stringify({ uid, exerciseId, correctAnswer: normalizeAnswer(correctAnswer), expiresAt: Date.now() + TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function readValidationToken(token, uid, exerciseId) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [encodedPayload, signature] = token.split('.');
  const received = Buffer.from(signature);
  const expected = Buffer.from(sign(encodedPayload));
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    return payload.uid === uid && payload.exerciseId === exerciseId && payload.expiresAt >= Date.now() ? payload : null;
  } catch { return null; }
}

function validateRequest({ level, section, structure }) {
  if (![0, 1, 2].includes(Number(level))) throw httpError('Nivel de dificultad inválido');
  if (!SECCIONES.includes(section)) throw httpError('Apartado temático inválido');
  if (!TIPOS.includes(structure)) throw httpError('Estructura de respuesta inválida');
}

// Portado de MathGen 1.0. Solo se usa cuando Gemini no está disponible.
function localExercise({ level, section, structure }) {
  const numericLevel = Number(level);
  const limit = numericLevel === 0 ? 10 : numericLevel === 1 ? 100 : 1000;
  const a = randomInt(1, limit + 1);
  const b = randomInt(1, limit + 1);
  let description; let correctAnswer; let explanation;

  if (section === 'Suma y Resta') {
    if (Math.random() > 0.5) {
      const sum = a + b;
      description = `En una tienda de juguetes hay ${a} canicas azules y ${b} canicas rojas. ¿Cuántas canicas hay en total en la tienda?`;
      correctAnswer = String(sum);
      explanation = `Sumamos las canicas azules (${a}) y rojas (${b}): ${a} + ${b} = ${sum}. El total es ${sum} canicas.`;
    } else {
      const mayor = Math.max(a, b); const menor = Math.min(a, b); const diff = mayor - menor;
      description = `Sofía tiene ${mayor} manzanas en su canasto y decide regalarle ${menor} a su hermano menor. ¿Cuántas manzanas le quedan a Sofía?`;
      correctAnswer = String(diff);
      explanation = `Restamos las manzanas regaladas (${menor}) al total original (${mayor}): ${mayor} - ${menor} = ${diff}.`;
    }
  } else if (section === 'Multiplicación') {
    const x = numericLevel === 0 ? randomInt(2, 10) : randomInt(3, 18);
    const y = numericLevel === 0 ? randomInt(2, 10) : randomInt(3, 15);
    description = `Un granjero organiza sus siembras en ${x} filas. Si cada fila contiene ${y} plantas, ¿cuántas plantas tiene sembradas en total?`;
    correctAnswer = String(x * y);
    explanation = `Multiplicamos las filas (${x}) por las plantas de cada fila (${y}): ${x} × ${y} = ${correctAnswer}.`;
  } else if (section === 'División') {
    const divisor = randomInt(2, 10); const quotient = randomInt(2, numericLevel === 0 ? 12 : numericLevel === 1 ? 30 : 100); const total = divisor * quotient;
    description = `Queremos repartir ${total} alfajores de chocolate en partes iguales entre ${divisor} amigos. ¿Cuántos alfajores le corresponden a cada uno?`;
    correctAnswer = String(quotient);
    explanation = `Dividimos ${total} alfajores entre ${divisor} amigos: ${total} ÷ ${divisor} = ${quotient}.`;
  } else if (section === 'Fracciones') {
    const denominator = numericLevel === 0 ? randomInt(3, 9) : randomInt(5, 13); const numerator = randomInt(1, denominator);
    description = `Una pizza se divide en ${denominator} partes iguales y se comen ${numerator}. ¿Qué fracción de la pizza se comió? Escribila como a/b.`;
    correctAnswer = `${numerator}/${denominator}`;
    explanation = `Se comieron ${numerator} de las ${denominator} partes iguales: ${correctAnswer}.`;
  } else {
    const x = randomInt(2, numericLevel === 0 ? 12 : numericLevel === 1 ? 30 : 100); const coefficient = randomInt(2, numericLevel === 0 ? 6 : 12); const right = coefficient * x;
    description = `Resuelve la ecuación de primer grado: ${coefficient}x = ${right}. ¿Cuál es el valor de x?`;
    correctAnswer = String(x);
    explanation = `Para despejar x dividimos ambos lados entre ${coefficient}: x = ${right} ÷ ${coefficient} = ${x}.`;
  }

  let answers = [];
  if (structure === 'multiple_choice') {
    if (section === 'Fracciones') {
      const [n, d] = correctAnswer.split('/').map(Number);
      answers = [correctAnswer, `${Math.min(n + 1, d)}/${d}`, `${n}/${d + 1}`, `${d}/${n}`];
    } else {
      const set = new Set([correctAnswer]);
      while (set.size < 4) { const distractor = Number(correctAnswer) + randomInt(-7, 8); if (distractor >= 0 && distractor !== Number(correctAnswer)) set.add(String(distractor)); }
      answers = Array.from(set).sort(() => Math.random() - 0.5);
    }
  }
  return { description, correctAnswer, explanation, answers };
}

function extractJson(text) { const match = text.match(/\{[\s\S]*\}/); if (!match) throw new Error('Gemini no devolvió JSON'); return JSON.parse(match[0]); }

async function generateWithGemini(input) {
  if (!env.gemini.apiKey) return null;
  const category = `${input.level}:${input.section}`;
  const previousDescriptions = recentDescriptions.get(category) ?? [];
  const prompt = `Eres un talentoso profesor de matemáticas que crea ejercicios ingeniosos y educativos para alumnos. Diseña UN único problema en español rioplatense con números lógicos, realistas y creativos. Tema: ${input.section}. Nivel: ${input.level} (0 básico, 1 intermedio, 2 avanzado). Tipo obligatorio: ${input.structure}.\n\nREGLA DE UNICIDAD CRÍTICA: no repitas ni generes un problema similar a estos ya entregados durante esta sesión: ${previousDescriptions.length ? JSON.stringify(previousDescriptions) : 'Ninguno todavía.'}\n\nCreá una narrativa u operación fresca. Si type es multiple_choice, answers debe tener exactamente 4 alternativas plausibles, incluir correctAnswer y tener distractores inteligentes. Si type es input, answers debe ser []. explanation debe explicar el procedimiento paso a paso. Respondé exclusivamente JSON válido con description, type, answers, correctAnswer y explanation; sin Markdown.`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.gemini.model)}:generateContent?key=${encodeURIComponent(env.gemini.apiKey)}`;
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.9 } }), signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Gemini respondió ${response.status}`);
  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('');
  const generated = extractJson(text ?? '');
  if (!generated.description || !generated.correctAnswer || !generated.explanation) throw new Error('Respuesta incompleta de Gemini');
  if (input.structure === 'multiple_choice' && (!Array.isArray(generated.answers) || generated.answers.length !== 4 || !generated.answers.includes(String(generated.correctAnswer)))) throw new Error('Opciones inválidas de Gemini');
  recentDescriptions.set(category, [...previousDescriptions, String(generated.description)].slice(-MAX_RECENT_EXERCISES));
  return { ...generated, answers: generated.answers ?? [] };
}

// Misma llamada estructurada que usa MathGen 1.0, adaptada al contrato de Mate-Mático.
async function generateWithMathGen(input) {
  if (!env.gemini.apiKey) return null;
  if (!aiClient) {
    // El SDK prioriza GOOGLE_API_KEY si ambas variables existen en el entorno.
    // Mate-Mático debe usar exclusivamente la clave configurada para Gemini.
    delete process.env.GOOGLE_API_KEY;
    process.env.GEMINI_API_KEY = env.gemini.apiKey;
    aiClient = new GoogleGenAI({ apiKey: env.gemini.apiKey });
  }

  const category = `${input.level}:${input.section}`;
  const previousDescriptions = recentDescriptions.get(category) ?? [];
  const systemInstruction = `Eres un talentoso profesor de matemáticas que crea ejercicios ingeniosos y educativos para alumnos.
Diseñas un único problema de matemáticas en español inventando valores numéricos lógicos, realistas y creativos.
Tema del ejercicio: ${input.section}
Nivel de dificultad: Nivel ${input.level} (0 = principiantes, 1 = intermedio, 2 = avanzado).
Tipo de respuesta: ${input.structure === 'multiple_choice' ? 'Opción Múltiple (4 respuestas posibles)' : 'Entrada libre de texto'}.

REGLA DE UNICIDAD CRÍTICA:
El ejercicio NO debe ser igual ni similar a estos problemas ya realizados para este nivel y sección:
${previousDescriptions.length ? JSON.stringify(previousDescriptions) : 'Ninguno todavía.'}

Crea una narrativa fresca u operación original. Evita repetir personajes, contextos o enunciados.`;
  const userPrompt = `Genera un nuevo problema matemático de nivel ${input.level} sobre "${input.section}".
El tipo debe ser "${input.structure}".
- Si es multiple_choice, incluye exactamente 4 opciones en answers: una correcta y tres distractores inteligentes.
- Ubicá la respuesta correcta en una posición aleatoria; no la priorices en A ni B.
- Si es input, answers debe ser [].
- hint es obligatorio: debe ser un consejo breve para el primer error. No puede contener la respuesta correcta, el resultado numérico, ni un procedimiento resuelto.
- explanation es obligatoria: debe contener la solución y el procedimiento paso a paso. Solo se mostrará desde el segundo error.
No incluyas la solución ni el resultado final en hint.
Usá vocabulario apropiado para estudiantes en Argentina: no uses las palabras "concha" ni "conchas"; si necesitás hablar de animales marinos, usá "caracol" o "caracoles".`;

  const response = await aiClient.models.generateContent({
    model: env.gemini.model,
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          type: { type: Type.STRING },
          answers: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswer: { type: Type.STRING },
          hint: { type: Type.STRING },
          explanation: { type: Type.STRING },
        },
        required: ['description', 'type', 'answers', 'correctAnswer', 'hint', 'explanation'],
      },
    },
  });
  if (!response.text) throw new Error('No se recibió respuesta del modelo de IA.');
  const generated = JSON.parse(response.text.trim());
  if (!generated.description || !generated.correctAnswer || !generated.hint || !generated.explanation) throw new Error('Respuesta incompleta de Gemini');
  if (input.structure === 'multiple_choice' && (!Array.isArray(generated.answers) || generated.answers.length !== 4 || !generated.answers.includes(String(generated.correctAnswer)))) throw new Error('Opciones inválidas de Gemini');
  if (hasInappropriateVocabulary(generated)) {
    const error = new Error('El ejercicio contiene vocabulario no apto para el contexto educativo argentino.');
    error.code = 'CONTENT_FILTER';
    throw error;
  }
  recentDescriptions.set(category, [...previousDescriptions, String(generated.description)].slice(-MAX_RECENT_EXERCISES));
  return { ...generated, answers: input.structure === 'multiple_choice' ? shuffle(generated.answers) : [] };
}

export async function generateAiExercise(uid, input) {
  validateRequest(input);
  let generated;
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      generated = await generateWithMathGen(input);
      break;
    } catch (error) {
      lastError = error;
      const isTemporaryOverload = String(error?.message ?? error).includes('503');
      const needsRegeneration = error?.code === 'CONTENT_FILTER';
      if ((!isTemporaryOverload && !needsRegeneration) || attempt === 2) break;
      await wait(needsRegeneration ? 0 : 750 * (attempt + 1));
    }
  }
  if (lastError && !generated) {
    console.error('Falló la generación con Gemini.', lastError.message);
    throw httpError('Gemini está con alta demanda. Probá nuevamente en unos segundos.', 503);
  }
  if (!generated) throw httpError('Gemini no está configurado para generar ejercicios.', 503);
  const id = `ai_${randomUUID()}`;
  const exercise = { id, level: Number(input.level), section: input.section, description: String(generated.description).trim(), type: input.structure, answers: generated.answers.map(String), hint: String(generated.hint).trim(), explanation: String(generated.explanation).trim(), puntos: PUNTOS_EJERCICIO, createdAt: new Date().toISOString(), validationToken: createValidationToken(uid, id, generated.correctAnswer) };
  return { exercise, source: 'gemini' };
}

export async function validateAiExercise(uid, { exerciseId, answer, validationToken, attempt = 1 }) {
  if (!exerciseId || answer === undefined || answer === null || String(answer).trim() === '') throw httpError('exerciseId y answer son obligatorios');
  const validation = readValidationToken(validationToken, uid, exerciseId);
  if (!validation) throw httpError('El ejercicio ya no está disponible. Generá uno nuevo.', 404);
  await registrarActividadEmpatica(uid);
  if (normalizeAnswer(answer) !== validation.correctAnswer) {
    const user = await obtenerUsuario(uid);
    return { correcto: false, puntosGanados: 0, explicacionError: 'Todavía no es la respuesta correcta. Revisá el procedimiento e intentá otra vez.', habilitarComodin: true, rolActual: user?.rolActual ?? 'principiante' };
  }
  const puntosGanados = pointsForAttempt(Math.max(1, Number(attempt) || 1));
  const recompensa = await aplicarRecompensaActividad(uid, puntosGanados, { actualizarRacha: true });
  return { correcto: true, puntosGanados, ...recompensa };
}
