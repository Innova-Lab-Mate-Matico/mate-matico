import { env } from '../config/env.js';
import {
  registerUser,
  getUserProfile,
  loginWithPassword,
  loginWithGoogle,
  exchangeCustomTokenForIdToken,
} from '../services/auth.service.js';


export async function register(req, res, next) {
  try {
    const { email, password, displayName } = req.body;

    const { user, customToken } = await registerUser({
      email: String(email).trim().toLowerCase(),
      password,
      displayName,
    });

    let idToken;
    let refreshToken;
    let expiresIn;

    if (env.firebase.webApiKey) {
      const tokens = await exchangeCustomTokenForIdToken(
        customToken,
        env.firebase.webApiKey
      );
      idToken = tokens.idToken;
      refreshToken = tokens.refreshToken;
      expiresIn = tokens.expiresIn;
    }

    res.status(201).json({
      success: true,
      usuario: user,
      ...(idToken && { idToken, refreshToken, expiresIn }),
    });
  } catch (err) {
    console.error('Error en register:', err);
    if (err.code === 'auth/email-already-exists') {
      err.status = 409;
      err.message = 'El email ya está registrado';
    } else if (err.code?.startsWith('auth/')) {
      err.status = err.status || 400;
    }
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!env.firebase.webApiKey) {
      return res.status(503).json({
        success: false,
        error: 'Login por email no disponible en el servidor',
      });
    }

    const session = await loginWithPassword(
      String(email).trim().toLowerCase(),
      password,
      env.firebase.webApiKey
    );

    res.json({ success: true, ...session });
  } catch (err) {
    console.error('Error en login:', err);
    if (err.code?.startsWith('auth/')) {
      err.status = err.status || 400;
    }
    next(err);
  }
}

export async function googleAuth(req, res, next) {
  try {
    const { idToken } = req.body;
    const session = await loginWithGoogle(idToken);
    res.json({ success: true, ...session });
  } catch (err) {
    console.error('Error en googleAuth:', err);
    if (err.code === 'auth/id-token-expired') {
      err.status = 401;
      err.message = 'Sesión expirada. Volvé a iniciar sesión.';
    } else if (err.code === 'auth/argument-error') {
      err.status = 400;
      err.message = 'Token inválido';
    } else if (err.code?.startsWith('auth/')) {
      err.status = err.status || 400;
    }
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const profile = await getUserProfile(req.user.uid);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      usuario: profile,
    });
  } catch (err) {
    console.error('Error en me:', err);
    next(err);
  }
}

