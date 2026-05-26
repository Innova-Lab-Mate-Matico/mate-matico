import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Modules from './components/Modules';
import Progress from './components/Progress';

/*
  MATE-MÁTICO — APPLICACIÓN PRINCIPAL (BOCETO DESACOPLADO / DESARROLLADORES)
  Este archivo orquesta el estado global de la sesión del alumno.
  - Sincroniza tokens JWT de Firebase en localStorage.
  - Controla la navegación por PESTAÑAS (Perfil, Lecciones, Progreso) cuando hay sesión.
  - Realiza peticiones asíncronas REST a la API del backend.
  - Carga el SDK de Firebase dinámicamente bajo demanda para optimizar la velocidad.
  
  Tu equipo de frontend puede reorganizar el layout, cambiar de pestañas a rutas 
  (react-router-dom), añadir Tailwind o la biblioteca UI que prefieran, 
  ya que la lógica e inyección de tokens se encuentra 100% resuelta y aislada aquí.
*/

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const firebaseClientConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('idToken') || '');
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [isStatusOk, setIsStatusOk] = useState(true);
  const [firebaseAuthModule, setFirebaseAuthModule] = useState(null);
  
  // Control de la pestaña activa en React ('perfil' | 'lecciones' | 'progreso')
  const [activeTab, setActiveTab] = useState('perfil');

  // Intentar cargar perfil y progreso al montar si ya existe sesión
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

  // Envoltura HTTP estándar para consumir API del Backend
  const apiCall = async (path, options = {}, customToken = null) => {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const activeToken = customToken || token;
    
    if (activeToken) {
      headers.Authorization = `Bearer ${activeToken}`;
    }

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || res.statusText || 'Error inesperado en la API');
    }
    return data;
  };

  const loadProfile = async (activeToken = null) => {
    try {
      const data = await apiCall('/auth/me', {}, activeToken);
      setUser(data.usuario);
    } catch (err) {
      console.error('Error al cargar perfil:', err);
      logout();
    }
  };

  const loadUserProgress = async (activeToken = null) => {
    try {
      const data = await apiCall('/progress', {}, activeToken);
      setProgress(data.progreso || {});
    } catch (err) {
      console.error('Error al cargar progreso:', err);
    }
  };

  const saveToken = (idToken) => {
    setToken(idToken);
    localStorage.setItem('idToken', idToken);
  };

  const logout = () => {
    setToken('');
    setUser(null);
    setProgress(null);
    localStorage.removeItem('idToken');
    setStatus('Sesión cerrada correctamente', true);
  };

  // Importación dinámica del SDK de Firebase Client en el navegador
  const getFirebaseAuth = async () => {
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
    const authInstance = getAuth(app);
    const provider = new GoogleAuthProvider();

    const module = { auth: authInstance, GoogleAuthProvider, signInWithPopup, provider };
    setFirebaseAuthModule(module);
    return module;
  };

  // Callback Registro Email/Contraseña
  const handleRegister = async (email, password, displayName) => {
    try {
      setStatus('Creando cuenta...');
      const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName }),
      });

      if (!data.idToken) {
        setStatus('Registro correcto. Iniciá sesión con tu email.', true);
        return;
      }

      saveToken(data.idToken);
      loadUserProgress(data.idToken);
      setStatus('¡Registro correcto! Bienvenido a Mate-Mático', true);
      setUser(data.usuario);
      setActiveTab('perfil'); // Pestaña de bienvenida
    } catch (err) {
      setStatus(err.message, false);
    }
  };

  // Callback Login Email/Contraseña
  const handleLogin = async (email, password) => {
    try {
      setStatus('Iniciando sesión...');
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      saveToken(data.idToken);
      loadUserProgress(data.idToken);
      setStatus('Sesión iniciada con éxito', true);
      setUser(data.usuario);
      setActiveTab('perfil');
    } catch (err) {
      setStatus(err.message, false);
    }
  };

  // Callback Google Login (Popup de Firebase)
  const handleGoogleLogin = async () => {
    try {
      setStatus('Abriendo panel de Google...');
      const { auth, signInWithPopup, provider } = await getFirebaseAuth();
      provider.setCustomParameters({ prompt: 'select_account' });

      const credential = await signInWithPopup(auth, provider);
      const googleIdToken = await credential.user.getIdToken();

      setStatus('Sincronizando perfil con el servidor...');
      const data = await apiCall('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken: googleIdToken }),
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
      setActiveTab('perfil');
    } catch (err) {
      const friendlyMsg = err.code === 'auth/popup-closed-by-user'
        ? 'Ventana cerrada por el usuario. Reintentá.'
        : err.message;
      setStatus(friendlyMsg, false);
    }
  };

  // Actualizador de gamificación local tras resolver un ejercicio correctamente
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
      {/* Encabezado */}
      <header className="header">
        <div className="logo-section">
          <h1>🧉 Mate-Mático (Boceto Frontend)</h1>
          <p>Lógica de conexión 100% resuelta para desarrolladores</p>
        </div>
        {user && (
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            <span>🔥 Racha activa: {user.rachaDias ?? 0} días</span> | <span>✨ Puntos: {user.puntosTotales ?? 0} pts</span>
          </div>
        )}
      </header>

      {/* Contenido Principal */}
      <main>
        {!user ? (
          /* Vista de Autenticación si no hay sesión */
          <div style={{ maxWidth: '450px', margin: '0 auto' }}>
            <Auth
              onLogin={handleLogin}
              onGoogleLogin={handleGoogleLogin}
              onRegister={handleRegister}
              statusMsg={statusMsg}
              isStatusOk={isStatusOk}
            />
          </div>
        ) : (
          /* Vista con Pestañas si hay sesión activa */
          <div>
            {/* Navegación por pestañas */}
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

            {/* Renderizado condicional según pestaña seleccionada */}
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
      </main>

      {/* Pie de página informativo */}
      <footer className="footer">
        <p>API Endpoint: <code>{API_BASE}</code></p>
        <p style={{ marginTop: '5px' }}>Mate-Mático Monorepo MVP — React Boilerplate © 2026</p>
      </footer>
    </div>
  );
}
