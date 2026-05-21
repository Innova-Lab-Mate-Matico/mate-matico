import { readFileSync, writeFileSync, existsSync } from 'fs';

const jsonPath = 'config/firebase-service-account.json';
if (!existsSync(jsonPath)) {
  console.error('No existe', jsonPath);
  process.exit(1);
}

const sa = JSON.parse(readFileSync(jsonPath, 'utf8'));
const pk = sa.private_key.replace(/\n/g, '\\n');

const lines = [
  'PORT=3000',
  'NODE_ENV=development',
  '',
  `FIREBASE_PROJECT_ID=${sa.project_id}`,
  'FIREBASE_WEB_API_KEY=',
  `FIREBASE_AUTH_DOMAIN=${sa.project_id}.firebaseapp.com`,
  '',
  `FIREBASE_TYPE=${sa.type}`,
  `FIREBASE_PRIVATE_KEY_ID=${sa.private_key_id}`,
  `FIREBASE_PRIVATE_KEY="${pk}"`,
  `FIREBASE_CLIENT_EMAIL=${sa.client_email}`,
  `FIREBASE_CLIENT_ID=${sa.client_id}`,
  `FIREBASE_AUTH_URI=${sa.auth_uri}`,
  `FIREBASE_TOKEN_URI=${sa.token_uri}`,
  `FIREBASE_AUTH_PROVIDER_X509_CERT_URL=${sa.auth_provider_x509_cert_url}`,
  `FIREBASE_CLIENT_X509_CERT_URL=${sa.client_x509_cert_url}`,
  `FIREBASE_UNIVERSE_DOMAIN=${sa.universe_domain}`,
];

writeFileSync('.env', `${lines.join('\n')}\n`);
console.log('.env generado desde', jsonPath);
