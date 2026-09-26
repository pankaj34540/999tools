// Firebase Admin SDK — shared helper for Vercel serverless functions
// Uses modular API (firebase-admin v12+) — more reliable with ESM

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

let initialized = false;

export function initFirebase() {
  if (initialized) return;

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

  // Validate critical fields
  if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error('Service account JSON missing required fields (project_id, private_key, client_email)');
  }

  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount),
    });
    console.log('✅ Firebase Admin initialized for project:', serviceAccount.project_id);
  }

  initialized = true;
}

export function getFirestore() {
  initFirebase();
  return getAdminFirestore();
}
