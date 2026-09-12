import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCyDDCZ1Stj8NkbCf0W10jvpsoF2vV7pEI",
  authDomain: "tools-42873.firebaseapp.com",
  projectId: "tools-42873",
  storageBucket: "tools-42873.firebasestorage.app",
  messagingSenderId: "685357523937",
  appId: "1:685357523937:web:5aca0543865d811c6e28a0"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
