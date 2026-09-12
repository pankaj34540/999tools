import { 
  doc, 
  setDoc, 
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { PaymentRequest, BillingCycle } from '../types';

export const createPaymentRequest = async (
  data: Omit<PaymentRequest, 'id' | 'status' | 'requestedAt'>
): Promise<PaymentRequest | null> => {
  try {
    const id = 'pay_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    const newRequest: PaymentRequest = {
      ...data,
      id,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'paymentRequests', id), newRequest);
    return newRequest;
  } catch (error) {
    return null;
  }
};

export const approvePayment = async (
  paymentId: string,
  ownerEmail: string,
  validUntil: Date
): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'paymentRequests', paymentId), {
      status: 'approved',
      verifiedAt: new Date().toISOString(),
      verifiedBy: ownerEmail,
      validUntil: validUntil.toISOString(),
    });
    return true;
  } catch (error) {
    return false;
  }
};

export const rejectPayment = async (
  paymentId: string,
  reason: string
): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'paymentRequests', paymentId), {
      status: 'rejected',
      verifiedAt: new Date().toISOString(),
      rejectionReason: reason,
    });
    return true;
  } catch (error) {
    return false;
  }
};

export const getAllPaymentRequests = async (): Promise<PaymentRequest[]> => {
  try {
    const q = query(collection(db, 'paymentRequests'), orderBy('requestedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PaymentRequest);
  } catch (error) {
    return [];
  }
};

export const subscribeToAllPayments = (
  callback: (payments: PaymentRequest[]) => void
) => {
  const q = query(collection(db, 'paymentRequests'), orderBy('requestedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as PaymentRequest));
  });
};

export const getUserPayments = async (userId: string): Promise<PaymentRequest[]> => {
  try {
    const q = query(
      collection(db, 'paymentRequests'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const payments = snap.docs.map((d) => d.data() as PaymentRequest);
    return payments.sort((a, b) => 
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
  } catch (error) {
    return [];
  }
};

export const validateUTR = (utr: string): { valid: boolean; error?: string } => {
  const clean = utr.trim();
  if (clean.length < 8) return { valid: false, error: 'UTR kam se kam 8 characters ka hona chahiye' };
  if (clean.length > 30) return { valid: false, error: 'UTR bahut lamba hai' };
  if (!/^[A-Za-z0-9]+$/.test(clean)) return { valid: false, error: 'UTR mein sirf letters aur numbers hone chahiye' };
  return { valid: true };
};

export const calculateValidUntil = (billingCycle: BillingCycle): Date => {
  const now = new Date();
  const days = billingCycle === 'monthly' ? 30 : 365;
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
};
