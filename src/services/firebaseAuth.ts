import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  User,
  getAuth
} from 'firebase/auth';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { auth, firebaseConfig } from '../config/firebase';

const OWNER_EMAIL = 'pdas966846@gmail.com';

// ============================================
// OWNER AUTH
// ============================================
export const loginOwner = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
  try {
    if (email.trim().toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
      return { success: false, error: 'Yeh email Owner account nahi hai!' };
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Owner logged in:', userCredential.user.email);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    console.error('❌ Owner login error:', error.code);
    let errorMsg = 'Login fail ho gaya';
    switch (error.code) {
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        errorMsg = 'Password galat hai!'; break;
      case 'auth/user-not-found':
        errorMsg = 'Yeh user exist nahi karta!'; break;
      case 'auth/too-many-requests':
        errorMsg = 'Bahut zyada galat attempts! Thodi der baad try karo.'; break;
      case 'auth/network-request-failed':
        errorMsg = 'Internet connection check karo!'; break;
      default:
        errorMsg = error.message || 'Kuch galat ho gaya';
    }
    return { success: false, error: errorMsg };
  }
};

export const logoutOwner = async (): Promise<boolean> => {
  try { await signOut(auth); return true; } catch { return false; }
};

export const subscribeToAuth = (callback: (isOwner: boolean, user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
    callback(!!isOwner, user);
  });
};

export const OWNER_EMAIL_CONST = OWNER_EMAIL;

// ============================================
// VLE AUTH
// ============================================

// Secondary app for VLE account creation (Owner stays logged in)
let secondaryApp: FirebaseApp | null = null;
const getSecondaryAuth = () => {
  if (!secondaryApp) {
    const existing = getApps().find(a => a.name === 'vle-secondary');
    secondaryApp = existing || initializeApp(firebaseConfig, 'vle-secondary');
  }
  return getAuth(secondaryApp);
};

// Create VLE Firebase account (called from Owner panel when approving)
export const createVleAuthAccount = async (email: string, password: string): Promise<{ success: boolean; error?: string; uid?: string }> => {
  try {
    const secAuth = getSecondaryAuth();
    const userCred = await createUserWithEmailAndPassword(secAuth, email, password);
    const uid = userCred.user.uid;
    await signOut(secAuth);
    console.log('✅ VLE Auth account created:', email);
    return { success: true, uid };
  } catch (error: any) {
    console.error('❌ VLE create error:', error.code);
    let errorMsg = 'Account creation failed';
    switch (error.code) {
      case 'auth/email-already-in-use': errorMsg = 'Yeh email already registered hai'; break;
      case 'auth/invalid-email': errorMsg = 'Invalid email format'; break;
      case 'auth/weak-password': errorMsg = 'Password kamzor hai (min 6 characters)'; break;
    }
    return { success: false, error: errorMsg };
  }
};

// VLE Login
export const loginVle = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
  try {
    // Owner ko VLE login se roko
    if (email.trim().toLowerCase() === OWNER_EMAIL.toLowerCase()) {
      return { success: false, error: 'Owner account VLE Portal se login nahi kar sakta' };
    }
    
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ VLE logged in:', userCred.user.email);
    return { success: true, user: userCred.user };
  } catch (error: any) {
    console.error('❌ VLE login error:', error.code);
    let errorMsg = 'Login fail ho gaya';
    switch (error.code) {
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        errorMsg = 'Password galat hai!'; break;
      case 'auth/user-not-found':
        errorMsg = 'Yeh email registered nahi hai'; break;
      case 'auth/too-many-requests':
        errorMsg = 'Bahut zyada galat attempts! Thodi der baad try karo.'; break;
      case 'auth/network-request-failed':
        errorMsg = 'Internet check karo!'; break;
      default:
        errorMsg = error.message || 'Kuch galat ho gaya';
    }
    return { success: false, error: errorMsg };
  }
};

// VLE Logout
export const logoutVle = async (): Promise<boolean> => {
  try { await signOut(auth); console.log('✅ VLE logged out'); return true; } catch { return false; }
};

// VLE Auth listener — fires when VLE logs in/out
export const subscribeToVleAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    if (user && user.email?.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
      callback(user);
    } else {
      callback(null);
    }
  });
};

// Password generator for VLEs
export const generateVlePassword = (): string => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `Vle@${random}`;
};
