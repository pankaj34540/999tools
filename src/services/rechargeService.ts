// ============================================
// RECHARGE SERVICE — Firebase CRUD
// ============================================
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
import { db } from '../config/firebase';
import { RechargeOrder, RechargeOrderStats, RechargeStatus } from '../types';

// ============================================
// DEEP CLEAN — remove undefined
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
// TOKEN GENERATOR
// ============================================
const generateToken = (): string => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RCH-${new Date().getFullYear()}-${random}`;
};

// ============================================
// CREATE — New recharge order
// ============================================
export const createRechargeOrder = async (
  data: Omit<RechargeOrder, 'id' | 'tokenNumber' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<RechargeOrder | null> => {
  try {
    const now = new Date().toISOString();
    const token = generateToken();

    const payload = deepClean({
      ...data,
      tokenNumber: token,
      status: 'pending_payment' as RechargeStatus,
      createdAt: now,
      updatedAt: now,
    });

    const ref = await addDoc(collection(db, 'rechargeOrders'), {
      ...payload,
      serverCreatedAt: serverTimestamp(),
    });

    const newOrder: RechargeOrder = { ...payload, id: ref.id };
    console.log('✅ Recharge order created:', ref.id, token);
    return newOrder;
  } catch (error) {
    console.error('❌ createRechargeOrder error:', error);
    return null;
  }
};

// ============================================
// UPDATE — Any field
// ============================================
export const updateRechargeOrder = async (
  id: string,
  updates: Partial<RechargeOrder>
): Promise<boolean> => {
  try {
    const cleanUpdates = deepClean({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(doc(db, 'rechargeOrders', id), cleanUpdates);
    console.log('✅ Recharge updated:', id);
    return true;
  } catch (error) {
    console.error('❌ updateRechargeOrder error:', error);
    return false;
  }
};

// ============================================
// DELETE
// ============================================
export const deleteRechargeOrder = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'rechargeOrders', id));
    return true;
  } catch (error) {
    console.error('❌ deleteRechargeOrder error:', error);
    return false;
  }
};

// ============================================
// READ — Single order
// ============================================
export const getRechargeOrderById = async (id: string): Promise<RechargeOrder | null> => {
  try {
    const snap = await getDoc(doc(db, 'rechargeOrders', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as RechargeOrder;
  } catch (error) {
    console.error('❌ getRechargeOrderById error:', error);
    return null;
  }
};

// ============================================
// SUBSCRIBE ALL — For Owner Panel
// ============================================
export const subscribeToAllRechargeOrders = (
  callback: (orders: RechargeOrder[]) => void
): (() => void) => {
  const q = query(collection(db, 'rechargeOrders'));

  const unsub = onSnapshot(
    q,
    (snap) => {
      const orders: RechargeOrder[] = [];
      snap.forEach((d) => orders.push({ id: d.id, ...d.data() } as RechargeOrder));
      orders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      callback(orders);
    },
    (error) => {
      console.error('❌ subscribeToAllRechargeOrders error:', error);
      callback([]);
    }
  );

  return unsub;
};

// ============================================
// SUBSCRIBE VLE — For VLE Portal
// ============================================
export const subscribeToVleRechargeOrders = (
  vleId: string,
  callback: (orders: RechargeOrder[]) => void
): (() => void) => {
  const q = query(
    collection(db, 'rechargeOrders'),
    where('vleId', '==', vleId)
  );

  const unsub = onSnapshot(
    q,
    (snap) => {
      const orders: RechargeOrder[] = [];
      snap.forEach((d) => orders.push({ id: d.id, ...d.data() } as RechargeOrder));
      orders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      callback(orders);
    },
    (error) => {
      console.error('❌ subscribeToVleRechargeOrders error:', error);
      callback([]);
    }
  );

  return unsub;
};

// ============================================
// SUBSCRIBE USER — For regular users
// ============================================
export const subscribeToUserRechargeOrders = (
  userId: string,
  callback: (orders: RechargeOrder[]) => void
): (() => void) => {
  const q = query(
    collection(db, 'rechargeOrders'),
    where('userId', '==', userId)
  );

  const unsub = onSnapshot(
    q,
    (snap) => {
      const orders: RechargeOrder[] = [];
      snap.forEach((d) => orders.push({ id: d.id, ...d.data() } as RechargeOrder));
      orders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      callback(orders);
    },
    (error) => {
      console.error('❌ subscribeToUserRechargeOrders error:', error);
      callback([]);
    }
  );

  return unsub;
};

// ============================================
// UPDATE STATUS — With reference number
// ============================================
export const completeRechargeOrder = async (
  id: string,
  rechargeRefNumber: string
): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'rechargeOrders', id), {
      status: 'completed' as RechargeStatus,
      rechargeRefNumber,
      rechargeDate: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('❌ completeRechargeOrder error:', error);
    return false;
  }
};

// ============================================
// STATS
// ============================================
export const calculateRechargeStats = (
  orders: RechargeOrder[]
): RechargeOrderStats => {
  const today = new Date().toISOString().split('T')[0];

  const total = orders.length;
  const pending = orders.filter(
    (o) => o.status === 'payment_submitted' || o.status === 'payment_verified'
  ).length;
  const processing = orders.filter((o) => o.status === 'processing').length;
  const completed = orders.filter((o) => o.status === 'completed').length;
  const rejected = orders.filter((o) => o.status === 'rejected').length;

  const totalRevenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  const totalCommission = orders
    .filter((o) => o.status === 'completed' && o.vleId)
    .reduce((sum, o) => sum + (o.commission || 0), 0);

  const todayOrders = orders.filter(
    (o) => o.createdAt && o.createdAt.split('T')[0] === today
  );

  return {
    total,
    pending,
    processing,
    completed,
    rejected,
    totalRevenue,
    totalCommission,
    todayCount: todayOrders.length,
    todayAmount: todayOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
  };
};

// ============================================
// OPERATOR PRESETS
// ============================================
export const MOBILE_OPERATORS = [
  { id: 'airtel', name: 'Airtel', popular: true },
  { id: 'jio', name: 'Jio', popular: true },
  { id: 'vi', name: 'Vi (Vodafone Idea)', popular: true },
  { id: 'bsnl', name: 'BSNL' },
  { id: 'mtnl', name: 'MTNL' },
];

export const DTH_OPERATORS = [
  { id: 'tata_play', name: 'Tata Play', popular: true },
  { id: 'airtel_dtv', name: 'Airtel Digital TV', popular: true },
  { id: 'dish_tv', name: 'Dish TV', popular: true },
  { id: 'sun_direct', name: 'Sun Direct' },
  { id: 'd2h', name: 'd2h' },
  { id: 'dd_free', name: 'DD Free Dish' },
];

export const UTILITY_TYPES = [
  { id: 'electricity', name: '⚡ Electricity Bill', popular: true },
  { id: 'water', name: '💧 Water Bill' },
  { id: 'gas', name: '🔥 Gas Bill' },
  { id: 'broadband', name: '🌐 Broadband' },
  { id: 'landline', name: '📞 Landline' },
];

// ============================================
// WHATSAPP STATUS MESSAGE TEMPLATES
// ============================================
export const getRechargeStatusMessage = (
  order: RechargeOrder,
  shopName: string
): string => {
  const messages: Record<RechargeStatus, string> = {
    pending_payment: `🔄 ${shopName}\n\nAapka recharge order ${order.tokenNumber} create ho gaya.\n\nAmount: ₹${order.amount}\n${order.operator} - ${order.accountNumber}\n\nKripya payment karein aur UTR submit karein.`,
    payment_submitted: `⏳ ${shopName}\n\nPayment received, verification in progress.\nToken: ${order.tokenNumber}\nAmount: ₹${order.amount}\n\nKuch hi der mein recharge ho jayega.`,
    payment_verified: `✅ ${shopName}\n\nPayment verified!\nToken: ${order.tokenNumber}\n\nRecharge processing mein hai.`,
    processing: `⚙️ ${shopName}\n\nRecharge process ho raha hai...\nToken: ${order.tokenNumber}`,
    completed: `🎉 ${shopName}\n\nRecharge SUCCESS! ✅\nToken: ${order.tokenNumber}\n${order.operator} - ${order.accountNumber}\nAmount: ₹${order.amount}\nRef: ${order.rechargeRefNumber || 'N/A'}\n\nDhanyawad! 🙏`,
    rejected: `❌ ${shopName}\n\nRecharge order ${order.tokenNumber} reject ho gaya.\nReason: ${order.rejectionReason || 'Payment issue'}\n\nPlease contact us for refund.`,
    refunded: `💸 ${shopName}\n\nAapka ₹${order.amount} refund issue ho gaya.\nToken: ${order.tokenNumber}\n\nDhanyawad!`,
  };
  return messages[order.status] || `Update: ${order.status}`;
};

// ============================================
// WHATSAPP LINK
// ============================================
export const getRechargeWhatsAppLink = (
  mobile: string,
  message: string
): string => {
  const cleaned = mobile.replace(/\D/g, '');
  const withCountry = cleaned.length === 10 ? `91${cleaned}` : cleaned;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
};
