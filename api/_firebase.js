// Firebase Admin SDK — shared helper for Vercel serverless functions
import admin from 'firebase-admin';

let initialized = false;

export function initFirebase() {
  if (initialized) return admin;

  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountB64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT env var not set');
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(
      Buffer.from(serviceAccountB64, 'base64').toString('utf-8')
    );
  } catch (err) {
    throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT: ' + err.message);
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  initialized = true;
  return admin;
}

export function getFirestore() {
  return initFirebase().firestore();
}
