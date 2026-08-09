import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../config/env.js';
import { aplicarRecompensaActividad, obtenerUsuario, registrarActividadEmpatica } from './usuario.service.js';

const PUNTOS_EJERCICIO = 10;
const TTL_MS = 30 * 60 * 1000;
const MAX_RECENT_EXERCISES = 25;
const recentDescriptions = new Map();
const SECCIONES = ['Suma y Resta', 'Multiplicación', 'División', 'Fracciones', 'Ecuaciones', 'Pensamiento matemático'];
const TIPOS = ['multiple_choice', 'input', 'detective', 'decision'];
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
  } else if (section === 'Pensamiento matemático' || structure === 'detective' || structure === 'decision') {
    description = `En una factura de supermercado por $10.000 se aplicó un 10% de descuento pero se restaron $2.500 por error. ¿Dónde estuvo la falla?`;
    correctAnswer = `El 10% de $10.000 debió ser $1.000 en vez de $2.500.`;
    explanation = `El cajero restó $2.500 por error. El 10% de $10.000 es exactamente $1.000.`;
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
Tipo de respuesta: ${input.structure === 'input' ? 'Entrada libre de texto o número' : 'Opción Múltiple (4 respuestas posibles)'}.

REGLA DE UNICIDAD CRÍTICA:
El ejercicio NO debe ser igual ni similar a estos problemas ya realizados:
${previousDescriptions.length ? JSON.stringify(previousDescriptions) : 'Ninguno todavía.'}

Devuelve EXCLUSIVAMENTE un objeto JSON válido con este formato:
{
  "description": "enunciado breve del problema",
  "type": "${input.structure}",
  "answers": ${input.structure === 'input' ? '[]' : '["opcion1", "opcion2", "opcion3", "opcion4"]'},
  "correctAnswer": "respuesta_correcta",
  "hint": "pista sutil para el primer error (sin revelar la respuesta)",
  "explanation": "explicación del procedimiento paso a paso para el segundo error"
}`;

  let structurePrompt = `Generá un nuevo problema matemático de nivel ${input.level} sobre "${input.section}". Formato "${input.structure}".`;
  if (input.structure === 'detective') {
    structurePrompt = `Generá un ejercicio de DETECTIVE DE ERRORES de nivel ${input.level} sobre "${input.section}". Planteá la revisión de una factura, recibo o cálculo comercial donde se comete un error en un cobro, descuento o impuesto. En description detallá el caso. En answers poné 4 opciones que describan posibles errores en el ticket (una opción correcta y 3 distractores). En correctAnswer colocá exactamente el texto de la opción que señala la falla real.`;
  } else if (input.structure === 'decision') {
    structurePrompt = `Generá un ejercicio de DILEMA DE COMPRA de nivel ${input.level} sobre "${input.section}". Planteá una comparación estratégica entre dos alternativas financieras u ofertas (ej: descuento por pago en efectivo vs cuotas sin interés, o promoción 3x2 vs 20% descuento). En description explicá la situación. En answers poné 4 opciones descriptivas de la mejor decisión (una opción correcta y 3 distractores). En correctAnswer colocá la opción más conveniente.`;
  }

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
        { role: 'user', content: structurePrompt }
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

  if (input.structure !== 'input') {
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

  // Generadores multi-escenarios diversos para Detective y Decisiones
  if (input.structure === 'detective' && !generated.ticket) {
    const dev = generateDiverseDetective(input);
    generated.title = dev.title;
    generated.description = dev.consigna;
    generated.consigna = dev.consigna;
    generated.ticket = dev.ticket;
    generated.opciones = dev.opciones;
    generated.correctAnswer = dev.correctAnswer;
  }

  if (input.structure === 'decision') {
    const dev = generateDiverseDecision(input);
    generated.title = dev.title;
    generated.description = dev.consigna;
    generated.consigna = dev.consigna;
    generated.opcionA = dev.opcionA;
    generated.opcionB = dev.opcionB;
    generated.opcionC = dev.opcionC;
    generated.respuestaCorrecta = dev.respuestaCorrecta;
    generated.correctAnswer = dev.correctAnswer;
  }

  const id = `ai_${randomUUID()}`;
  const targetCorrect = String(generated.correctAnswer || generated.respuestaCorrecta || 'A');

  const exercise = {
    id,
    level: Number(input.level),
    section: input.section,
    description: String(generated.description || generated.consigna).trim(),
    consigna: String(generated.consigna || generated.description).trim(),
    title: String(generated.title || (input.structure === 'detective' ? 'Detective de errores' : 'Dilema de compra')).trim(),
    type: input.structure,
    answers: (generated.answers || []).map(String),
    opciones: generated.opciones || [],
    ticket: generated.ticket || null,
    opcionA: generated.opcionA || null,
    opcionB: generated.opcionB || null,
    opcionC: generated.opcionC || null,
    respuestaCorrecta: targetCorrect,
    hint: String(generated.hint || 'Revisá los valores e intentá de nuevo.').trim(),
    explanation: String(generated.explanation || 'Análisis detallado de la solución.').trim(),
    puntos: PUNTOS_EJERCICIO,
    createdAt: new Date().toISOString(),
    validationToken: createValidationToken(uid, id, targetCorrect)
  };
  return { exercise, source };
}

function isAnswerMatch(userAns, targetAns) {
  const normUser = normalizeAnswer(userAns);
  const normTarget = normalizeAnswer(targetAns);

  if (normUser === normTarget) return true;

  // Comparación por número extraído (ej. "6" vs "6 platos" o "6" vs "6.0")
  const userNum = (normUser.match(/-?\d+(\.\d+)?/) || [])[0];
  const targetNum = (normTarget.match(/-?\d+(\.\d+)?/) || [])[0];

  if (userNum && targetNum && userNum === targetNum) {
    return true;
  }

  return false;
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

  if (!isAnswerMatch(answer, validation.correctAnswer)) {
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

function generateDiverseDetective(input) {
  const mode = Math.random();
  const levelNum = Number(input.level) || 0;

  // Escalamiento de montos por nivel:
  // Nivel 0 (Principiante): $1.000 a $8.000, 10%
  // Nivel 1 (Intermedio): $10.000 a $40.000, 15% o 20%
  // Nivel 2 (Avanzado): $50.000 a $250.000, 21% IVA
  const subtotalBase = levelNum === 0 
    ? randomInt(2, 8) * 1000 
    : levelNum === 1 
      ? randomInt(10, 40) * 1000 
      : randomInt(50, 200) * 1000;

  const descPerc = levelNum === 0 ? 10 : levelNum === 1 ? 15 : 21;

  // MODO 1: TICKET 100% CORRECTO (El alumno debe verificar y confirmar que NO hay error)
  if (mode < 0.3) {
    const p1 = Math.round(subtotalBase * 0.6);
    const p2 = Math.round(subtotalBase * 0.4);
    const subtotal = p1 + p2;
    const correctDesc = Math.round((subtotal * descPerc) / 100);
    const total = subtotal - correctDesc;

    const consigna = `Auditá el siguiente ticket de compra por $${subtotal.toLocaleString('es-AR')}. Se aplicó un ${descPerc}% de descuento. ¿Existe algún error en la liquidación?`;
    const opciones = shuffle([
      { id: 'opt-1', texto: `El ticket es 100% correcto: el ${descPerc}% de $${subtotal.toLocaleString('es-AR')} es $${correctDesc.toLocaleString('es-AR')} y el total de $${total.toLocaleString('es-AR')} está perfecto.`, correcta: true },
      { id: 'opt-2', texto: `El subtotal está mal sumado en el ticket.` },
      { id: 'opt-3', texto: `El descuento del ${descPerc}% debió ser de $${(correctDesc + 1000).toLocaleString('es-AR')}.` }
    ]);
    const correctOpt = opciones.find(o => o.correcta);

    return {
      title: 'Auditoría de Ticket: ¿Hay Falla o Está Correcto?',
      consigna,
      ticket: {
        empresa: levelNum === 0 ? 'Almacén de Barrio Don Pedro' : levelNum === 1 ? 'Supermercado Central' : 'Mega Mayorista Comercial',
        fecha: new Date().toLocaleDateString('es-AR'),
        items: [
          { nombre: 'Artículos Básicos', precio: p1 },
          { nombre: 'Productos Varios', precio: p2 }
        ],
        subtotal,
        descuentoTexto: `Descuento Especial ${descPerc}%`,
        descuentoAplicado: correctDesc,
        totalCobrado: total
      },
      opciones,
      correctAnswer: correctOpt.id
    };
  }

  // MODO 2: PREGUNTA POR LA CIFRA NUMÉRICA TOTAL CORRECTA ($)
  if (mode < 0.6) {
    const subtotal = subtotalBase;
    const correctDesc = Math.round((subtotal * descPerc) / 100);
    const errorDesc = correctDesc + (levelNum === 0 ? 500 : levelNum === 1 ? 2500 : 8000);
    const badTotal = subtotal - errorDesc;
    const realTotal = subtotal - correctDesc;

    const consigna = `En el siguiente ticket por $${subtotal.toLocaleString('es-AR')} se descontó $${errorDesc.toLocaleString('es-AR')} por error en lugar del ${descPerc}% correcto. ¿Cuál era el TOTAL CORRECTO que debió pagar el cliente?`;
    const opciones = shuffle([
      { id: 'opt-1', texto: `$${realTotal.toLocaleString('es-AR')} (Total correcto con ${descPerc}% de descuento)`, correcta: true },
      { id: 'opt-2', texto: `$${badTotal.toLocaleString('es-AR')} (Monto mal cobrado)` },
      { id: 'opt-3', texto: `$${(subtotal - Math.round(correctDesc / 2)).toLocaleString('es-AR')} (Cálculo incorrecto)` },
      { id: 'opt-4', texto: `$${subtotal.toLocaleString('es-AR')} (Sin aplicar ningún descuento)` }
    ]);
    const correctOpt = opciones.find(o => o.correcta);

    return {
      title: '¿Cuál era el Total Correcto a Cobrar?',
      consigna,
      ticket: {
        empresa: levelNum === 0 ? 'Kiosco Central' : levelNum === 1 ? 'Tienda de Indumentaria' : 'Distribuidora Tecnológica',
        fecha: new Date().toLocaleDateString('es-AR'),
        items: [
          { nombre: 'Compra del día', precio: subtotal }
        ],
        subtotal,
        descuentoTexto: `Descuento ${descPerc}%`,
        descuentoAplicado: errorDesc,
        totalCobrado: badTotal
      },
      opciones,
      correctAnswer: correctOpt.id
    };
  }

  // MODO 3: PREGUNTA POR LA DIFERENCIA EN PESOS COBRADA DE MÁS ($)
  if (mode < 0.8) {
    const subtotal = subtotalBase;
    const recargoPerc = levelNum === 0 ? 10 : 20;
    const correctRecargo = Math.round((subtotal * recargoPerc) / 100);
    const errorRecargo = correctRecargo * 2;
    const cobroExceso = errorRecargo - correctRecargo;
    const total = subtotal + errorRecargo;

    const consigna = `En una compra de $${subtotal.toLocaleString('es-AR')} cobraron $${errorRecargo.toLocaleString('es-AR')} de recargo en lugar del ${recargoPerc}% correcto ($${correctRecargo.toLocaleString('es-AR')}). ¿Cuántos pesos cobraron DE MÁS por este error?`;
    const opciones = shuffle([
      { id: 'opt-1', texto: `$${cobroExceso.toLocaleString('es-AR')} de más`, correcta: true },
      { id: 'opt-2', texto: `$${errorRecargo.toLocaleString('es-AR')} de más` },
      { id: 'opt-3', texto: `$${(cobroExceso * 2).toLocaleString('es-AR')} de más` }
    ]);
    const correctOpt = opciones.find(o => o.correcta);

    return {
      title: '¿Cuántos Pesos Cobraron de Más?',
      consigna,
      ticket: {
        empresa: levelNum === 0 ? 'Librería de Barrio' : levelNum === 1 ? 'Tienda de Electrodomésticos' : 'Importadora Industrial',
        fecha: new Date().toLocaleDateString('es-AR'),
        items: [
          { nombre: 'Equipos y Mercadería', precio: subtotal }
        ],
        subtotal,
        recargoTexto: `Recargo Tarjeta ${recargoPerc}%`,
        descuentoAplicado: errorRecargo,
        totalCobrado: total
      },
      opciones,
      correctAnswer: correctOpt.id
    };
  }

  // MODO 4: DETECTAR ERROR ESPECÍFICO EXPLICADO
  const p1 = Math.round(subtotalBase * 0.6);
  const p2 = Math.round(subtotalBase * 0.4);
  const subtotal = p1 + p2;
  const correctDesc = Math.round((subtotal * descPerc) / 100);
  const errorDesc = correctDesc + (levelNum === 0 ? 300 : levelNum === 1 ? 2000 : 7000);
  const total = subtotal - errorDesc;
  const consigna = `Revisá la liquidación de la compra por un subtotal de $${subtotal.toLocaleString('es-AR')}. Se debía aplicar un ${descPerc}% de descuento, pero se restaron $${errorDesc.toLocaleString('es-AR')}. ¿Dónde está la falla?`;

  const opciones = shuffle([
    { id: 'opt-1', texto: `El subtotal está mal sumado.` },
    { id: 'opt-2', texto: `El ${descPerc}% de $${subtotal.toLocaleString('es-AR')} debió ser $${correctDesc.toLocaleString('es-AR')}, no $${errorDesc.toLocaleString('es-AR')}.`, correcta: true },
    { id: 'opt-3', texto: `El cobro final está perfecto.` }
  ]);
  const correctOpt = opciones.find(o => o.correcta);

  return {
    title: 'Detección de Error en la Liquidación',
    consigna,
    ticket: {
      empresa: levelNum === 0 ? 'Pizzería de Barrio' : levelNum === 1 ? 'Restaurante Gourmet' : 'Cadena Gastronómica',
      fecha: new Date().toLocaleDateString('es-AR'),
      items: [
        { nombre: 'Consumo Principal', precio: p1 },
        { nombre: 'Bebidas y Adicionales', precio: p2 }
      ],
      subtotal,
      descuentoTexto: `Descuento Especial ${descPerc}%`,
      descuentoAplicado: errorDesc,
      totalCobrado: total
    },
    opciones,
    correctAnswer: correctOpt.id
  };
}

function generateDiverseDecision(input) {
  const levelNum = Number(input.level) || 0;

  // Estructura contenedora para barajar las opciones
  let options = [];
  let title = '';
  let consigna = '';

  // ESCENARIO PARA NIVEL 0 (PRINCIPIANTE - 2 OPCIONES)
  if (levelNum === 0) {
    const base = randomInt(1, 4) * 10000; // $10.000 a $40.000
    
    // Opción Contado (Suele ser la mejor por defecto, pero ahora la hacemos variable)
    const isContadoBetter = Math.random() > 0.4;
    const desc = isContadoBetter ? 15 : 5;
    const totalContado = Math.round(base * (1 - desc / 100));

    const cuotas = 3;
    // Si contado es mejor, las cuotas tienen recargo del 10%. Si cuotas es mejor, contado tiene poco descuento y cuotas tiene recargo del 0%.
    const recargoCuotas = isContadoBetter ? 10 : -5;
    const totalCuotas = Math.round(base * (1 + recargoCuotas / 100));
    const valorCuota = Math.round(totalCuotas / cuotas);

    const correctId = isContadoBetter ? 'CONTADO' : 'CUOTAS';

    title = 'Dilema de Compra: Contado vs 3 Cuotas';
    consigna = `Vas a realizar una compra por un total de $${base.toLocaleString('es-AR')}. Tenés dos opciones: una opción de pago contado con ${desc}% de descuento ($${totalContado.toLocaleString('es-AR')} final) o financiarlo en ${cuotas} cuotas de $${valorCuota.toLocaleString('es-AR')} ($${totalCuotas.toLocaleString('es-AR')} total). ¿Cuál es la opción que representa el MENOR desembolso total de dinero?`;

    options = [
      {
        realId: 'CONTADO',
        titulo: 'Pago Contado',
        detalle: `${desc}% Descuento Inmediato`,
        montoTotal: totalContado,
        subtexto: `Pagás $${totalContado.toLocaleString('es-AR')} hoy`
      },
      {
        realId: 'CUOTAS',
        titulo: `${cuotas} Cuotas Fijas`,
        detalle: `${cuotas} cuotas de $${valorCuota.toLocaleString('es-AR')}`,
        montoTotal: totalCuotas,
        subtexto: `Pagás $${totalCuotas.toLocaleString('es-AR')} en total`
      }
    ];

    // Barajamos
    options = shuffle(options);

    // Mapeamos a las variables de salida A y B.
    // Para nivel 0, la opcion C queda nula
    const correctIdx = options.findIndex(o => o.realId === correctId);
    const letterMapping = ['A', 'B'];
    const correctLetter = letterMapping[correctIdx];

    return {
      title,
      consigna,
      opcionA: {
        id: 'A',
        titulo: `Opción A: ${options[0].titulo}`,
        detalle: options[0].detalle,
        montoTotal: options[0].montoTotal,
        subtexto: options[0].subtexto
      },
      opcionB: {
        id: 'B',
        titulo: `Opción B: ${options[1].titulo}`,
        detalle: options[1].detalle,
        montoTotal: options[1].montoTotal,
        subtexto: options[1].subtexto
      },
      opcionC: null,
      respuestaCorrecta: correctLetter,
      correctAnswer: correctLetter
    };
  }

  // ESCENARIO PARA NIVEL 1 (INTERMEDIO - 3 OPCIONES)
  if (levelNum === 1) {
    const base = randomInt(5, 12) * 10000; // $50.000 a $120.000
    
    // Generamos coeficientes dinámicos para que la mejor opción cambie aleatoriamente
    const r = Math.random();
    let bestOptionType = 'A'; // 'A' = Contado, 'B' = 6 Cuotas, 'C' = 12 Cuotas
    if (r > 0.66) {
      bestOptionType = 'C';
    } else if (r > 0.33) {
      bestOptionType = 'B';
    }

    // Configurar valores según cuál queramos que sea la mejor opción
    let descContado = 10;
    let recargo6 = 15;
    let recargo12 = 30;

    if (bestOptionType === 'A') {
      descContado = 20; // Mucho descuento contado
      recargo6 = 10;
      recargo12 = 35;
    } else if (bestOptionType === 'B') {
      descContado = 5;  // Poco descuento contado
      recargo6 = -2;    // Cuotas bonificadas sin interés / con descuento
      recargo12 = 25;
    } else {
      descContado = 5;
      recargo6 = 15;
      recargo12 = -5;   // 12 cuotas con descuento / reintegro financiero especial
    }

    const totalA_val = Math.round(base * (1 - descContado / 100));
    const totalB_val = Math.round(base * (1 + recargo6 / 100));
    const cuotaB = Math.round(totalB_val / 6);
    const totalC_val = Math.round(base * (1 + recargo12 / 100));
    const cuotaC = Math.round(totalC_val / 12);

    title = 'Dilema de Finanzas: 3 Opciones de Pago';
    consigna = `Querés comprar equipamiento por $${base.toLocaleString('es-AR')}. Tenés 3 opciones de pago: una opción con descuento contado ($${totalA_val.toLocaleString('es-AR')} total), una opción en 6 cuotas de $${cuotaB.toLocaleString('es-AR')} ($${totalB_val.toLocaleString('es-AR')} total), o una opción en 12 cuotas de $${cuotaC.toLocaleString('es-AR')} ($${totalC_val.toLocaleString('es-AR')} total). ¿Cuál opción representa el MENOR desembolso total de dinero?`;

    options = [
      {
        realId: 'OP_CONTADO',
        titulo: `Contado (${descContado}% desc.)`,
        detalle: 'Descuento en 1 Pago',
        montoTotal: totalA_val,
        subtexto: `Total a pagar: $${totalA_val.toLocaleString('es-AR')}`
      },
      {
        realId: 'OP_CUOTAS_6',
        titulo: '6 Cuotas Financieras',
        detalle: `6 cuotas de $${cuotaB.toLocaleString('es-AR')}`,
        montoTotal: totalB_val,
        subtexto: `Total a pagar: $${totalB_val.toLocaleString('es-AR')}`
      },
      {
        realId: 'OP_CUOTAS_12',
        titulo: '12 Cuotas Financieras',
        detalle: `12 cuotas de $${cuotaC.toLocaleString('es-AR')}`,
        montoTotal: totalC_val,
        subtexto: `Total a pagar: $${totalC_val.toLocaleString('es-AR')}`
      }
    ];

    // Buscamos cuál es matemáticamente la menor
    let minMonto = Infinity;
    let bestRealId = '';
    options.forEach(o => {
      if (o.montoTotal < minMonto) {
        minMonto = o.montoTotal;
        bestRealId = o.realId;
      }
    });

    // Barajamos
    options = shuffle(options);

    const correctIdx = options.findIndex(o => o.realId === bestRealId);
    const letterMapping = ['A', 'B', 'C'];
    const correctLetter = letterMapping[correctIdx];

    return {
      title,
      consigna,
      opcionA: {
        id: 'A',
        titulo: `Opción A: ${options[0].titulo}`,
        detalle: options[0].detalle,
        montoTotal: options[0].montoTotal,
        subtexto: options[0].subtexto
      },
      opcionB: {
        id: 'B',
        titulo: `Opción B: ${options[1].titulo}`,
        detalle: options[1].detalle,
        montoTotal: options[1].montoTotal,
        subtexto: options[1].subtexto
      },
      opcionC: {
        id: 'C',
        titulo: `Opción C: ${options[2].titulo}`,
        detalle: options[2].detalle,
        montoTotal: options[2].montoTotal,
        subtexto: options[2].subtexto
      },
      respuestaCorrecta: correctLetter,
      correctAnswer: correctLetter
    };
  }

  // ESCENARIO PARA NIVEL 2 (AVANZADO - 3 OPCIONES COMPLEJAS)
  const precioPar = randomInt(30, 50) * 1000; // $30.000 a $50.000 por unidad
  const cant = 3;
  const totalSinPromo = precioPar * cant;

  // Generar coeficientes dinámicos para el mejor escenario de forma aleatoria
  const r2 = Math.random();
  let bestScenario = '3X2'; // '3X2', '2DO_70' o '25_OFF'
  if (r2 > 0.66) {
    bestScenario = '25_OFF';
  } else if (r2 > 0.33) {
    bestScenario = '2DO_70';
  }

  let totalA_promo = precioPar * (cant - 1); // 3x2 por defecto
  let desc2do = 70;
  let totalB_promo = precioPar + Math.round(precioPar * (1 - desc2do / 100)) + precioPar;
  let descDirecto = 25;
  let totalC_promo = Math.round(totalSinPromo * (1 - descDirecto / 100));

  if (bestScenario === '2DO_70') {
    // Para que el 2do al 90% sea el mejor de todos
    desc2do = 90;
    totalB_promo = precioPar + Math.round(precioPar * 0.1) + precioPar; // total = 2.1 * precioPar
    totalA_promo = precioPar * 2; // total = 2 * precioPar (3x2 siempre paga 2 pares, por lo tanto 3x2 sigue ganando por poco. Haremos 3x2 modificado)
    // Modificamos 3x2 para que sea llevar 4 pagando 3, pero queremos comprar exactamente 3 pares.
    // Entonces 3x2 no aplica o se paga completo: totalA = totalSinPromo.
    totalA_promo = totalSinPromo; 
  } else if (bestScenario === '25_OFF') {
    // Para que el descuento directo del 40% sea el mejor
    descDirecto = 40;
    totalC_promo = Math.round(totalSinPromo * 0.6); // 1.8 * precioPar
    totalA_promo = precioPar * 2; // 2 * precioPar
    desc2do = 50;
    totalB_promo = precioPar + Math.round(precioPar * 0.5) + precioPar; // 2.5 * precioPar
  }

  consigna = `En un local de indumentaria querés llevar 3 pares de zapatillas de $${precioPar.toLocaleString('es-AR')} cada uno (total sin promo $${totalSinPromo.toLocaleString('es-AR')}). Evaluá las promociones disponibles para encontrar la que ofrezca el PRECIO TOTAL MÁS BAJO.`;
  title = 'Comparativa Avanzada de Promociones Comerciales';

  options = [
    {
      realId: 'PROMO_3X2',
      titulo: 'Promo 3x2',
      detalle: 'Llevás 3, pagás 2 (1 de regalo)',
      montoTotal: totalA_promo,
      subtexto: `Pagás $${totalA_promo.toLocaleString('es-AR')} en total`
    },
    {
      realId: 'PROMO_2DO_70',
      titulo: `2do Par al ${desc2do}% OFF`,
      detalle: `Descuento del ${desc2do}% en la segunda unidad`,
      montoTotal: totalB_promo,
      subtexto: `Pagás $${totalB_promo.toLocaleString('es-AR')} en total`
    },
    {
      realId: 'PROMO_25_OFF',
      titulo: `${descDirecto}% OFF Directo`,
      detalle: `${descDirecto}% de descuento en el total de la compra`,
      montoTotal: totalC_promo,
      subtexto: `Pagás $${totalC_promo.toLocaleString('es-AR')} en total`
    }
  ];

  // Buscamos cuál es matemáticamente la menor
  let minMonto = Infinity;
  let bestRealId = '';
  options.forEach(o => {
    if (o.montoTotal < minMonto) {
      minMonto = o.montoTotal;
      bestRealId = o.realId;
    }
  });

  // Barajamos
  options = shuffle(options);

  const correctIdx = options.findIndex(o => o.realId === bestRealId);
  const letterMapping = ['A', 'B', 'C'];
  const correctLetter = letterMapping[correctIdx];

  return {
    title,
    consigna,
    opcionA: {
      id: 'A',
      titulo: `Opción A: ${options[0].titulo}`,
      detalle: options[0].detalle,
      montoTotal: options[0].montoTotal,
      subtexto: options[0].subtexto
    },
    opcionB: {
      id: 'B',
      titulo: `Opción B: ${options[1].titulo}`,
      detalle: options[1].detalle,
      montoTotal: options[1].montoTotal,
      subtexto: options[1].subtexto
    },
    opcionC: {
      id: 'C',
      titulo: `Opción C: ${options[2].titulo}`,
      detalle: options[2].detalle,
      montoTotal: options[2].montoTotal,
      subtexto: options[2].subtexto
    },
    respuestaCorrecta: correctLetter,
    correctAnswer: correctLetter
  };
}
