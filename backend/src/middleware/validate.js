const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegisterBody(req, res, next) {
  const { email, password, displayName } = req.body ?? {};

  if (!email || !password || !displayName || !String(displayName).trim()) {
    return res.status(400).json({
      success: false,
      error: 'Nombre, email y contraseña son obligatorios',
    });
  }

  // 1. Validar nombre (solo letras)
  const nameStr = String(displayName).trim();
  const nameRe = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
  if (!nameRe.test(nameStr)) {
    return res.status(400).json({
      success: false,
      error: 'El nombre solo debe contener letras',
    });
  }

  // 2. Validar formato de email
  const emailStr = String(email).trim().toLowerCase();
  if (!EMAIL_RE.test(emailStr)) {
    return res.status(400).json({ success: false, error: 'Email inválido' });
  }

  // 3. Validar dominios permitidos
  const domainParts = emailStr.split('@')[1]?.split('.') ?? [];
  const baseDomain = domainParts[0];
  const allowedDomains = ['gmail', 'outlook', 'yahoo', 'hotmail'];
  if (!allowedDomains.includes(baseDomain)) {
    return res.status(400).json({
      success: false,
      error: 'Email con dominio no permitido. Solo se aceptan gmail, outlook, yahoo o hotmail.',
    });
  }

  // 4. Validar contraseña (mínimo 8 caracteres, mayús + minús + número + especial, sin límite máximo)
  const passStr = String(password);
  const hasUpper = /[A-Z]/.test(passStr);
  const hasLower = /[a-z]/.test(passStr);
  const hasDigit = /\d/.test(passStr);
  const hasSpecial = /[^A-Za-z0-9]/.test(passStr);
  const isCorrectLength = passStr.length >= 8;

  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial || !isCorrectLength) {
    return res.status(400).json({
      success: false,
      error: 'La contraseña debe tener al menos 8 caracteres, e incluir mayúscula, minúscula, número y un carácter especial.',
    });
  }

  next();
}


export function validateLoginBody(req, res, next) {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email y contraseña son obligatorios',
    });
  }

  if (!EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ success: false, error: 'Email inválido' });
  }

  next();
}

export function validateGoogleBody(req, res, next) {
  const { idToken } = req.body ?? {};

  if (!idToken || typeof idToken !== 'string' || idToken.length < 100) {
    return res.status(400).json({
      success: false,
      error: 'idToken inválido',
    });
  }

  next();
}

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

  next();
}

export function validateOnboardingBody(req, res, next) {
  const { edad, nivelEducativo, objetivo, confianzaMath, intereses } = req.body ?? {};

  // 1. confianzaMath: obligatorio, entero, entre 1 y 5
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

  // 2. intereses: obligatorio, array de strings, max 10 tags, no vacíos
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

  // 3. edad: opcional, entero, rango 5-120
  if (edad !== undefined && edad !== null && edad !== '') {
    const edadNum = Number(edad);
    if (!Number.isInteger(edadNum) || edadNum < 5 || edadNum > 120) {
      return res.status(400).json({
        success: false,
        error: 'La edad debe ser un número entero válido entre 5 y 120 años',
      });
    }
  }

  // 4. nivelEducativo: opcional, lista controlada
  if (nivelEducativo !== undefined && nivelEducativo !== null && nivelEducativo !== '') {
    const nivelesValidos = ['primaria', 'secundaria', 'terciaria', 'universitaria', 'ninguno'];
    if (!nivelesValidos.includes(String(nivelEducativo).trim().toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'El campo nivelEducativo no es válido. Debe ser uno de: primaria, secundaria, terciaria, universitaria, ninguno',
      });
    }
  }

  // 5. objetivo: opcional, string, max 500 chars
  if (objetivo !== undefined && objetivo !== null) {
    if (typeof objetivo !== 'string' || objetivo.trim().length > 500) {
      return res.status(400).json({
        success: false,
        error: 'El objetivo debe ser un texto y no puede superar los 500 caracteres',
      });
    }
  }

  next();
}
