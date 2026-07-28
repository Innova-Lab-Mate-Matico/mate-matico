import { z } from 'zod';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Middleware genérico para ejecutar esquemas Zod con respuesta retrocompatible
 */
const validate = (schema, customEmptyMsg = null) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body ?? {});
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.errors[0];
      const errorMessage = firstIssue?.message || 'Error de validación en los datos enviados.';
      return res.status(400).json({
        success: false,
        error: errorMessage,
        detalles: error.errors.map((e) => ({
          campo: e.path.join('.'),
          mensaje: e.message,
        })),
      });
    }
    next(error);
  }
};

// 1. Registro
export function validateRegisterBody(req, res, next) {
  const { email, password, displayName } = req.body ?? {};
  if (!email || !password || !displayName || !String(displayName).trim()) {
    return res.status(400).json({
      success: false,
      error: 'Nombre, email y contraseña son obligatorios',
    });
  }
  const registerSchema = z.object({
    displayName: z.string().trim().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    email: z.string().trim().toLowerCase().regex(EMAIL_RE, { message: 'Email inválido' }),
    password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
  });
  return validate(registerSchema)(req, res, next);
}

// 2. Login
export function validateLoginBody(req, res, next) {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email y contraseña son obligatorios',
    });
  }
  const loginSchema = z.object({
    email: z.string().trim().toLowerCase().regex(EMAIL_RE, { message: 'Email inválido' }),
    password: z.string().min(1, { message: 'Email y contraseña son obligatorios' }),
  });
  return validate(loginSchema)(req, res, next);
}

// 3. Google Auth
export function validateGoogleBody(req, res, next) {
  const googleSchema = z.object({
    idToken: z.string({ required_error: 'idToken inválido' }).min(50, { message: 'idToken inválido' }),
  });
  return validate(googleSchema)(req, res, next);
}

// 4. Ejercicio
export function validateExerciseBody(req, res, next) {
  const { moduleId, lessonId, exerciseId, answer, semilla, operandos } = req.body ?? {};
  if (!moduleId || !lessonId || !exerciseId) {
    return res.status(400).json({
      success: false,
      error: 'moduleId, lessonId y exerciseId son obligatorios',
    });
  }
  if (answer === undefined || answer === null || answer === '') {
    return res.status(400).json({
      success: false,
      error: 'answer es obligatorio',
    });
  }
  if (semilla === undefined || operandos === undefined) {
    return res.status(400).json({
      success: false,
      error: 'semilla y operandos son obligatorios para validar ejercicios dinámicos',
    });
  }
  const exerciseSchema = z.object({
    moduleId: z.string().min(1),
    lessonId: z.string().min(1),
    exerciseId: z.string().min(1),
    answer: z.any(),
    semilla: z.any(),
    operandos: z.any(),
  });
  return validate(exerciseSchema)(req, res, next);
}

// 5. Onboarding Wizard
export function validateOnboardingBody(req, res, next) {
  const { edad, nivelEducativo, objetivo, confianzaMath, intereses } = req.body ?? {};

  if (confianzaMath === undefined || confianzaMath === null) {
    return res.status(400).json({
      success: false,
      error: 'La confianza matemática (confianzaMath) es obligatoria',
    });
  }
  const confianzaNum = Number(confianzaMath);
  if (!Number.isInteger(confianzaNum) || confianzaNum < 1 || confianzaNum > 5) {
    return res.status(400).json({
      success: false,
      error: 'La confianza matemática debe ser un número entero en el rango de 1 a 5',
    });
  }

  if (!intereses || !Array.isArray(intereses) || intereses.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Los intereses son obligatorios y deben ser un array de etiquetas (tags) no vacío',
    });
  }
  if (intereses.length > 10) {
    return res.status(400).json({
      success: false,
      error: 'No se pueden enviar más de 10 intereses',
    });
  }
  const todosStrings = intereses.every(i => typeof i === 'string' && i.trim().length > 0);
  if (!todosStrings) {
    return res.status(400).json({
      success: false,
      error: 'Todos los intereses deben ser textos (strings) no vacíos',
    });
  }

  const onboardingSchema = z.object({
    confianzaMath: z.number().int().min(1).max(5),
    intereses: z.array(z.string().trim().min(1)).min(1).max(10),
    edad: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
      z.number().int().min(18, { message: 'La edad debe ser un número entero válido de al menos 18 años' }).max(120).optional()
    ),
    nivelEducativo: z.enum(['primaria', 'secundaria', 'terciaria', 'universitaria', 'ninguno'], {
      errorMap: () => ({ message: 'El campo nivelEducativo no es válido. Debe ser uno de: primaria, secundaria, terciaria, universitaria, ninguno' })
    }).optional().nullable(),
    objetivo: z.string().max(500, { message: 'El objetivo debe ser un texto y no puede superar los 500 caracteres' }).optional().nullable(),
  });

  return validate(onboardingSchema)(req, res, next);
}

// 6. Consultas al Tutor IA
export function validateExplainBody(req, res, next) {
  if (!req.body || typeof req.body !== 'object') {
    req.body = {};
  }

  // Asignar valores por defecto para los identificadores si vienen vacíos o no se especifican
  req.body.moduleId = (req.body.moduleId && typeof req.body.moduleId === 'string' && req.body.moduleId.trim()) ? req.body.moduleId.trim() : 'general';
  req.body.lessonId = (req.body.lessonId && typeof req.body.lessonId === 'string' && req.body.lessonId.trim()) ? req.body.lessonId.trim() : 'general';
  req.body.theoryId = (req.body.theoryId && typeof req.body.theoryId === 'string' && req.body.theoryId.trim()) ? req.body.theoryId.trim() : 'general';

  const { question, history } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ success: false, error: 'El campo question es obligatorio y debe ser un texto.' });
  }

  if (history !== undefined) {
    if (!Array.isArray(history)) {
      return res.status(400).json({ success: false, error: 'El campo history debe ser un arreglo.' });
    }

    for (let i = 0; i < history.length; i++) {
      const msg = history[i];
      if (!msg || typeof msg !== 'object') {
        return res.status(400).json({ success: false, error: `El mensaje en el índice ${i} del historial no es un objeto válido.` });
      }
      if (!msg.role || typeof msg.role !== 'string' || !['user', 'model', 'assistant'].includes(msg.role)) {
        return res.status(400).json({ success: false, error: `El campo role en el índice ${i} debe ser 'user', 'assistant' o 'model'.` });
      }
      if (!msg.text || typeof msg.text !== 'string' || !msg.text.trim()) {
        return res.status(400).json({ success: false, error: `El campo text en el índice ${i} debe ser un texto no vacío.` });
      }
    }
  }

  const explainSchema = z.object({
    moduleId: z.string().optional(),
    lessonId: z.string().optional(),
    theoryId: z.string().optional(),
    question: z.string().trim().min(1),
    history: z.array(z.any()).optional(),
    sesion_id: z.string().optional(),
  });

  return validate(explainSchema)(req, res, next);
}
