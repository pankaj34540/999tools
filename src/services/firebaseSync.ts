import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================
// DEEP CLEAN — Remove undefined/null but ALLOW empty strings
// (Firestore accepts empty strings, only rejects undefined)
// ============================================
const deepClean = (value: any): any => {
  if (value === null || value === undefined) return undefined;
  
  if (Array.isArray(value)) {
    return value.map(item => deepClean(item)).filter(item => item !== undefined);
  }
  
  if (typeof value === 'object') {
    const cleanedObj: Record<string, any> = {};
    Object.entries(value).forEach(([key, val]) => {
      const cleanedVal = deepClean(val);
      // ✅ Allow empty strings — only skip undefined
      if (cleanedVal !== undefined) {
        cleanedObj[key] = cleanedVal;
      }
    });
    return cleanedObj;
  }
  
  // ✅ Allow empty strings (return as-is)
  return value;
};

// ============================================
// SITE CONFIG
// ============================================
export const saveSiteConfigToFirebase = async (config: any) => {
  try {
    const cleaned = deepClean(config);
    await setDoc(doc(db, 'siteConfig', 'main'), cleaned);
    console.log('✅ Site config saved to Firebase');
    return true;
  } catch (error: any) {
    console.error('❌ Error saving site config:', error.code, error.message);
    return false;
  }
};

export const loadSiteConfigFromFirebase = async () => {
  try {
    const docRef = doc(db, 'siteConfig', 'main');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error: any) {
    console.error('❌ Error loading site config:', error.code, error.message);
    return null;
  }
};

export const subscribeToSiteConfig = (callback: (config: any) => void) => {
  return onSnapshot(doc(db, 'siteConfig', 'main'), (docSnap) => {
    if (docSnap.exists()) callback(docSnap.data());
  });
};

// ============================================
// VLEs
// ============================================
export const saveVlesToFirebase = async (vles: any[]) => {
  try {
    const cleaned = deepClean(vles) || [];
    await setDoc(doc(db, 'data', 'vles'), { list: cleaned });
    return true;
  } catch (error: any) {
    console.error('❌ Error saving VLEs:', error.code, error.message);
    return false;
  }
};

export const loadVlesFromFirebase = async () => {
  try {
    const docSnap = await getDoc(doc(db, 'data', 'vles'));
    return docSnap.exists() ? docSnap.data().list || [] : null;
  } catch (error: any) {
    console.error('❌ Error loading VLEs:', error.code, error.message);
    return null;
  }
};

export const subscribeToVles = (callback: (vles: any[]) => void) => {
  return onSnapshot(doc(db, 'data', 'vles'), (docSnap) => {
    if (docSnap.exists()) callback(docSnap.data().list || []);
  });
};

// ============================================
// VLE APPLICATIONS
// ============================================
export const saveApplicationsToFirebase = async (apps: any[]) => {
  try {
    console.log('📝 Saving applications to Firebase:', apps.length, 'items');
    const cleaned = deepClean(apps) || [];
    await setDoc(doc(db, 'data', 'vleApplications'), { list: cleaned });
    console.log('✅ Applications saved to Firebase');
    return true;
  } catch (error: any) {
    console.error('❌ Error saving applications:', error.code, error.message);
    return false;
  }
};

export const loadApplicationsFromFirebase = async () => {
  try {
    const docSnap = await getDoc(doc(db, 'data', 'vleApplications'));
    return docSnap.exists() ? docSnap.data().list || [] : null;
  } catch (error: any) {
    console.error('❌ Error loading applications:', error.code, error.message);
    return null;
  }
};

// ============================================
// ORDERS
// ============================================
export const saveOrdersToFirebase = async (orders: any[]) => {
  try {
    const cleaned = deepClean(orders) || [];
    await setDoc(doc(db, 'data', 'orders'), { list: cleaned });
    return true;
  } catch (error: any) {
    console.error('❌ Error saving orders:', error.code, error.message);
    return false;
  }
};

export const loadOrdersFromFirebase = async () => {
  try {
    const docSnap = await getDoc(doc(db, 'data', 'orders'));
    return docSnap.exists() ? docSnap.data().list || [] : null;
  } catch (error: any) {
    console.error('❌ Error loading orders:', error.code, error.message);
    return null;
  }
};

// ============================================
// CUSTOM TOOLS
// ============================================
export const saveCustomToolsToFirebase = async (tools: any[]) => {
  try {
    const cleaned = deepClean(tools) || [];
    await setDoc(doc(db, 'data', 'customTools'), { list: cleaned });
    return true;
  } catch (error: any) {
    console.error('❌ Error saving custom tools:', error.code, error.message);
    return false;
  }
};

export const loadCustomToolsFromFirebase = async () => {
  try {
    const docSnap = await getDoc(doc(db, 'data', 'customTools'));
    return docSnap.exists() ? docSnap.data().list || [] : null;
  } catch (error: any) {
    console.error('❌ Error loading custom tools:', error.code, error.message);
    return null;
  }
};

// ============================================
// IMPORTANT LINKS
// ============================================
export const saveLinksToFirebase = async (links: any[]) => {
  try {
    const cleaned = deepClean(links) || [];
    await setDoc(doc(db, 'data', 'importantLinks'), { list: cleaned });
    return true;
  } catch (error: any) {
    console.error('❌ Error saving links:', error.code, error.message);
    return false;
  }
};

export const loadLinksFromFirebase = async () => {
  try {
    const docSnap = await getDoc(doc(db, 'data', 'importantLinks'));
    return docSnap.exists() ? docSnap.data().list || [] : null;
  } catch (error: any) {
    console.error('❌ Error loading links:', error.code, error.message);
    return null;
  }
};
