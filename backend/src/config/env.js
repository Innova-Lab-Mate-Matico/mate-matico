import dotenv from 'dotenv';

dotenv.config({ path: '.env.gemini' });
dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Falta la variable de entorno ${name} en .env`);
  }
  return value.trim();
}

function optional(name, fallback = '') {
  const value = process.env[name];
  return value?.trim() ? value.trim() : fallback;
}

const projectId = required('FIREBASE_PROJECT_ID');
const nodeEnv = optional('NODE_ENV', 'development');

function parseCorsOrigins() {
  const raw = optional('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173');
  const origins = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Asegurar siempre los orígenes de producción del frontend para evitar fallos de CORS
  const prodOrigins = ['https://mate-matico.vercel.app', 'https://mate-matico.vercel.app/'];
  prodOrigins.forEach((origin) => {
    if (!origins.includes(origin)) {
      origins.push(origin);
    }
  });

  return origins;
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv,
  isProduction: nodeEnv === 'production',
  corsOrigins: parseCorsOrigins(),
  gemini: {
    apiKey: optional('GEMINI_API_KEY'),
    model: optional('GEMINI_MODEL', 'gemini-flash-latest'),
  },

  firebase: {
    projectId,
    webApiKey: optional('FIREBASE_WEB_API_KEY'),
    authDomain: optional('FIREBASE_AUTH_DOMAIN', `${projectId}.firebaseapp.com`),

    type: optional('FIREBASE_TYPE', 'service_account'),
    privateKeyId: required('FIREBASE_PRIVATE_KEY_ID'),
    privateKey: required('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    clientEmail: required('FIREBASE_CLIENT_EMAIL'),
    clientId: required('FIREBASE_CLIENT_ID'),
    authUri: optional('FIREBASE_AUTH_URI', 'https://accounts.google.com/o/oauth2/auth'),
    tokenUri: optional('FIREBASE_TOKEN_URI', 'https://oauth2.googleapis.com/token'),
    authProviderX509CertUrl: optional(
      'FIREBASE_AUTH_PROVIDER_X509_CERT_URL',
      'https://www.googleapis.com/oauth2/v1/certs'
    ),
    clientX509CertUrl: required('FIREBASE_CLIENT_X509_CERT_URL'),
    universeDomain: optional('FIREBASE_UNIVERSE_DOMAIN', 'googleapis.com'),
  },
};

export function getFirebaseServiceAccount() {
  const f = env.firebase;
  return {
    type: f.type,
    project_id: f.projectId,
    private_key_id: f.privateKeyId,
    private_key: f.privateKey,
    client_email: f.clientEmail,
    client_id: f.clientId,
    auth_uri: f.authUri,
    token_uri: f.tokenUri,
    auth_provider_x509_cert_url: f.authProviderX509CertUrl,
    client_x509_cert_url: f.clientX509CertUrl,
    universe_domain: f.universeDomain,
  };
}
