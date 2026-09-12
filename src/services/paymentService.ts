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

// ============================================
// HELPER — Remove undefined/null/empty values
// Firestore does NOT accept undefined values
// ============================================
const cleanFirestoreData = (data: Record<string, any>): Record<string, any> => {
  const clean: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      clean[key] = value;
    }
  });
  return clean;
};

// ============================================
// CREATE PAYMENT REQUEST
// ============================================
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

    // ✅ Clean undefined values
    const cleanRequest = cleanFirestoreData(newRequest);

    await setDoc(doc(db, 'paymentRequests', id), cleanRequest);
    console.log('✅ Payment request created:', id);
    return newRequest;
  } catch (error) {
    console.error('❌ Error creating payment request:', error);
    return null;
  }
};

// ============================================
// APPROVE PAYMENT
// ============================================
export const approvePayment = async (
  paymentId: string,
  ownerEmail: string,
  validUntil: Date
): Promise<boolean> => {
  try {
    const updateData = cleanFirestoreData({
      status: 'approved',
      verifiedAt: new Date().toISOString(),
      verifiedBy: ownerEmail,
      validUntil: validUntil.toISOString(),
    });

    await updateDoc(doc(db, 'paymentRequests', paymentId), updateData);
    console.log('✅ Payment approved:', paymentId);
    return true;
  } catch (error) {
    console.error('❌ Error approving payment:', error);
    return false;
  }
};

// ============================================
// REJECT PAYMENT
// ============================================
export const rejectPayment = async (
  paymentId: string,
  reason: string
): Promise<boolean> => {
  try {
    const updateData = cleanFirestoreData({
      status: 'rejected',
      verifiedAt: new Date().toISOString(),
      rejectionReason: reason,
    });

    await updateDoc(doc(db, 'paymentRequests', paymentId), updateData);
    console.log('✅ Payment rejected:', paymentId);
    return true;
  } catch (error) {
    console.error('❌ Error rejecting payment:', error);
    return false;
  }
};

// ============================================
// GET ALL PAYMENT REQUESTS
// ============================================
export const getAllPaymentRequests = async (): Promise<PaymentRequest[]> => {
  try {
    const q = query(collection(db, 'paymentRequests'), orderBy('requestedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PaymentRequest);
  } catch (error) {
    console.error('❌ Error getting payment requests:', error);
    return [];
  }
};

// ============================================
// SUBSCRIBE ALL PAYMENTS
// ============================================
export const subscribeToAllPayments = (
  callback: (payments: PaymentRequest[]) => void
) => {
  const q = query(collection(db, 'paymentRequests'), orderBy('requestedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as PaymentRequest));
  });
};

// ============================================
// GET USER'S OWN PAYMENTS
// ============================================
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
    console.error('❌ Error getting user payments:', error);
    return [];
  }
};

// ============================================
// VALIDATE UTR
// ============================================
export const validateUTR = (utr: string): { valid: boolean; error?: string } => {
  const clean = utr.trim();
  
  if (clean.length < 8) {
    return { valid: false, error: 'UTR kam se kam 8 characters ka hona chahiye' };
  }
  if (clean.length > 30) {
    return { valid: false, error: 'UTR bahut lamba hai' };
  }
  if (!/^[A-Za-z0-9]+$/.test(clean)) {
    return { valid: false, error: 'UTR mein sirf letters aur numbers hone chahiye' };
  }
  return { valid: true };
};

// ============================================
// CALCULATE VALID UNTIL DATE
// ============================================
export const calculateValidUntil = (billingCycle: BillingCycle): Date => {
  const now = new Date();
  const days = billingCycle === 'monthly' ? 30 : 365;
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
};
