// ============================================
// STAFF SERVICE — Firebase Auth + Firestore CRUD
// ============================================
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, firebaseConfig } from '../config/firebase';
import {
  Staff,
  StaffRole,
  StaffPermission,
  AuditLog,
  STAFF_ROLE_PERMISSIONS,
} from '../types';

// ============================================
// DEEP CLEAN
// ============================================
const deepClean = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(deepClean);
  if (typeof obj === 'object') {
    const cleaned: any = {};
    Object.keys(obj).forEach((key) => {
      const val = obj[key];
      if (val !== undefined) cleaned[key] = deepClean(val);
    });
    return cleaned;
  }
  return obj;
};

// ============================================
// CREATE STAFF — Secondary app to avoid owner logout
// ============================================
export const createStaffAccount = async (
  email: string,
  password: string,
  name: string,
  role: StaffRole,
  mobile: string | undefined,
  ownerEmail: string,
  notes?: string
): Promise<{ success: boolean; staff?: Staff; error?: string }> => {
  let secondaryApp: any = null;
  try {
    // 🔑 Use secondary app so owner stays logged in
    secondaryApp = initializeApp(firebaseConfig, `staff-creation-${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);

    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = cred.user.uid;

    // Auto-assign permissions based on role
    const permissions = STAFF_ROLE_PERMISSIONS[role];

    const now = new Date().toISOString();
    const staffData = deepClean({
      uid,
      email: email.toLowerCase(),
      name,
      mobile,
      role,
      permissions,
      active: true,
      createdBy: ownerEmail,
      createdAt: now,
      notes,
    });

    const ref = await addDoc(collection(db, 'staff'), {
      ...staffData,
      serverCreatedAt: serverTimestamp(),
    });

    // Sign out from secondary app
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);

    const newStaff: Staff = { ...staffData, id: ref.id };
    console.log('✅ Staff created:', ref.id, email);
    return { success: true, staff: newStaff };
  } catch (error: any) {
    // Cleanup secondary app if exists
    if (secondaryApp) {
      try { await deleteApp(secondaryApp); } catch (e) { /* ignore */ }
    }

    console.error('❌ createStaffAccount error:', error);

    let errorMsg = 'Failed to create staff account';
    if (error.code === 'auth/email-already-in-use') {
      errorMsg = 'Email already in use — try different email';
    } else if (error.code === 'auth/weak-password') {
      errorMsg = 'Password too weak — minimum 6 characters';
    } else if (error.code === 'auth/invalid-email') {
      errorMsg = 'Invalid email address';
    } else if (error.message) {
      errorMsg = error.message;
    }

    return { success: false, error: errorMsg };
  }
};

// ============================================
// UPDATE STAFF
// ============================================
export const updateStaff = async (
  id: string,
  updates: Partial<Staff>
): Promise<boolean> => {
  try {
    // If role changed, auto-update permissions
    if (updates.role) {
      updates.permissions = STAFF_ROLE_PERMISSIONS[updates.role];
    }
    const clean = deepClean(updates);
    await updateDoc(doc(db, 'staff', id), clean);
    console.log('✅ Staff updated:', id);
    return true;
  } catch (error) {
    console.error('❌ updateStaff error:', error);
    return false;
  }
};

// ============================================
// TOGGLE STAFF ACTIVE
// ============================================
export const toggleStaffActive = async (id: string, active: boolean): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'staff', id), { active });
    return true;
  } catch (error) {
    console.error('❌ toggleStaffActive error:', error);
    return false;
  }
};

// ============================================
// DELETE STAFF
// ============================================
export const deleteStaff = async (id: string): Promise<boolean> => {
  try {
    // Note: Firebase Auth user cannot be deleted from client SDK
    // Owner needs to manually delete from Firebase Console → Authentication → Users
    await deleteDoc(doc(db, 'staff', id));
    console.log('✅ Staff Firestore doc deleted:', id);
    return true;
  } catch (error) {
    console.error('❌ deleteStaff error:', error);
    return false;
  }
};

// ============================================
// READ — All staff
// ============================================
export const getAllStaff = async (): Promise<Staff[]> => {
  try {
    const snap = await getDocs(collection(db, 'staff'));
    const list: Staff[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Staff));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('❌ getAllStaff error:', error);
    return [];
  }
};

export const subscribeToAllStaff = (
  callback: (staff: Staff[]) => void
): (() => void) => {
  const unsub = onSnapshot(
    collection(db, 'staff'),
    (snap) => {
      const list: Staff[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Staff));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (error) => {
      console.error('❌ subscribeToAllStaff error:', error);
      callback([]);
    }
  );
  return unsub;
};

// ============================================
// GET — Single staff by UID
// ============================================
export const getStaffByUid = async (uid: string): Promise<Staff | null> => {
  try {
    const q = query(collection(db, 'staff'), where('uid', '==', uid));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as Staff;
  } catch (error) {
    console.error('❌ getStaffByUid error:', error);
    return null;
  }
};

// ============================================
// STAFF LOGIN
// ============================================
export const staffLogin = async (
  email: string,
  password: string
): Promise<{ success: boolean; staff?: Staff; error?: string }> => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    // Find staff record
    const staff = await getStaffByUid(uid);
    if (!staff) {
      await signOut(auth);
      return { success: false, error: 'No staff account found for this email' };
    }

    if (!staff.active) {
      await signOut(auth);
      return { success: false, error: 'Your account is deactivated. Contact owner.' };
    }

    // Update last login
    await updateDoc(doc(db, 'staff', staff.id), {
      lastLoginAt: new Date().toISOString(),
    });

    console.log('✅ Staff login:', staff.email, staff.role);
    return { success: true, staff };
  } catch (error: any) {
    console.error('❌ staffLogin error:', error);
    let msg = 'Login failed';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      msg = 'Invalid email or password';
    } else if (error.code === 'auth/too-many-requests') {
      msg = 'Too many attempts. Try again later.';
    } else if (error.message) {
      msg = error.message;
    }
    return { success: false, error: msg };
  }
};

export const staffLogout = async (): Promise<void> => {
  try {
    await signOut(auth);
    console.log('✅ Staff logged out');
  } catch (error) {
    console.error('❌ staffLogout error:', error);
  }
};

// ============================================
// AUTH STATE LISTENER
// ============================================
export const subscribeToStaffAuth = (
  callback: (staff: Staff | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) {
      callback(null);
      return;
    }
    const staff = await getStaffByUid(user.uid);
    callback(staff);
  });
};

// ============================================
// PERMISSION CHECK
// ============================================
export const hasPermission = (
  staff: Staff | null,
  permission: StaffPermission
): boolean => {
  if (!staff) return false;
  if (!staff.active) return false;
  return staff.permissions.includes(permission);
};

// ============================================
// PASSWORD RESET
// ============================================
export const sendStaffPasswordReset = async (email: string): Promise<boolean> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('❌ sendStaffPasswordReset error:', error);
    return false;
  }
};

// ============================================
// AUDIT LOG
// ============================================
export const logAuditAction = async (
  staff: Staff,
  action: string,
  targetType: AuditLog['targetType'],
  targetId?: string,
  targetName?: string,
  details?: string
): Promise<void> => {
  try {
    const log: Omit<AuditLog, 'id'> = {
      staffId: staff.id,
      staffName: staff.name,
      staffEmail: staff.email,
      staffRole: staff.role,
      action,
      targetType,
      targetId,
      targetName,
      details,
      timestamp: new Date().toISOString(),
    };
    await addDoc(collection(db, 'auditLogs'), deepClean(log));
    console.log('📝 Audit logged:', action);
  } catch (error) {
    console.error('❌ logAuditAction error:', error);
  }
};

export const subscribeToAuditLogs = (
  callback: (logs: AuditLog[]) => void,
  limit: number = 100
): (() => void) => {
  const unsub = onSnapshot(
    collection(db, 'auditLogs'),
    (snap) => {
      const list: AuditLog[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as AuditLog));
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      callback(list.slice(0, limit));
    },
    (error) => {
      console.error('❌ subscribeToAuditLogs error:', error);
      callback([]);
    }
  );
  return unsub;
};
