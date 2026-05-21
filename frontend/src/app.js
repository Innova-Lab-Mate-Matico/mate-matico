const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

document.getElementById('api-base-label')?.replaceChildren(API_BASE);

const firebaseClientConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const ROL_OUTFIT = {
  principiante: 'Mate-Matico con guardapolvo blanco (maestro de escuela)',
  intermedio: 'Mate-Matico vestido de profesor de secundaria',
  avanzado: 'Mate-Matico académico con toga y birrete universitario',
};

let token = localStorage.getItem('idToken') || '';
let sesionModulo = { moduleId: null, semilla: null };

const $ = (id) => document.getElementById(id);

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

function setStatus(msg, ok = true) {
  const el = $('auth-status');
  el.textContent = msg;
  el.className = `status ${ok ? 'ok' : 'err'}`;
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
  return data;
}

function showLoggedIn() {
  ['profile-section', 'modules-section', 'progress-section'].forEach((id) => {
    $(id).hidden = false;
  });
}

function saveToken(idToken) {
  token = idToken;
  localStorage.setItem('idToken', idToken);
}

function logout() {
  token = '';
  localStorage.removeItem('idToken');
  ['profile-section', 'modules-section', 'progress-section'].forEach((id) => {
    $(id).hidden = true;
  });
  $('profile-box').innerHTML = '';
  $('modules-list').innerHTML = '';
  $('lesson-panel').hidden = true;
  $('lesson-panel').innerHTML = '';
  setStatus('Sesión cerrada', true);
}

async function register() {
  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: $('email').value,
        password: $('password').value,
        displayName: $('displayName').value || undefined,
      }),
    });

    if (!data.idToken) {
      setStatus('Registro OK. Iniciá sesión con tu email.', true);
      return;
    }

    saveToken(data.idToken);
    setStatus('Registro OK. ¡Bienvenido a Mate-Matico!');
    showLoggedIn();
    await loadProfile();
  } catch (e) {
    setStatus(e.message, false);
  }
}

let firebaseAuthModule = null;

async function getFirebaseAuth() {
  if (firebaseAuthModule) return firebaseAuthModule;

  if (!firebaseClientConfig.apiKey || !firebaseClientConfig.projectId) {
    throw new Error(
      'Configurá VITE_FIREBASE_API_KEY y VITE_FIREBASE_PROJECT_ID en frontend/.env'
    );
  }

  const { initializeApp } = await import(
    'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js'
  );
  const { getAuth, GoogleAuthProvider, signInWithPopup } = await import(
    'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'
  );

  const app = initializeApp(firebaseClientConfig);
  firebaseAuthModule = { auth: getAuth(app), GoogleAuthProvider, signInWithPopup };
  return firebaseAuthModule;
}

async function loginWithGoogle() {
  try {
    setStatus('Abriendo Google…');
    const { auth, GoogleAuthProvider, signInWithPopup } = await getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const credential = await signInWithPopup(auth, provider);
    const idToken = await credential.user.getIdToken();

    const data = await api('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });

    saveToken(data.idToken);
    const u = data.usuario;
    setStatus(
      data.esNuevo
        ? `¡Cuenta creada! Hola, ${u?.displayName || u?.email}`
        : `Bienvenido de nuevo, ${u?.displayName || u?.email}`
    );
    showLoggedIn();
    await loadProfile();
  } catch (e) {
    const msg =
      e.code === 'auth/popup-closed-by-user'
        ? 'Ventana cerrada. Intentá de nuevo.'
        : e.message;
    setStatus(msg, false);
  }
}

async function login() {
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: $('email').value,
        password: $('password').value,
      }),
    });
    saveToken(data.idToken);
    setStatus('Login correcto');
    showLoggedIn();
    await loadProfile();
  } catch (e) {
    setStatus(e.message, false);
  }
}

async function loadProfile() {
  const data = await api('/auth/me');
  const u = data.usuario;
  const rol = u.rolActual || 'principiante';
  const avatar = u.photoURL
    ? `<img src="${escapeHtml(u.photoURL)}" alt="" class="avatar" width="48" height="48" />`
    : '<span class="avatar-placeholder">🧉</span>';

  $('profile-box').innerHTML = `
    <div class="profile-row">
      ${avatar}
      <div>
        <p class="profile-name"><strong>${escapeHtml(u.displayName || u.email)}</strong></p>
        <p class="rol-line">
          <span class="badge badge-rol badge-${rol}">${escapeHtml(rol)}</span>
          ${u.provider === 'google.com' ? '<span class="badge badge-google">Google</span>' : ''}
        </p>
        <p class="outfit-hint">${escapeHtml(ROL_OUTFIT[rol] || '')}</p>
        <p class="stats-line">
          <span class="badge">${u.puntosTotales ?? 0} pts</span>
          <span class="badge">Racha: ${u.rachaDias ?? 0} días</span>
          <span class="badge badge-muted">Récord: ${u.recordRacha ?? 0}</span>
        </p>
        <p class="email-line">${escapeHtml(u.email || '')}</p>
      </div>
    </div>
  `;
}

async function loadModules() {
  const data = await api('/modules');
  const list = $('modules-list');
  list.innerHTML = '';

  const modulos = data.modulos ?? data.modules ?? [];
  for (const mod of modulos) {
    const el = document.createElement('div');
    el.className = 'module-item';
    el.innerHTML = `
      <strong>${escapeHtml(mod.title)}</strong>
      <small>${escapeHtml(mod.description)} · ${mod.levelCount} niveles · Rol sugerido: ${escapeHtml(mod.rolSugerido || '—')}</small>
    `;
    el.onclick = () => openModule(mod.id);
    list.appendChild(el);
  }
}

async function openModule(moduleId) {
  const data = await api(`/modules/${moduleId}`);
  const modulo = data.modulo ?? data.module;
  if (!modulo) throw new Error('Módulo no encontrado');

  sesionModulo = { moduleId, semilla: modulo.semillaSesion };

  const panel = $('lesson-panel');
  panel.hidden = false;
  panel.innerHTML = `
    <h3>${escapeHtml(modulo.title)}</h3>
    <p class="hint">Semilla de sesión: <code>${modulo.semillaSesion}</code> — los ejercicios se generan al vuelo.</p>
  `;

  for (const level of modulo.levels) {
    const h = document.createElement('p');
    h.className = 'level-title';
    h.innerHTML = `<strong>${escapeHtml(level.title)}</strong> · dificultad ${level.difficulty}`;
    panel.appendChild(h);

    for (const lesson of level.lessons) {
      const wrap = document.createElement('div');
      wrap.className = 'lesson-block';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lesson-btn';
      btn.textContent = `${lesson.title} (${lesson.ejercicios?.length ?? lesson.exerciseCount ?? '?'} ejercicios)`;
      btn.onclick = () =>
        renderLesson(moduleId, lesson, modulo.semillaSesion);

      wrap.appendChild(btn);
      panel.appendChild(wrap);
    }
  }
}

function renderLesson(moduleId, lesson, semilla) {
  const panel = $('lesson-panel');
  const block = document.createElement('div');
  block.className = 'lesson-active';
  block.innerHTML = `
    <h3>${escapeHtml(lesson.title)}</h3>
    <p class="hint">${lesson.durationMinutes} min · Sin vidas: reintentos ilimitados ♾️</p>
  `;

  const ejercicios = lesson.ejercicios ?? [];
  ejercicios.forEach((ex) => block.appendChild(buildExerciseCard(moduleId, lesson.id, ex, semilla)));

  panel.querySelector('.lesson-active')?.remove();
  panel.appendChild(block);
  block.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function openLesson(moduleId, lessonId) {
  const semilla = sesionModulo.semilla;
  const q = semilla != null ? `?semilla=${semilla}` : '';
  const data = await api(`/modules/${moduleId}/lessons/${lessonId}${q}`);
  const leccion = data.leccion ?? data.lesson;
  if (!leccion) throw new Error('Lección no encontrada');

  sesionModulo.semilla = leccion.semilla;
  renderLesson(moduleId, leccion, leccion.semilla);
}

function buildExerciseCard(moduleId, lessonId, ex, semilla) {
  const div = document.createElement('div');
  div.className = 'exercise';
  div.dataset.exerciseId = ex.id;

  const meta = document.createElement('p');
  meta.className = 'exercise-meta';
  meta.textContent = `ID: ${ex.id} · semilla: ${ex.semilla ?? semilla} · ${ex.puntos} pts`;
  div.appendChild(meta);

  const h4 = document.createElement('h4');
  h4.textContent = ex.enunciado ?? ex.prompt;
  div.appendChild(h4);

  const payload = {
    moduleId,
    lessonId,
    exerciseId: ex.id,
    semilla: ex.semilla ?? semilla,
    operandos: ex.operandos,
    tipo: ex.tipo ?? ex.type,
  };

  if ((ex.tipo ?? ex.type) === 'multiple_choice') {
    const opts = document.createElement('div');
    opts.className = 'options';
    (ex.opciones ?? ex.options ?? []).forEach((opt) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `ex-${ex.id}`;
      input.value = opt;
      input.addEventListener('change', () => submitAnswer(payload, opt, div));
      label.append(input, document.createTextNode(` ${opt}`));
      opts.appendChild(label);
    });
    div.appendChild(opts);
  } else {
    const row = document.createElement('div');
    row.className = 'numeric-row';
    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = 'Tu respuesta';
    input.className = 'numeric-input';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Enviar';
    btn.addEventListener('click', () => {
      if (input.value === '') return;
      submitAnswer(payload, Number(input.value), div);
    });
    row.append(input, btn);
    div.appendChild(row);
  }

  return div;
}

function showFeedback(container, result) {
  container.querySelector('.feedback')?.remove();
  container.querySelector('.comodin')?.remove();

  const fb = document.createElement('div');
  fb.className = `feedback ${result.correcto ? 'correct' : 'incorrect'}`;

  if (result.correcto) {
    let msg = `✓ Correcto (+${result.puntosGanados} pts)`;
    if (result.rolSubio) msg += ` · ¡Nuevo rol: ${result.rolActual}!`;
    else if (result.rolActual) msg += ` · Rol: ${result.rolActual}`;
    fb.textContent = msg;
  } else {
    fb.textContent = `✗ Incorrecto — no perdés puntos. ${result.explicacionError || ''}`;
  }
  container.appendChild(fb);

  if (result.habilitarComodin && result.comodinPista) {
    const comodin = document.createElement('div');
    comodin.className = 'comodin';
    comodin.innerHTML = `<strong>🧉 Comodín del termo</strong><p>${escapeHtml(result.comodinPista)}</p>`;
    container.appendChild(comodin);
  }
}

async function submitAnswer(payload, answer, container) {
  try {
    const result = await api('/exercises/validate', {
      method: 'POST',
      body: JSON.stringify({
        moduleId: payload.moduleId,
        lessonId: payload.lessonId,
        exerciseId: payload.exerciseId,
        answer,
        semilla: payload.semilla,
        operandos: payload.operandos,
      }),
    });

    showFeedback(container, result);

    if (result.correcto) {
      await loadProfile();
      if (result.mensajeRacha) {
        setStatus(result.mensajeRacha, true);
      }
    }
  } catch (e) {
    alert(e.message);
  }
}

async function loadProgress() {
  const data = await api('/progress');
  $('progress-output').textContent = JSON.stringify(data, null, 2);
}

$('btn-register').onclick = register;
$('btn-login').onclick = login;
$('btn-google').onclick = loginWithGoogle;
$('btn-logout')?.addEventListener('click', logout);
$('btn-refresh-profile').onclick = loadProfile;
$('btn-load-modules').onclick = loadModules;
$('btn-load-progress').onclick = loadProgress;

if (token) {
  showLoggedIn();
  loadProfile().catch(() => {
    localStorage.removeItem('idToken');
    token = '';
  });
}
