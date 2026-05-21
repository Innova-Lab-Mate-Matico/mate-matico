const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegisterBody(req, res, next) {
  const { email, password, displayName } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email y contraseña son obligatorios',
    });
  }

  if (!EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ success: false, error: 'Email inválido' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({
      success: false,
      error: 'La contraseña debe tener al menos 6 caracteres',
    });
  }

  if (displayName && String(displayName).length > 80) {
    return res.status(400).json({
      success: false,
      error: 'El nombre no puede superar 80 caracteres',
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
