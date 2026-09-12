import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';

// SITE CONFIG
export const saveSiteConfigToFirebase = async (config: any) => {
  try {
    await setDoc(doc(db, 'siteConfig', 'main'), config);
    console.log('✅ Site config saved to Firebase');
    return true;
  } catch (error) {
    console.error('❌ Error saving site config:', error);
    return false;
  }
};

export const loadSiteConfigFromFirebase = async () => {
  try {
    const docRef = doc(db, 'siteConfig', 'main');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('❌ Error loading site config:', error);
    return null;
  }
};

export const subscribeToSiteConfig = (callback: (config: any) => void) => {
  return onSnapshot(doc(db, 'siteConfig', 'main'), (docSnap) => {
    if (docSnap.exists()) callback(docSnap.data());
  });
};

// VLEs
export const saveVlesToFirebase = async (vles: any[]) => {
  try {
    await setDoc(doc(db, 'data', 'vles'), { list: vles });
    return true;
  } catch (error) {
    return false;
  }
};

export const loadVlesFromFirebase = async () => {
  try {
    const docSnap = await getDoc(doc(db, 'data', 'vles'));
    return docSnap.exists() ? docSnap.data().list || [] : null;
  } catch (error) {
    return null;
  }
};

export const subscribeToVles = (callback: (vles: any[]) => void) => {
  return onSnapshot(doc(db, 'data', 'vles'), (docSnap) => {
    if (docSnap.exists()) callback(docSnap.data().list || []);
  });
};

// VLE APPLICATIONS
export const saveApplicationsToFirebase = async (apps: any[]) => {
  try {
    await setDoc(doc(db, 'data', 'vleApplications'), { list: apps });
    return true;
  } catch (error) {
    return false;
  }
};

export const loadApplicationsFromFirebase = async () => {
  try {
    const docSnap = await getDoc(doc(db, 'data', 'vleApplications'));
    return docSnap.exists() ? docSnap.data().list || [] : null;
  } catch (error) {
    return null;
  }
};

// ORDERS
export const saveOrdersToFirebase = async (orders: any[]) => {
  try {
    await setDoc(doc(db, 'data', 'orders'), { list: orders });
    return true;
  } catch (error) {
    return false;
  }
};

export const loadOrdersFromFirebase = async () => {
  try {
    const docSnap = await getDoc(doc(db, 'data', 'orders'));
    return docSnap.exists() ? docSnap.data().list || [] : null;
  } catch (error) {
    return null;
  }
};

// CUSTOM TOOLS
export const saveCustomToolsToFirebase = async (tools: any[]) => {
  try {
    await setDoc(doc(db, 'data', 'customTools'), { list: tools });
    return true;
  } catch (error) {
    return false;
  }
};

export const loadCustomToolsFromFirebase = async () => {
  try {
    const docSnap = await getDoc(doc(db, 'data', 'customTools'));
    return docSnap.exists() ? docSnap.data().list || [] : null;
  } catch (error) {
    return null;
  }
};

// IMPORTANT LINKS
export const saveLinksToFirebase = async (links: any[]) => {
  try {
    await setDoc(doc(db, 'data', 'importantLinks'), { list: links });
    return true;
  } catch (error) {
    return false;
  }
};

export const loadLinksFromFirebase = async () => {
  try {
    const docSnap = await getDoc(doc(db, 'data', 'importantLinks'));
    return docSnap.exists() ? docSnap.data().list || [] : null;
  } catch (error) {
    return null;
  }
};
