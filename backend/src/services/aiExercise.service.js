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

  // ESCENARIO PARA NIVEL 0 (PRINCIPIANTE - 2 OPCIONES A vs B)
  if (levelNum === 0) {
    const base = randomInt(1, 4) * 10000; // $10.000 a $40.000
    const desc = 10;
    const totalA = Math.round(base * (1 - desc / 100));
    const cuotas = 3;
    const valorCuota = Math.round((base * 1.15) / cuotas);
    const totalB = valorCuota * cuotas;
    const consigna = `Vas a realizar una compra por un total de $${base.toLocaleString('es-AR')}. Tenés dos opciones: Opción A con ${desc}% de descuento contado ($${totalA.toLocaleString('es-AR')}) vs Opción B en ${cuotas} cuotas de $${valorCuota.toLocaleString('es-AR')} ($${totalB.toLocaleString('es-AR')} total). ¿Cuál es la opción más económica?`;

    return {
      title: 'Dilema de Compra: Contado vs 3 Cuotas',
      consigna,
      opcionA: {
        id: 'A',
        titulo: 'Opción A: Pago Contado',
        detalle: `${desc}% Descuento Inmediato`,
        montoTotal: totalA,
        subtexto: `Pagás $${totalA.toLocaleString('es-AR')} hoy`
      },
      opcionB: {
        id: 'B',
        titulo: `Opción B: ${cuotas} Cuotas Fijas`,
        detalle: `${cuotas} cuotas de $${valorCuota.toLocaleString('es-AR')}`,
        montoTotal: totalB,
        subtexto: `Pagás $${totalB.toLocaleString('es-AR')} en total`
      },
      respuestaCorrecta: 'A',
      correctAnswer: 'A'
    };
  }

  // ESCENARIO PARA NIVEL 1 (INTERMEDIO - 3 OPCIONES A vs B vs C)
  if (levelNum === 1) {
    const base = randomInt(5, 12) * 10000; // $50.000 a $120.000
    const descA = 15;
    const totalA = Math.round(base * (1 - descA / 100));
    
    // Opción B: 6 cuotas con 10% recargo
    const recargoB = 10;
    const totalB = Math.round(base * (1 + recargoB / 100));
    const cuotaB = Math.round(totalB / 6);

    // Opción C: 12 cuotas con 30% recargo
    const recargoC = 30;
    const totalC = Math.round(base * (1 + recargoC / 100));
    const cuotaC = Math.round(totalC / 12);

    const consigna = `Querés comprar equipamiento por $${base.toLocaleString('es-AR')}. Tenés 3 opciones de pago: Opción A con ${descA}% de descuento contado ($${totalA.toLocaleString('es-AR')}), Opción B en 6 cuotas ($${totalB.toLocaleString('es-AR')} total) u Opción C en 12 cuotas ($${totalC.toLocaleString('es-AR')} total). ¿Cuál opción representa el MENOR desembolso total de dinero?`;

    return {
      title: 'Dilema de Finanzas: 3 Opciones de Pago',
      consigna,
      opcionA: {
        id: 'A',
        titulo: 'Opción A: Contado 15% OFF',
        detalle: 'Descuento en 1 Pago',
        montoTotal: totalA,
        subtexto: `Total a pagar: $${totalA.toLocaleString('es-AR')}`
      },
      opcionB: {
        id: 'B',
        titulo: 'Opción B: 6 Cuotas',
        detalle: `6 cuotas de $${cuotaB.toLocaleString('es-AR')}`,
        montoTotal: totalB,
        subtexto: `Total a pagar: $${totalB.toLocaleString('es-AR')}`
      },
      opcionC: {
        id: 'C',
        titulo: 'Opción C: 12 Cuotas',
        detalle: `12 cuotas de $${cuotaC.toLocaleString('es-AR')}`,
        montoTotal: totalC,
        subtexto: `Total a pagar: $${totalC.toLocaleString('es-AR')}`
      },
      respuestaCorrecta: 'A',
      correctAnswer: 'A'
    };
  }

  // ESCENARIO PARA NIVEL 2 (AVANZADO - 3 OPCIONES COMPLEJAS A vs B vs C)
  const precioPar = randomInt(30, 50) * 1000; // $30.000 a $50.000 por unidad
  const cant = 3;
  const totalSinPromo = precioPar * cant;

  // Opción A: Promo 3x2 (1 gratis)
  const totalA = precioPar * (cant - 1);

  // Opción B: 2do par al 70% de descuento
  const totalB = precioPar + Math.round(precioPar * 0.3) + precioPar;

  // Opción C: 25% de descuento directo en el total
  const totalC = Math.round(totalSinPromo * 0.75);

  const consigna = `En un local de indumentaria querés llevar 3 pares de zapatillas de $${precioPar.toLocaleString('es-AR')} cada uno (total sin promo $${totalSinPromo.toLocaleString('es-AR')}). ¿Cuál de las 3 promociones te da el PRECIO TOTAL MÁS BAJO?`;

  return {
    title: 'Comparativa Avanzada: Promo 3x2 vs 2do al 70% vs 25% OFF',
    consigna,
    opcionA: {
      id: 'A',
      titulo: 'Opción A: Promo 3x2',
      detalle: 'Llevás 3, pagás 2 (1 gratis)',
      montoTotal: totalA,
      subtexto: `Pagás $${totalA.toLocaleString('es-AR')} por los 3 pares`
    },
    opcionB: {
      id: 'B',
      titulo: 'Opción B: 2do al 70% OFF',
      detalle: 'Descuento del 70% en la 2da unidad',
      montoTotal: totalB,
      subtexto: `Pagás $${totalB.toLocaleString('es-AR')} por los 3 pares`
    },
    opcionC: {
      id: 'C',
      titulo: 'Opción C: 25% OFF Directo',
      detalle: '25% de descuento en el total',
      montoTotal: totalC,
      subtexto: `Pagás $${totalC.toLocaleString('es-AR')} por los 3 pares`
    },
    respuestaCorrecta: 'A',
    correctAnswer: 'A'
  };
}
