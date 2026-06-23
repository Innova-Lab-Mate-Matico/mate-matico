<<<<<<< Updated upstream

import React, { useState, useEffect } from 'react';
=======
import React, { useState } from 'react';
>>>>>>> Stashed changes
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import './App.css'; // Tus estilos globales
import Auth from './components/Auth';
import Profile from './components/Profile';
import Modules from './components/Modules';
import Progress from './components/Progress';
import OnboardingWizard from './components/OnboardingWizard';

// --- TUS COMPONENTES INYECTADOS (Unificados con tus flujos nuevos) ---
import Header from './components/Header';
import Navbar from './components/Navbar';
import Faqs from './components/Faqs';
import Opiniones from './components/Opiniones';
import InteresesSeleccion from './components/InteresesSeleccion';
import RecomendacionModulo from './components/RecomendacionModulo';

// NUEVOS COMPONENTES: Control de flujo inicial de captación
import EdadSelector from "./components/EdadSelector";
import NivelSelector from "./components/NivelSelector";

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

  // NUEVO ESTADO: Control de pasos para usuarios no logueados
  const [step, setStep] = useState(1);

  /*
    Intentar recuperar sesión automáticamente al iniciar la aplicación.
  */
  useEffect(() => {
    if (token) {
      loadProfile(token);
      loadUserProgress(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="app-container" id="arriba">
      {/* 1. Navbar Oficial en la parte superior */}
      <Navbar />

      {/* 2. Tu cabecera oficial con la info del proyecto */}
      <Header />

      {/* Main */}
      <main>
        {/* CONEXIÓN REAL: Si el usuario NO está logueado, muestra el flujo por pasos y Auth */}
        {!user ? (
          <section className="seccion-login-prompt" style={{ padding: '40px 10%', textAlign: 'center' }}>
            
            {/* 🆕 FLOW POR PASOS INYECTADO */}
            {step === 1 && (
              <EdadSelector onNext={() => setStep(2)} />
            )}

            {step === 2 && (
              <NivelSelector />
            )}

            {/* 🔐 LOGIN AUTOMÁTICO DEBAJO */}
            <p style={{ marginTop: '30px' }}>Por favor, inicia sesión para ver tu progreso técnico.</p>
            <div style={{ maxWidth: '450px', margin: '20px auto 0' }}>
              <Auth
                onLogin={handleLogin}
                onGoogleLogin={handleGoogleLogin}
                onRegister={handleRegister}
                statusMsg={statusMsg}
                isStatusOk={isStatusOk}
              />
            </div>
          </section>
        ) : !user.onboarding?.completado ? (
          /* Si el usuario no completó el onboarding, le mostramos el Wizard */
          <section className="seccion-onboarding" style={{ padding: '20px 10%' }}>
            <OnboardingWizard
              apiCall={apiCall}
              onComplete={(updatedUser) => {
                setUser(updatedUser);
                setStatus(`¡Onboarding completado! Módulo recomendado: ${updatedUser.onboarding?.moduloRecomendado?.toUpperCase()}`, true);
              }}
            />
          </section>
        ) : (
<<<<<<< Updated upstream
          /* Si el usuario SÍ inició sesión y completó onboarding, despliega directamente las pestañas */
=======
          /* Si el usuario SÍ inició sesión, despliega directamente las pestañas del panel */
>>>>>>> Stashed changes
          <div>
            {/* Sistema de pestañas original del repositorio remoto */}
            <nav className="tab-bar">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'perfil' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('perfil')}
              >
                1. Mi Perfil
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === 'lecciones' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('lecciones')}
              >
                2. Lecciones y Ejercicios
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === 'progreso' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('progreso')}
              >
                3. Mi Progreso y Logros
              </button>
            </nav>

            {/* Contenido de las pestañas */}
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
                />
              )}

              {activeTab === 'progreso' && (
                <Progress apiCall={apiCall} />
              )}
            </div>
          </div>
        )}

        {/* 3. SEGUNDO BLOQUE: Tus tarjetas de captación (Intereses y Recomendaciones) */}
        <section id="intereses" className="seccion-intereses">
          <InteresesSeleccion />
        </section>

        <section id="recomendacion" className="seccion-recomendacion">
          <RecomendacionModulo />
        </section>

        {/* 4. TERCER BLOQUE: Secciones informativas estáticas al final de todo */}
        <Faqs />
        <Opiniones />
      </main>

      {/* Footer Técnico del repositorio remoto */}
      <footer className="footer">
        <p>API Endpoint: <code>{API_BASE}</code></p>
        <p style={{ marginTop: '5px' }}>
          Mate-Mático Monorepo MVP — React Frontend © 2026
        </p>
      </footer>
    </div>
  );
}