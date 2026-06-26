import React, { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import './App.css'; // Tus estilos globales
import Auth from './components/Auth';
import Profile from './components/Profile';
import Modules from './components/Modules';
import Progress from './components/Progress';

// --- TUS COMPONENTES INYECTADOS (Unificados con tus flujos nuevos) ---
import Header from './components/Header';
import Navbar from './components/Navbar';
import Faqs from './components/Faqs';
import Opiniones from './components/Opiniones';

// NUEVOS COMPONENTES: Control de flujo inicial de captación
import OnboardingWizard from './components/OnboardingWizard';

import olaSuperior from './assets/image 2.png';
import olaInferior from './assets/image 10 (1).png';


// URL base de la API backend
const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  'https://mate-matico-backend.onrender.com/api';


// Configuración Firebase Client
const firebaseClientConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

let firebaseApp;
let firebaseAuth;


export default function App() {
  const [token, setToken] = useState(
    localStorage.getItem('idToken') || ''
  );

  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);

  const [statusMsg, setStatusMsg] = useState('');
  const [isStatusOk, setIsStatusOk] = useState(true);

  // Pestaña activa
  const [activeTab, setActiveTab] = useState('perfil');

  // Pestaña de visitantes
  const [visitorTab, setVisitorTab] = useState('login'); // 'login' | 'faqs' | 'opiniones'

  /*
    Intentar recuperar sesión automáticamente al iniciar la aplicación.
  */
  React.useEffect(() => {
    const savedToken = localStorage.getItem('idToken');
    if (savedToken) {
      loadProfile(savedToken);
      loadUserProgress(savedToken);
    }
  }, []);

  React.useEffect(() => {
    if (!user) {
      document.body.classList.add('visitor-body');
    } else {
      document.body.classList.remove('visitor-body');
    }
    return () => {
      document.body.classList.remove('visitor-body');
    };
  }, [user]);


  const setStatus = (msg, ok = true) => {
    setStatusMsg(msg);
    setIsStatusOk(ok);
  };
/*
  Wrapper estándar para llamadas HTTP al backend.
*/
const apiCall = async (path, options = {}, customToken = null) => {
  const headers = {
    "Content-Type": "application/json",
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

  // 🔴 DEBUG IMPORTANTE: ver respuesta real del backend
  console.log("API RESPONSE:", {
    status: res.status,
    ok: res.ok,
    data,
  });

  if (!res.ok) {
    console.log("API ERROR RAW:", data);

    throw {
      status: res.status,
      message: data.error || res.statusText || "Error inesperado en la API",
      raw: data,
    };
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
    Carga del SDK Firebase.
  */
  const getFirebaseAuth = async () => {
    if (!firebaseApp) {
      if (
        !firebaseClientConfig.apiKey ||
        !firebaseClientConfig.projectId
      ) {
        throw new Error(
          'Configurá REACT_APP_FIREBASE_API_KEY y REACT_APP_FIREBASE_PROJECT_ID en frontend/.env'
        );
      }
      firebaseApp = initializeApp(firebaseClientConfig);
      firebaseAuth = getAuth(firebaseApp);
      firebaseAuth.languageCode = 'es';
    }

    const provider = new GoogleAuthProvider();

    return {
      auth: firebaseAuth,
      GoogleAuthProvider,
      signInWithPopup,
      provider,
    };
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
    Recuperar Contraseña usando Firebase.
  */
  const handleRecoverPassword = async (email) => {
    try {
      setStatus('Enviando correo de recuperación...');
      const { auth } = await getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
      setStatus(
        'Te enviamos un correo electrónico con instrucciones para restablecer tu contraseña.',
        true
      );
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

  const handleOnboardingComplete = (updatedUser) => {
    setUser(updatedUser);
    loadUserProgress(token);
    setActiveTab('lecciones');
  };

  if (!user) {
    /* PÁGINA DE INGRESO: Solo el Login/Registro a pantalla completa con su fondo y olas */
    return (
      <div className="app-main-layout">
        <img src={olaSuperior} alt="" className="global-wave ola-superior" />
        <img src={olaInferior} alt="" className="global-wave ola-inferior" />
        <Auth
          onLogin={handleLogin}
          onGoogleLogin={handleGoogleLogin}
          onRegister={handleRegister}
          onRecoverPassword={handleRecoverPassword}
          statusMsg={statusMsg}
          isStatusOk={isStatusOk}
        />
      </div>
    );
  }

  if (!user.onboarding || !user.onboarding.completado) {
    /* FLUJO DE ONBOARDING: Pantalla completa limpia para el asistente de onboarding */
    return (
      <div className="app-main-layout">
        <img src={olaSuperior} alt="" className="global-wave ola-superior" />
        <img src={olaInferior} alt="" className="global-wave ola-inferior" />
        <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <main>
            <section className="seccion-onboarding" style={{ padding: '40px 5%' }}>
              <OnboardingWizard
                apiCall={apiCall}
                onComplete={handleOnboardingComplete}
              />
            </section>
          </main>
          <footer className="footer" style={{ borderTop: 'none' }}>
            <p>API Endpoint: <code>{API_BASE}</code></p>
            <p style={{ marginTop: '5px' }}>
              Mate-Mático Monorepo MVP — React Frontend © 2026
            </p>
          </footer>
        </div>
      </div>
    );
  }

  /* PANEL PRINCIPAL: Usuario logueado con onboarding completado, cabecera compacta con estadísticas */
  return (
    <div className="app-main-layout">
      <img src={olaSuperior} alt="" className="global-wave ola-superior" />
      <img src={olaInferior} alt="" className="global-wave ola-inferior" />
      <div className="app-container" id="arriba" style={{ minHeight: '100vh' }}>
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <img className="dashboard-logo" src="./img/matemático.png" alt="el mate-mático" />
            <h2>EL MATE-MÁTICO</h2>
          </div>
          <div className="dashboard-header-right">
            <span>🔥 {user.rachaDias ?? 0} {user.rachaDias === 1 ? 'día' : 'días'}</span>
            <span>✨ {user.puntosTotales ?? 0} pts</span>
          </div>
        </header>

        <main>
          <div>
            <nav className="tab-bar">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'perfil' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('perfil')}
              >
                <span className="tab-text-full">1. Mi Perfil</span>
                <span className="tab-text-short">Perfil</span>
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === 'lecciones' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('lecciones')}
              >
                <span className="tab-text-full">2. Lecciones y Ejercicios</span>
                <span className="tab-text-short">Lecciones</span>
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === 'progreso' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('progreso')}
              >
                <span className="tab-text-full">3. Mi Progreso y Logros</span>
                <span className="tab-text-short">Progreso</span>
              </button>
            </nav>

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
                  onAnswerSuccess={handleAnswerSuccess}
                  progress={progress}
                  onRefreshProgress={loadUserProgress}
                  user={user}
                />
              )}

              {activeTab === 'progreso' && (
                <Progress apiCall={apiCall} />
              )}
            </div>
          </div>
        </main>

        <footer className="footer">
          <p>API Endpoint: <code>{API_BASE}</code></p>
          <p style={{ marginTop: '5px' }}>
            Mate-Mático Monorepo MVP — React Frontend © 2026
          </p>
        </footer>
      </div>
    </div>
  );
}