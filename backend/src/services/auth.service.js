import { auth } from '../config/firebase.js';
import {
  crearUsuarioSiNoExiste,
  actualizarLogin,
  obtenerUsuario,
  perfilPublico,
} from './usuario.service.js';

export async function registerUser({ email, password, displayName }) {
  const userRecord = await auth.createUser({
    email,
    password,
    displayName: displayName || email.split('@')[0],
  });

  const { usuario } = await crearUsuarioSiNoExiste({
    uid: userRecord.uid,
    email,
    displayName: displayName || userRecord.displayName,
    provider: 'password',
  });

  const customToken = await auth.createCustomToken(userRecord.uid);
  return { user: perfilPublico(usuario), customToken };
}

export async function getUserProfile(uid) {
  const usuario = await obtenerUsuario(uid);
  return perfilPublico(usuario);
}

export async function exchangeCustomTokenForIdToken(customToken, apiKey) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error?.message || 'Error al obtener idToken');
    err.status = 400;
    throw err;
  }

  return {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
  };
}

export async function loginWithGoogle(idToken) {
  const decoded = await auth.verifyIdToken(idToken);
  const uid = decoded.uid;
  const email = decoded.email;
  const displayName = decoded.name || email?.split('@')[0] || 'Usuario';
  const photoURL = decoded.picture || null;

  const { usuario, esNuevo } = await crearUsuarioSiNoExiste({
    uid,
    email,
    displayName,
    photoURL,
    provider: 'google.com',
  });

  if (!esNuevo) {
    await actualizarLogin(uid, { displayName, photoURL, provider: 'google.com' });
  }

  const user = await getUserProfile(uid);
  return { idToken, usuario: user, esNuevo };
}

export async function loginWithPassword(email, password, apiKey) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(
      data.error?.message === 'INVALID_LOGIN_CREDENTIALS'
        ? 'Email o contraseña incorrectos'
        : data.error?.message || 'Error de login'
    );
    err.status = 401;
    throw err;
  }

  await crearUsuarioSiNoExiste({
    uid: data.localId,
    email,
    displayName: email.split('@')[0],
    provider: 'password',
  });

  const profile = await getUserProfile(data.localId);
  return {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
    usuario: profile,
  };
}
