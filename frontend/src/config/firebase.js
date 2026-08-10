import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseClientConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

let firebaseApp = null;
let firebaseAuth = null;

/**
 * Inicializa y devuelve los objetos necesarios para la autenticación de Firebase.
 * @returns {Promise<{auth: any, GoogleAuthProvider: any, OAuthProvider: any, signInWithPopup: any, googleProvider: any}>}
 */
export const getFirebaseAuthDetails = async () => {
  if (!firebaseApp) {
    if (!firebaseClientConfig.apiKey || !firebaseClientConfig.projectId) {
      throw new Error(
        'Configurá REACT_APP_FIREBASE_API_KEY y REACT_APP_FIREBASE_PROJECT_ID en frontend/.env'
      );
    }
    firebaseApp = initializeApp(firebaseClientConfig);
    firebaseAuth = getAuth(firebaseApp);
    firebaseAuth.languageCode = 'es';
  }

  const googleProvider = new GoogleAuthProvider();

  return {
    auth: firebaseAuth,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithPopup,
    googleProvider,
  };
};

/**
 * Devuelve la instancia actual del servicio Auth de Firebase de forma síncrona.
 * Puede retornar null si no ha sido inicializada.
 */
export const getFirebaseAuth = () => {
  if (!firebaseAuth) {
    try {
      // Intentar inicialización rápida si los datos de configuración existen
      if (firebaseClientConfig.apiKey && firebaseClientConfig.projectId) {
        firebaseApp = initializeApp(firebaseClientConfig);
        firebaseAuth = getAuth(firebaseApp);
        firebaseAuth.languageCode = 'es';
        return firebaseAuth;
      }
    } catch (e) {
      console.warn("No se pudo auto-inicializar firebaseAuth síncronamente:", e);
    }
  }
  return firebaseAuth;
};
