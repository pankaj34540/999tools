
// ============================================
// PROMOTION SERVICE — Firestore CRUD
// Custom promotions shown in download popup
// ============================================
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Promotion } from '../types';

const PROMOTIONS_COLLECTION = 'promotions';

// ── Subscribe to all promotions (real-time) ──
export const subscribeToPromotions = (
  callback: (promotions: Promotion[]) => void
): (() => void) => {
  const q = query(collection(db, PROMOTIONS_COLLECTION), orderBy('priority', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list: Promotion[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as Promotion), id: d.id });
      });
      callback(list);
    },
    (err) => {
      console.error('Error subscribing to promotions:', err);
      callback([]);
    }
  );
};

// ── Get active promotions (one-time) ──
export const getActivePromotions = async (): Promise<Promotion[]> => {
  try {
    const snap = await getDocs(collection(db, PROMOTIONS_COLLECTION));
    const list: Promotion[] = [];
    snap.forEach((d) => {
      const promo = { ...(d.data() as Promotion), id: d.id };
      if (promo.active) list.push(promo);
    });
    return list.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  } catch (err) {
    console.error('Error getting promotions:', err);
    return [];
  }
};

// ── Get random promotion (for rotation) ──
export const getRandomPromotion = async (): Promise<Promotion | null> => {
  const active = await getActivePromotions();
  if (active.length === 0) return null;
  return active[Math.floor(Math.random() * active.length)];
};

// ── Add/Update promotion ──
export const upsertPromotion = async (promo: Promotion): Promise<void> => {
  const now = new Date().toISOString();
  await setDoc(doc(db, PROMOTIONS_COLLECTION, promo.id), {
    ...promo,
    updatedAt: now,
  });
};

// ── Toggle active ──
export const togglePromotionActive = async (
  id: string,
  active: boolean
): Promise<void> => {
  await updateDoc(doc(db, PROMOTIONS_COLLECTION, id), {
    active,
    updatedAt: new Date().toISOString(),
  });
};

// ── Delete promotion ──
export const deletePromotion = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, PROMOTIONS_COLLECTION, id));
};

// ── Create new promotion ──
export const createPromotion = async (
  data: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const id = `promo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const promo: Promotion = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, PROMOTIONS_COLLECTION, id), promo);
  return id;
};
