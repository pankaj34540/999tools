// ============================================
// VLE ORDER SERVICE — Firestore CRUD
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
  where,
  orderBy,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { VleOrder } from '../types';

const ORDERS_COLLECTION = 'vleOrders';

// ─────────────────────────────────────────
// Subscribe to all orders (owner view)
// ─────────────────────────────────────────
export const subscribeToAllVleOrders = (
  callback: (orders: VleOrder[]) => void
): (() => void) => {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: VleOrder[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as VleOrder), id: d.id });
      });
      callback(list);
    },
    (err) => {
      console.error('Error subscribing to VLE orders:', err);
      callback([]);
    }
  );
};

// ─────────────────────────────────────────
// Subscribe to orders for a specific VLE
// ─────────────────────────────────────────
export const subscribeToVleOrders = (
  vleId: string,
  callback: (orders: VleOrder[]) => void
): (() => void) => {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('vleId', '==', vleId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: VleOrder[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as VleOrder), id: d.id });
      });
      callback(list);
    },
    (err) => {
      console.error('Error subscribing to VLE orders:', err);
      callback([]);
    }
  );
};

// ─────────────────────────────────────────
// Get order by ID
// ─────────────────────────────────────────
export const getVleOrderById = async (id: string): Promise<VleOrder | null> => {
  try {
    const snap = await getDoc(doc(db, ORDERS_COLLECTION, id));
    if (!snap.exists()) return null;
    return { ...(snap.data() as VleOrder), id: snap.id };
  } catch (err) {
    console.error('Error getting order:', err);
    return null;
  }
};

// ─────────────────────────────────────────
// Create order
// ─────────────────────────────────────────
export const createVleOrder = async (
  orderData: Omit<VleOrder, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> => {
  try {
    const id = `vleorder_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const order: VleOrder = {
      ...orderData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, ORDERS_COLLECTION, id), order);
    return id;
  } catch (err) {
    console.error('Error creating order:', err);
    return null;
  }
};

// ─────────────────────────────────────────
// Update order status
// ─────────────────────────────────────────
export const updateVleOrderStatus = async (
  id: string,
  status: VleOrder['status'],
  ownerNotes?: string
): Promise<boolean> => {
  try {
    const updates: any = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (ownerNotes !== undefined) updates.ownerNotes = ownerNotes;
    if (status === 'completed') updates.completedAt = new Date().toISOString();

    await updateDoc(doc(db, ORDERS_COLLECTION, id), updates);
    return true;
  } catch (err) {
    console.error('Error updating order:', err);
    return false;
  }
};

// ─────────────────────────────────────────
// Delete order
// ─────────────────────────────────────────
export const deleteVleOrder = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, ORDERS_COLLECTION, id));
    return true;
  } catch (err) {
    console.error('Error deleting order:', err);
    return false;
  }
};

// ─────────────────────────────────────────
// Get order stats (for owner dashboard)
// ─────────────────────────────────────────
export const getVleOrderStats = async (): Promise<{
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  totalRevenue: number;
}> => {
  try {
    const snap = await getDocs(collection(db, ORDERS_COLLECTION));
    let total = 0;
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let totalRevenue = 0;

    snap.forEach((d) => {
      const order = d.data() as VleOrder;
      total++;
      totalRevenue += order.paidFromWallet || 0;
      if (order.status === 'pending') pending++;
      else if (order.status === 'in_progress') inProgress++;
      else if (order.status === 'completed') completed++;
    });

    return { total, pending, inProgress, completed, totalRevenue };
  } catch (err) {
    console.error('Error getting stats:', err);
    return { total: 0, pending: 0, inProgress: 0, completed: 0, totalRevenue: 0 };
  }
};
