
import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Modules from './components/Modules';
import Progress from './components/Progress';

/*
  MATE-MÁTICO — APLICACIÓN PRINCIPAL (REACT CLÁSICO)

  Este archivo orquesta el estado global de la sesión del alumno.

  FUNCIONES PRINCIPALES:
  - Sincroniza tokens JWT de Firebase usando localStorage.
  - Controla la navegación por pestañas (Perfil, Lecciones, Progreso).
  - Realiza peticiones REST al backend.
  - Gestiona autenticación tradicional y login con Google.
  - Carga Firebase dinámicamente en el navegador.

  IMPORTANTE:
  Este proyecto utiliza React clásico (Create React App).
  Las variables de entorno deben comenzar con:

  REACT_APP_

  Ejemplo:
  REACT_APP_API_BASE_URL=
  REACT_APP_FIREBASE_API_KEY=

  El equipo frontend puede:
  - reorganizar componentes,
  - agregar React Router,
  - usar Tailwind,
  - mejorar el diseño,
  - separar lógica en hooks,
  sin modificar la lógica principal de autenticación.
*/

// URL base de la API backend
const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  'http://localhost:3000/api';

// Configuración Firebase Client
const firebaseClientConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

export default function App() {
  const [token, setToken] = useState(
    localStorage.getItem('idToken') || ''
  );

  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);

  const [statusMsg, setStatusMsg] = useState('');
  const [isStatusOk, setIsStatusOk] = useState(true);

  const [firebaseAuthModule, setFirebaseAuthModule] =
    useState(null);

  // Pestaña activa
  const [activeTab, setActiveTab] = useState('perfil');

  /*
    Intentar recuperar sesión automáticamente
    al iniciar la aplicación.
  */
  useEffect(() => {
    if (token) {
      loadProfile(token);
      loadUserProgress(token);
    }
  }, []);

  const setStatus = (msg, ok = true) => {
    setStatusMsg(msg);
    setIsStatusOk(ok);
  };

  /*
    Wrapper estándar para llamadas HTTP al backend.
  */
  const apiCall = async (
    path,
    options = {},
    customToken = null
  ) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const activeToken = customToken || token;

    if (activeToken) {
      headers.Authorization = `Bearer ${activeToken}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data.error ||
          res.statusText ||
          'Error inesperado en la API'
      );
    }

    return data;
  };

  /*
    Obtener perfil del usuario autenticado.
  */
  const loadProfile = async (activeToken = null) => {
    try {
      const data = await apiCall(
        '/auth/me',
        {},
        activeToken
      );

      setUser(data.usuario);
    } catch (err) {
      console.error('Error al cargar perfil:', err);
      logout();
    }
  };

  /*
    Obtener progreso académico del alumno.
  */
  const loadUserProgress = async (
    activeToken = null
  ) => {
    try {
      const data = await apiCall(
        '/progress',
        {},
        activeToken
      );

      setProgress(data.progreso || {});
    } catch (err) {
      console.error('Error al cargar progreso:', err);
    }
  };

  /*
    Guardar token JWT localmente.
  */
  const saveToken = (idToken) => {
    setToken(idToken);
    localStorage.setItem('idToken', idToken);
  };

  /*
    Cerrar sesión.
  */
  const logout = () => {
    setToken('');
    setUser(null);
    setProgress(null);

    localStorage.removeItem('idToken');

    setStatus(
      'Sesión cerrada correctamente',
      true
    );
  };

  /*
    Carga dinámica del SDK Firebase.
    Optimiza rendimiento inicial.
  */
  const getFirebaseAuth = async () => {
    if (firebaseAuthModule) {
      return firebaseAuthModule;
    }

    if (
      !firebaseClientConfig.apiKey ||
      !firebaseClientConfig.projectId
    ) {
      throw new Error(
        'Configurá REACT_APP_FIREBASE_API_KEY y REACT_APP_FIREBASE_PROJECT_ID en frontend/.env'
      );
    }

    const { initializeApp } = await import(
      'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js'
    );

    const {
      getAuth,
      GoogleAuthProvider,
      signInWithPopup,
    } = await import(
      'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'
    );

    const app = initializeApp(
      firebaseClientConfig
    );

    const authInstance = getAuth(app);

    const provider = new GoogleAuthProvider();

    const module = {
      auth: authInstance,
      GoogleAuthProvider,
      signInWithPopup,
      provider,
    };

    setFirebaseAuthModule(module);

    return module;
  };

  /*
    Registro Email/Contraseña.
  */
  const handleRegister = async (
    email,
    password,
    displayName
  ) => {
    try {
      setStatus('Creando cuenta...');

      const data = await apiCall(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
            displayName,
          }),
        }
      );

      if (!data.idToken) {
        setStatus(
          'Registro correcto. Iniciá sesión con tu email.',
          true
        );

        return;
      }

      saveToken(data.idToken);

      loadUserProgress(data.idToken);

      setStatus(
        '¡Registro correcto! Bienvenido a Mate-Mático',
        true
      );

      setUser(data.usuario);

      setActiveTab('perfil');
    } catch (err) {
      setStatus(err.message, false);
    }
  };

  /*
    Login Email/Contraseña.
  */
  const handleLogin = async (
    email,
    password
  ) => {
    try {
      setStatus('Iniciando sesión...');

      const data = await apiCall(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      saveToken(data.idToken);

      loadUserProgress(data.idToken);

      setStatus(
        'Sesión iniciada con éxito',
        true
      );

      setUser(data.usuario);

      setActiveTab('perfil');
    } catch (err) {
      setStatus(err.message, false);
    }
  };

  /*
    Login Google usando Firebase Popup.
  */
  const handleGoogleLogin = async () => {
    try {
      setStatus(
        'Abriendo panel de Google...'
      );

      const {
        auth,
        signInWithPopup,
        provider,
      } = await getFirebaseAuth();

      provider.setCustomParameters({
        prompt: 'select_account',
      });

      const credential =
        await signInWithPopup(
          auth,
          provider
        );

      const googleIdToken =
        await credential.user.getIdToken();

      setStatus(
        'Sincronizando perfil con el servidor...'
      );

      const data = await apiCall(
        '/auth/google',
        {
          method: 'POST',
          body: JSON.stringify({
            idToken: googleIdToken,
          }),
        }
      );

      saveToken(data.idToken);

      loadUserProgress(data.idToken);

      setStatus(
        data.esNuevo
          ? `¡Cuenta creada! Hola, ${
              data.usuario?.displayName ||
              data.usuario?.email
            }`
          : `Bienvenido de nuevo, ${
              data.usuario?.displayName ||
              data.usuario?.email
            }`,
        true
      );

      setUser(data.usuario);

      setActiveTab('perfil');
    } catch (err) {
      const friendlyMsg =
        err.code ===
        'auth/popup-closed-by-user'
          ? 'Ventana cerrada por el usuario. Reintentá.'
          : err.message;

      setStatus(friendlyMsg, false);
    }
  };

  /*
    Actualización local de gamificación.
  */
  const handleAnswerSuccess = (result) => {
    setUser((prev) => ({
      ...prev,
      puntosTotales: result.puntosTotales,
      rolActual: result.rolActual,
      rachaDias: result.rachaDias,
      recordRacha: result.recordRacha,
    }));

    if (result.mensajeRacha) {
      setStatus(result.mensajeRacha, true);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo-section">
          <h1>
            🧉 Mate-Mático (React Frontend)
          </h1>

          <p>
            Lógica de conexión integrada
            para frontend developers
          </p>
        </div>

        {user && (
          <div
            style={{
              marginTop: '10px',
              fontSize: '14px',
            }}
          >
            <span>
              🔥 Racha activa:{' '}
              {user.rachaDias ?? 0} días
            </span>

            {' | '}

            <span>
              ✨ Puntos:{' '}
              {user.puntosTotales ?? 0} pts
            </span>
          </div>
        )}
      </header>

      {/* Main */}
      <main>
        {!user ? (
          <div
            style={{
              maxWidth: '450px',
              margin: '0 auto',
            }}
          >
            <Auth
              onLogin={handleLogin}
              onGoogleLogin={
                handleGoogleLogin
              }
              onRegister={handleRegister}
              statusMsg={statusMsg}
              isStatusOk={isStatusOk}
            />
          </div>
        ) : (
          <div>
            {/* Navegación */}
            <nav className="tab-bar">
              <button
                type="button"
                className={`tab-btn ${
                  activeTab === 'perfil'
                    ? 'active-tab'
                    : ''
                }`}
                onClick={() =>
                  setActiveTab('perfil')
                }
              >
                1. Mi Perfil
              </button>

              <button
                type="button"
                className={`tab-btn ${
                  activeTab === 'lecciones'
                    ? 'active-tab'
                    : ''
                }`}
                onClick={() =>
                  setActiveTab('lecciones')
                }
              >
                2. Lecciones y Ejercicios
              </button>

              <button
                type="button"
                className={`tab-btn ${
                  activeTab === 'progreso'
                    ? 'active-tab'
                    : ''
                }`}
                onClick={() =>
                  setActiveTab('progreso')
                }
              >
                3. Mi Progreso y Logros
              </button>
            </nav>

            {/* Contenido */}
            <div className="layout-grid">
              {activeTab === 'perfil' && (
                <Profile
                  user={user}
                  onLogout={logout}
                  onRefresh={() => {
                    loadProfile();
                    loadUserProgress();
                  }}
                />
              )}

              {activeTab === 'lecciones' && (
                <Modules
                  apiCall={apiCall}
                  onAnswerSuccess={
                    handleAnswerSuccess
                  }
                  progress={progress}
                  onRefreshProgress={
                    loadUserProgress
                  }
                />
              )}

              {activeTab === 'progreso' && (
                <Progress apiCall={apiCall} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>
          API Endpoint:{' '}
          <code>{API_BASE}</code>
        </p>

        <p style={{ marginTop: '5px' }}>
          Mate-Mático Monorepo MVP —
          React Frontend © 2026
        </p>
      </footer>
    </div>
  );
}