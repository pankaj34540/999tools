// ============================================
// COUPON SERVICE — Firestore CRUD
// VLE Trial Coupon System
// ============================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  increment,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Coupon, CouponValidation } from '../types';

const COUPONS_COLLECTION = 'coupons';

// ─────────────────────────────────────────
// 1. Subscribe to all coupons (real-time)
// ─────────────────────────────────────────
export const subscribeToCoupons = (
  callback: (coupons: Coupon[]) => void
): (() => void) => {
  const q = query(collection(db, COUPONS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list: Coupon[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as Coupon), id: d.id });
      });
      callback(list);
    },
    (err) => {
      console.error('Error subscribing to coupons:', err);
      callback([]);
    }
  );
};

// ─────────────────────────────────────────
// 2. Get all coupons (one-time)
// ─────────────────────────────────────────
export const getAllCoupons = async (): Promise<Coupon[]> => {
  try {
    const snap = await getDocs(collection(db, COUPONS_COLLECTION));
    const list: Coupon[] = [];
    snap.forEach((d) => {
      list.push({ ...(d.data() as Coupon), id: d.id });
    });
    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  } catch (err) {
    console.error('Error getting coupons:', err);
    return [];
  }
};

// ─────────────────────────────────────────
// 3. Get coupon by code (case-insensitive)
// ─────────────────────────────────────────
export const getCouponByCode = async (code: string): Promise<Coupon | null> => {
  try {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return null;

    const snap = await getDocs(collection(db, COUPONS_COLLECTION));
    let found: Coupon | null = null;
    snap.forEach((d) => {
      const data = d.data() as Coupon;
      if (data.code && data.code.toUpperCase() === cleanCode) {
        found = { ...data, id: d.id };
      }
    });
    return found;
  } catch (err) {
    console.error('Error getting coupon by code:', err);
    return null;
  }
};

// ─────────────────────────────────────────
// 4. Validate coupon (full check)
// ─────────────────────────────────────────
export const validateCoupon = async (
  code: string,
  userId?: string
): Promise<CouponValidation> => {
  try {
    if (!code || !code.trim()) {
      return { valid: false, error: 'Coupon code enter karo' };
    }

    const coupon = await getCouponByCode(code);

    if (!coupon) {
      return { valid: false, error: 'Invalid coupon code' };
    }

    if (!coupon.active) {
      return { valid: false, error: 'Ye coupon abhi active nahi hai' };
    }

    // Date check
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (coupon.validFrom && today < coupon.validFrom) {
      return { valid: false, error: `Coupon ${coupon.validFrom} se valid hai` };
    }

    if (coupon.validUntil && today > coupon.validUntil) {
      return { valid: false, error: 'Ye coupon expire ho chuka hai' };
    }

    // Usage limit check
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, error: 'Coupon ki limit khatam ho gayi' };
    }

    // Same user check
    if (userId && coupon.usedBy && coupon.usedBy.includes(userId)) {
      return { valid: false, error: 'Tumne ye coupon already use kar liya hai' };
    }

    return { valid: true, coupon };
  } catch (err) {
    console.error('Error validating coupon:', err);
    return { valid: false, error: 'Validation failed. Please try again.' };
  }
};

// ─────────────────────────────────────────
// 5. Create new coupon
// ─────────────────────────────────────────
export const createCoupon = async (
  data: Omit<Coupon, 'id' | 'usedCount' | 'usedBy' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const id = `coupon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const coupon: Coupon = {
    ...data,
    id,
    code: data.code.trim().toUpperCase(),
    usedCount: 0,
    usedBy: [],
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, COUPONS_COLLECTION, id), coupon);
  return id;
};

// ─────────────────────────────────────────
// 6. Update coupon
// ─────────────────────────────────────────
export const updateCoupon = async (
  id: string,
  data: Partial<Coupon>
): Promise<void> => {
  await updateDoc(doc(db, COUPONS_COLLECTION, id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

// ─────────────────────────────────────────
// 7. Toggle coupon active
// ─────────────────────────────────────────
export const toggleCouponActive = async (
  id: string,
  active: boolean
): Promise<void> => {
  await updateDoc(doc(db, COUPONS_COLLECTION, id), {
    active,
    updatedAt: new Date().toISOString(),
  });
};

// ─────────────────────────────────────────
// 8. Delete coupon
// ─────────────────────────────────────────
export const deleteCoupon = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COUPONS_COLLECTION, id));
};

// ─────────────────────────────────────────
// 9. Record coupon usage (after successful apply)
// ─────────────────────────────────────────
export const recordCouponUsage = async (
  couponId: string,
  userId: string
): Promise<void> => {
  await updateDoc(doc(db, COUPONS_COLLECTION, couponId), {
    usedCount: increment(1),
    usedBy: arrayUnion(userId),
    updatedAt: new Date().toISOString(),
  });
};

// ─────────────────────────────────────────
// 10. Generate random coupon code
// ─────────────────────────────────────────
export const generateRandomCode = (prefix = 'VLE'): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomPart = Array.from({ length: 8 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
  return `${prefix.toUpperCase()}${randomPart}`;
};
