import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../config/firebase';

// Owner ka email
const OWNER_EMAIL = 'pdas966846@gmail.com';

// ============================================
// OWNER LOGIN
// ============================================
export const loginOwner = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
  try {
    // Check karo ki sirf Owner hi login kare
    if (email.trim().toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
      return { 
        success: false, 
        error: 'Yeh email Owner account nahi hai!' 
      };
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Owner logged in:', userCredential.user.email);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    console.error('❌ Login error:', error.code);
    
    let errorMsg = 'Login fail ho gaya';
    
    switch (error.code) {
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        errorMsg = 'Password galat hai!';
        break;
      case 'auth/user-not-found':
        errorMsg = 'Yeh user exist nahi karta!';
        break;
      case 'auth/too-many-requests':
        errorMsg = 'Bahut zyada galat attempts! Thodi der baad try karo.';
        break;
      case 'auth/network-request-failed':
        errorMsg = 'Internet connection check karo!';
        break;
      default:
        errorMsg = error.message || 'Kuch galat ho gaya';
    }
    
    return { success: false, error: errorMsg };
  }
};

// ============================================
// OWNER LOGOUT
// ============================================
export const logoutOwner = async (): Promise<boolean> => {
  try {
    await signOut(auth);
    console.log('✅ Owner logged out');
    return true;
  } catch (error) {
    console.error('❌ Logout error:', error);
    return false;
  }
};

// ============================================
// CHECK IF OWNER IS LOGGED IN
// ============================================
export const checkOwnerAuth = (): Promise<User | null> => {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user && user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
        resolve(user);
      } else {
        resolve(null);
      }
    });
  });
};

// ============================================
// REAL-TIME AUTH LISTENER
// ============================================
export const subscribeToAuth = (callback: (isOwner: boolean, user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
    callback(!!isOwner, user);
  });
};

export const OWNER_EMAIL_CONST = OWNER_EMAIL;
