import admin from 'firebase-admin';
import { getFirebaseServiceAccount } from './env.js';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(getFirebaseServiceAccount()),
  });
}

export const auth = admin.auth();
export const db = admin.firestore();
export default admin;
