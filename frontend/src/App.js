import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

import Auth from './components/Auth';
import Profile from './components/Profile';
import Modules from './components/Modules';
import Progress from './components/Progress';

import Header from './components/Header';
import Navbar from './components/Navbar';
import Faqs from './components/Faqs';
import Opiniones from './components/Opiniones';

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  'https://mate-matico-backend.onrender.com/api';

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

  const [activeTab, setActiveTab] = useState('perfil');

  const setStatus = (msg, ok = true) => {
    setStatusMsg(msg);
    setIsStatusOk(ok);
  };

  const apiCall = async (path, options = {}, customToken = null) => {
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
        data.error || res.statusText || 'Error inesperado en la API'
      );
    }

    return data;
  };

  // ✅ FIX: callbacks sin dependencias (evita ESLint + loops)
  const loadProfile = useCallback(async (activeToken = null) => {
    try {
      const data = await apiCall('/auth/me', {}, activeToken);
      setUser(data.usuario);
    } catch (err) {
      console.error('Error al cargar perfil:', err);
      logout();
    }
  }, []);

  const loadUserProgress = useCallback(async (activeToken = null) => {
    try {
      const data = await apiCall('/progress', {}, activeToken);
      setProgress(data.progreso || {});
    } catch (err) {
      console.error('Error al cargar progreso:', err);
    }
  }, []);

  // ✅ FIX limpio
  useEffect(() => {
    if (!token) return;

    loadProfile(token);
    loadUserProgress(token);
  }, [token]);

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

  // 🔥 FIREBASE OK
  const getFirebaseAuth = async () => {
    if (!firebaseApp) {
      const { initializeApp } = await import(
        'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js'
      );

      const { getAuth, GoogleAuthProvider, signInWithPopup } = await import(
        'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'
      );

      firebaseApp = initializeApp({
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID,
      });

      firebaseAuth = getAuth(firebaseApp);

      return {
        auth: firebaseAuth,
        provider: new GoogleAuthProvider(),
        signInWithPopup,
      };
    }

    const { GoogleAuthProvider, signInWithPopup } = await import(
      'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'
    );

    return {
      auth: firebaseAuth,
      provider: new GoogleAuthProvider(),
      signInWithPopup,
    };
  };

  const handleRegister = async (email, password, displayName) => {
    try {
      setStatus('Creando cuenta...');

      const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName }),
      });

      if (data.idToken) {
        saveToken(data.idToken);
        setUser(data.usuario);
        setActiveTab('perfil');
      }

      setStatus('¡Registro correcto!', true);
    } catch (err) {
      setStatus(err.message, false);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      setStatus('Iniciando sesión...');

      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      saveToken(data.idToken);
      setUser(data.usuario);
      setActiveTab('perfil');

      setStatus('Sesión iniciada', true);
    } catch (err) {
      setStatus(err.message, false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setStatus('Google login...');

      const { auth, provider, signInWithPopup } =
        await getFirebaseAuth();

      provider.setCustomParameters({
        prompt: 'select_account',
      });

      const credential = await signInWithPopup(auth, provider);
      const googleIdToken = await credential.user.getIdToken();

      const data = await apiCall('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken: googleIdToken }),
      });

      saveToken(data.idToken);
      setUser(data.usuario);
      setActiveTab('perfil');

      setStatus('Login exitoso', true);
    } catch (err) {
      setStatus(err.message, false);
    }
  };

  return (
    <div className="app-container" id="arriba">
      <Navbar />
      <Header />

      <main>
        {!user ? (
          <section style={{ textAlign: 'center', padding: 40 }}>
            <Auth
              onLogin={handleLogin}
              onGoogleLogin={handleGoogleLogin}
              onRegister={handleRegister}
              statusMsg={statusMsg}
              isStatusOk={isStatusOk}
            />
          </section>
        ) : (
          <>
            <nav className="tab-bar">
              <button onClick={() => setActiveTab('perfil')}>Mi Perfil</button>
              <button onClick={() => setActiveTab('lecciones')}>Lecciones</button>
              <button onClick={() => setActiveTab('progreso')}>Progreso</button>
            </nav>

            {activeTab === 'perfil' && (
              <Profile
                user={user}
                onLogout={logout}
                onRefresh={() => {
                  loadProfile(token);
                  loadUserProgress(token);
                }}
              />
            )}

            {activeTab === 'lecciones' && (
              <Modules
                apiCall={apiCall}
                progress={progress}
                onRefreshProgress={() => loadUserProgress(token)}
              />
            )}

            {activeTab === 'progreso' && (
              <Progress apiCall={apiCall} />
            )}
          </>
        )}

        <Faqs />
        <Opiniones />
      </main>

      <footer className="footer">
        <p>API: <code>{API_BASE}</code></p>
      </footer>
    </div>
  );
}