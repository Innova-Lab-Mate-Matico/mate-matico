import React, { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup, sendPasswordResetEmail, onIdTokenChanged } from 'firebase/auth';
import './App.css'; // Tus estilos globales
import './styles/Dashboard.css';
import Auth from './components/Auth';
import Home from './components/Home';
import Profile from './components/Profile';
import Modules from './components/Modules';
import Progress from './components/Progress';


// NUEVOS COMPONENTES: Control de flujo inicial de captación
import OnboardingWizard from './components/OnboardingWizard';

import olaSuperior from './assets/image 2.png';
import olaInferior from './assets/image 10 (1).png';
import descansoMascota from './assets/descanso.png';
import logoPrincipal from './assets/Logo.png';

// Íconos SVG oficiales de la barra inferior de Figma
import navLeccionesSvg from './assets/two_pager.svg';
import navPracticarSvg from './assets/cards_star.svg';
import navInicioSvg from './assets/home.svg';
import navProgresoSvg from './assets/diamond_shine.svg';
import navPerfilSvg from './assets/account_circle.svg';



// URL base de la API backend
const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000/api'
    : 'https://mate-matico-backend.onrender.com/api');


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
  const [activeTab, setActiveTab] = useState('inicio');

  const [networkError, setNetworkError] = useState(false);

  /*
    Escuchar cambios y renovación automática de token de Firebase
  */
  React.useEffect(() => {
    if (firebaseAuth) {
      const unsubscribe = onIdTokenChanged(firebaseAuth, async (currentUser) => {
        if (currentUser) {
          try {
            const freshToken = await currentUser.getIdToken();
            localStorage.setItem('idToken', freshToken);
            setToken(freshToken);
          } catch (err) {
            console.warn("Error al renovar token de Firebase en listener:", err);
          }
        }
      });
      return () => unsubscribe();
    }
  }, []);

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
  Wrapper estándar para llamadas HTTP al backend con auto-refresh y reintento inteligente de token expirado.
*/
const apiCall = React.useCallback(async (path, options = {}, customToken = null) => {
  const headers = {
    "Content-Type": "application/json",
    "x-client-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...options.headers,
  };

  let activeToken = customToken || token || localStorage.getItem('idToken');

  // Si Firebase Auth está activo, obtener el token más actualizado posible
  if (firebaseAuth && firebaseAuth.currentUser) {
    try {
      activeToken = await firebaseAuth.currentUser.getIdToken(false);
      localStorage.setItem('idToken', activeToken);
    } catch (e) {
      console.warn("Auto-refresh previo de token falló:", e);
    }
  }

  if (activeToken) {
    headers.Authorization = `Bearer ${activeToken}`;
  }

  let res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Interceptor de 401 Unauthorized: renovar forzosamente y reintentar la petición automáticamente
  if (res.status === 401 && firebaseAuth && firebaseAuth.currentUser) {
    try {
      console.log("⚠️ Token 401 detectado. Renovando token con Firebase...");
      const refreshedToken = await firebaseAuth.currentUser.getIdToken(true);
      localStorage.setItem('idToken', refreshedToken);
      setToken(refreshedToken);
      headers.Authorization = `Bearer ${refreshedToken}`;

      res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });
    } catch (refreshErr) {
      console.error("Falló la renovación forzada de token expirado:", refreshErr);
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || res.statusText || "Error inesperado en la API");
    err.status = res.status;
    err.raw = data;
    throw err;
  }

  return data;
}, [token]);

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
      setActiveTab('inicio');
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
      setActiveTab('inicio');
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
      setActiveTab('inicio');
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
    Login Microsoft/Outlook usando Firebase Popup.
  */
  const handleMicrosoftLogin = async () => {
    try {
      setStatus('Abriendo panel de Microsoft/Outlook...');
      const { auth, signInWithPopup } = await getFirebaseAuth();
      const provider = new OAuthProvider('microsoft.com');
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      const credential = await signInWithPopup(auth, provider);
      const msIdToken = await credential.user.getIdToken();

      setStatus('Sincronizando perfil con el servidor...');
      const data = await apiCall('/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          idToken: msIdToken,
        }),
      });

      saveToken(data.idToken);
      loadUserProgress(data.idToken);

      setStatus(
        data.esNuevo
          ? `¡Cuenta creada! Hola, ${data.usuario?.displayName || data.usuario?.email}`
          : `Bienvenido de nuevo, ${data.usuario?.displayName || data.usuario?.email}`,
        true
      );

      setUser(data.usuario);
      setActiveTab('inicio');
    } catch (err) {
      const friendlyMsg =
        err.code === 'auth/popup-closed-by-user'
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
    setActiveTab('inicio');
  };

  const handleRetryConnection = () => {
    setNetworkError(false);
    const savedToken = token || localStorage.getItem('idToken');
    if (savedToken) {
      loadProfile(savedToken);
      loadUserProgress(savedToken);
    }
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
          onMicrosoftLogin={handleMicrosoftLogin}
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
          <div className="dashboard-header-left" style={{ display: 'flex', alignItems: 'center' }}>
            <img src={logoPrincipal} alt="Mate-Mático" className="dashboard-logo" style={{ height: '62px', objectFit: 'contain' }} />
          </div>
          <div className="dashboard-header-right">
            <span>🔥 {user.rachaDias ?? 0} {user.rachaDias === 1 ? 'día' : 'días'}</span>
            <span>✨ {user.puntosTotales ?? 0} pts</span>
          </div>
        </header>

        <main style={{ paddingBottom: '120px', minHeight: 'calc(100vh - 180px)', position: 'relative' }}>
          <div>
            <div className="layout-grid">
              {activeTab === 'perfil' && (
                <Profile
                  user={user}
                  onLogout={logout}
                  apiCall={apiCall}
                  onRefresh={() => {
                    loadProfile();
                    loadUserProgress();
                  }}
                />
              )}
              {activeTab === 'inicio' && (
                <Home
                  user={user}
                  progress={progress}
                  onNavigate={(tab) => setActiveTab(tab)}
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

              {activeTab === 'practicar' && (
                <div
                  className="card"
                  style={{
                    textAlign: 'center',
                    padding: '50px 24px',
                    borderRadius: '24px',
                    backgroundColor: '#ffffff',
                    margin: '20px auto',
                    maxWidth: '600px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
                    border: '1.5px solid #e2e8f0'
                  }}
                >
                  <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🎯</div>
                  <h2 style={{ color: '#163b74', margin: '0 0 10px 0', fontFamily: 'Poppins, sans-serif', fontSize: '1.5rem', fontWeight: 700 }}>
                    Sección Practicar
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', margin: 0, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Esta pestaña está reservada para los nuevos modos de práctica guiada. ¡Próximamente disponible!
                  </p>
                </div>
              )}

              {activeTab === 'logros' && (
                <Progress apiCall={apiCall} />
              )}
            </div>
          </div>

          {/* Footer Profesional Innova Lab */}
          <footer className="figma-pro-footer">
            <div className="footer-content">
              <h3 className="footer-brand">Mate-Mático — Innova Lab</h3>
              <p className="footer-tagline">
                Plataforma Educativa Adaptativa con Gamificación e Inteligencia Artificial
              </p>
              <div className="footer-divider"></div>
              <p className="footer-copyright">
                © 2026 Innova Lab — Todos los derechos reservados.
              </p>
            </div>
          </footer>
        </main>

        {/* Barra de navegación inferior fija estilo Figma */}
        <nav className="figma-bottom-nav">
          <button
            type="button"
            className={`figma-nav-item ${activeTab === 'lecciones' ? 'active' : ''}`}
            onClick={() => setActiveTab('lecciones')}
          >
            <img src={navLeccionesSvg} alt="Lecciones" />
            <span>Lecciones</span>
          </button>

          <button
            type="button"
            className={`figma-nav-item ${activeTab === 'practicar' ? 'active' : ''}`}
            onClick={() => setActiveTab('practicar')}
          >
            <img src={navPracticarSvg} alt="Practicar" />
            <span>Practicar</span>
          </button>

          <button
            type="button"
            className={`figma-nav-item ${activeTab === 'inicio' ? 'active' : ''}`}
            onClick={() => setActiveTab('inicio')}
          >
            <img src={navInicioSvg} alt="Inicio" />
            <span>Inicio</span>
          </button>

          <button
            type="button"
            className={`figma-nav-item ${activeTab === 'progreso' ? 'active' : ''}`}
            onClick={() => setActiveTab('progreso')}
          >
            <img src={navProgresoSvg} alt="Progreso" />
            <span>Progreso</span>
          </button>

          <button
            type="button"
            className={`figma-nav-item ${activeTab === 'perfil' ? 'active' : ''}`}
            onClick={() => setActiveTab('perfil')}
          >
            <img src={navPerfilSvg} alt="Perfil" />
            <span>Perfil</span>
          </button>
        </nav>
      </div>
      {networkError && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div 
            className="app-card"
            style={{
              maxWidth: '440px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '30px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              textAlign: 'center',
              boxSizing: 'border-box'
            }}
          >
            <img 
              src={descansoMascota} 
              alt="Mascota descansando" 
              style={{ width: '120px', marginBottom: '20px' }}
            />
            <h2 style={{ fontFamily: 'Poppins, sans-serif', color: '#163b74', fontWeight: 800, fontSize: '1.4rem', margin: '0 0 10px 0' }}>
              ¡Ups! No pudimos conectar con Mate-Matico
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: '1.5', margin: '0 0 24px 0' }}>
              Parece que hay un problema temporal con tu conexión a internet o la pizarra de la aplicación está en mantenimiento.
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 600, border: 'none', borderRadius: '12px', cursor: 'pointer' }}
              onClick={handleRetryConnection}
            >
              Reintentar conexión ↻
            </button>
          </div>
        </div>
      )}
    </div>
  );
}