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
  const secretKey = env.firebase.privateKey || 'mate-matico-secret-key-fallback';
  return createHmac('sha256', secretKey).update(encodedPayload).digest('base64url');
}

function createValidationToken(uid, exerciseId, correctAnswer) {
  const payload = Buffer.from(JSON.stringify({ uid: String(uid || 'dev_user'), exerciseId: String(exerciseId), correctAnswer: normalizeAnswer(correctAnswer), expiresAt: Date.now() + TTL_MS })).toString('base64url');
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
    const isUidMatch = payload.uid === String(uid || 'dev_user') || payload.uid === 'dev_user' || !uid;
    const isExerciseIdMatch = payload.exerciseId === String(exerciseId);
    return isUidMatch && isExerciseIdMatch && payload.expiresAt >= Date.now() ? payload : null;
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
    const p = randomInt(5, 50); const base = randomInt(10, 50) * 100; const res = (base * p) / 100;
    description = `Un producto cuesta $${base} y tiene un descuento del ${p}%. ¿Cuántos pesos te descuentan en total?`;
    correctAnswer = String(res);
    explanation = `Calculamos el ${p}% de $${base}: (${base} × ${p}) ÷ 100 = $${res}.`;
  }

  let answers = [];
  if (structure === 'multiple_choice') {
    const set = new Set([correctAnswer]);
    const num = Number(correctAnswer);
    if (!isNaN(num)) {
      while (set.size < 4) {
        const offset = randomInt(1, 12) * (Math.random() > 0.5 ? 1 : -1);
        const alt = num + offset;
        if (alt >= 0) set.add(String(alt));
      }
      answers = Array.from(set).sort(() => Math.random() - 0.5);
    } else {
      set.add('1/2'); set.add('3/4'); set.add('2/3'); set.add('1/4');
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

async function generateWithMathGen(input) {
  if (!env.gemini.apiKey) return null;
  if (!aiClient) {
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

async function generateWithGroq(input) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey || !groqKey.trim()) return null;

  const category = `${input.level}:${input.section}`;
  const previousDescriptions = recentDescriptions.get(category) ?? [];

  const systemInstruction = `Eres un talentoso profesor de matemáticas que crea ejercicios ingeniosos y educativos para alumnos en Argentina.
Diseñas un único problema de matemáticas en español rioplatense (usando vos, comprás, tenés) inventando valores numéricos lógicos, realistas y creativos.
Tema del ejercicio: ${input.section}
Nivel de dificultad: Nivel ${input.level} (0 = principiantes, 1 = intermedio, 2 = avanzado).
Tipo de respuesta: ${input.structure === 'multiple_choice' ? 'Opción Múltiple (4 respuestas posibles)' : 'Entrada libre de texto o número'}.

REGLA DE UNICIDAD CRÍTICA:
El ejercicio NO debe ser igual ni similar a estos problemas ya realizados:
${previousDescriptions.length ? JSON.stringify(previousDescriptions) : 'Ninguno todavía.'}

Devuelve EXCLUSIVAMENTE un objeto JSON válido con este formato:
{
  "description": "enunciado breve del problema",
  "type": "${input.structure}",
  "answers": ${input.structure === 'multiple_choice' ? '["opcion1", "opcion2", "opcion3", "opcion4"]' : '[]'},
  "correctAnswer": "respuesta_correcta",
  "hint": "pista sutil para el primer error (sin revelar la respuesta)",
  "explanation": "explicación del procedimiento paso a paso para el segundo error"
}`;

  const userPrompt = `Generá un nuevo problema matemático de nivel ${input.level} sobre "${input.section}". Formato "${input.structure}".`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqKey.trim()}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8
    })
  });

  if (!response.ok) {
    throw new Error(`Groq respondió ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Respuesta vacía de Groq');

  const generated = JSON.parse(text.trim());
  if (!generated.description || !generated.correctAnswer || !generated.hint || !generated.explanation) {
    throw new Error('Respuesta incompleta de Groq');
  }

  if (input.structure === 'multiple_choice') {
    if (!Array.isArray(generated.answers) || generated.answers.length !== 4 || !generated.answers.includes(String(generated.correctAnswer))) {
      const set = new Set([String(generated.correctAnswer), ...(generated.answers || []).map(String)]);
      while (set.size < 4) {
        const baseNum = Number(generated.correctAnswer);
        if (!isNaN(baseNum)) {
          set.add(String(baseNum + randomInt(1, 10)));
        } else {
          set.add(`Opción ${set.size + 1}`);
        }
      }
      generated.answers = Array.from(set).slice(0, 4);
    }
    generated.answers = shuffle(generated.answers);
  } else {
    generated.answers = [];
  }

  recentDescriptions.set(category, [...previousDescriptions, String(generated.description)].slice(-MAX_RECENT_EXERCISES));
  return generated;
}

export async function generateAiExercise(uid, input) {
  validateRequest(input);
  let generated;
  let source = 'groq';

  // 1. Intentar con Groq API (Llama 3.3) si GROQ_API_KEY está configurada
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
    try {
      generated = await generateWithGroq(input);
    } catch (err) {
      console.error('Error al generar con Groq API:', err.message);
    }
  }

  // 2. Intentar con Gemini API (GoogleGenAI) si GEMINI_API_KEY está configurada
  if (!generated && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    source = 'gemini';
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        generated = await generateWithMathGen(input);
        break;
      } catch (error) {
        const isTemporaryOverload = String(error?.message ?? error).includes('503');
        const needsRegeneration = error?.code === 'CONTENT_FILTER';
        if ((!isTemporaryOverload && !needsRegeneration) || attempt === 2) break;
        await wait(needsRegeneration ? 0 : 750 * (attempt + 1));
      }
    }
  }

  // 3. Fallback a Motor Local Adaptativo
  if (!generated) {
    console.log('💡 APIs externas no configuradas o indisponibles. Generando ejercicio con motor local adaptativo.');
    const loc = localExercise(input);
    generated = {
      description: loc.description,
      answers: loc.answers || [],
      correctAnswer: loc.correctAnswer,
      hint: 'Revisá los cálculos atentamente e intentá nuevamente.',
      explanation: loc.explanation
    };
    source = 'local';
  }

  const id = `ai_${randomUUID()}`;
  const exercise = { id, level: Number(input.level), section: input.section, description: String(generated.description).trim(), type: input.structure, answers: generated.answers.map(String), hint: String(generated.hint).trim(), explanation: String(generated.explanation).trim(), puntos: PUNTOS_EJERCICIO, createdAt: new Date().toISOString(), validationToken: createValidationToken(uid, id, generated.correctAnswer) };
  return { exercise, source };
}

export async function validateAiExercise(uid, { exerciseId, answer, validationToken, attempt = 1 }) {
  if (!exerciseId || answer === undefined || answer === null || String(answer).trim() === '') throw httpError('exerciseId y answer son obligatorios');
  const validation = readValidationToken(validationToken, uid, exerciseId);
  if (!validation) throw httpError('El ejercicio ya no está disponible. Generá uno nuevo.', 404);

  try {
    await registrarActividadEmpatica(uid);
  } catch (err) {
    console.log('💡 registrarActividadEmpatica offline:', err.message);
  }

  if (normalizeAnswer(answer) !== validation.correctAnswer) {
    let rolActual = 'principiante';
    try {
      const user = await obtenerUsuario(uid);
      if (user?.rolActual) rolActual = user.rolActual;
    } catch (uErr) {
      console.log('💡 obtenerUsuario offline:', uErr.message);
    }
    return { correcto: false, puntosGanados: 0, explicacionError: 'Todavía no es la respuesta correcta. Revisá el procedimiento e intentá otra vez.', habilitarComodin: true, rolActual };
  }
  const puntosGanados = pointsForAttempt(Math.max(1, Number(attempt) || 1));
  let recompensa = { puntosGanados, rachaActual: 1 };
  try {
    const res = await aplicarRecompensaActividad(uid, puntosGanados, { actualizarRacha: true });
    if (res) recompensa = res;
  } catch (err) {
    console.log('💡 Modo offline o usuario dev: Recompensa aplicada localmente.', err.message);
  }
  return { correcto: true, puntosGanados, ...recompensa };
}
