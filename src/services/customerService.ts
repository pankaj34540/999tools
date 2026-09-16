// ============================================
// CUSTOMER SERVICE — Firebase CRUD for CRM
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
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Customer, CustomerStats, CustomerTag } from '../types';

// ============================================
// DEEP CLEAN — remove undefined values
// ============================================
const deepClean = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(deepClean);
  if (typeof obj === 'object') {
    const cleaned: any = {};
    Object.keys(obj).forEach((key) => {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = deepClean(val);
      }
    });
    return cleaned;
  }
  return obj;
};

// ============================================
// CREATE — Add new customer
// ============================================
export const createCustomer = async (
  data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalOrders' | 'totalSpent' | 'firstVisitDate'>
): Promise<Customer | null> => {
  try {
    const now = new Date().toISOString();
    const payload = deepClean({
      ...data,
      totalOrders: 0,
      totalSpent: 0,
      firstVisitDate: now.split('T')[0],
      createdAt: now,
      updatedAt: now,
    });

    const ref = await addDoc(collection(db, 'customers'), {
      ...payload,
      serverCreatedAt: serverTimestamp(),
    });

    const newCustomer: Customer = { ...payload, id: ref.id };
    console.log('✅ Customer created:', ref.id);
    return newCustomer;
  } catch (error) {
    console.error('❌ createCustomer error:', error);
    return null;
  }
};

// ============================================
// UPDATE — Update customer details
// ============================================
export const updateCustomer = async (
  id: string,
  updates: Partial<Customer>
): Promise<boolean> => {
  try {
    const cleanUpdates = deepClean({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    await updateDoc(doc(db, 'customers', id), cleanUpdates);
    console.log('✅ Customer updated:', id);
    return true;
  } catch (error) {
    console.error('❌ updateCustomer error:', error);
    return false;
  }
};

// ============================================
// DELETE — Remove customer
// ============================================
export const deleteCustomer = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'customers', id));
    console.log('✅ Customer deleted:', id);
    return true;
  } catch (error) {
    console.error('❌ deleteCustomer error:', error);
    return false;
  }
};

// ============================================
// READ — Get single customer
// ============================================
export const getCustomerById = async (id: string): Promise<Customer | null> => {
  try {
    const snap = await getDoc(doc(db, 'customers', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Customer;
  } catch (error) {
    console.error('❌ getCustomerById error:', error);
    return null;
  }
};

// ============================================
// READ ALL — Get all customers of a VLE
// ============================================
export const getCustomersByVle = async (vleId: string): Promise<Customer[]> => {
  try {
    const q = query(
      collection(db, 'customers'),
      where('vleId', '==', vleId)
    );
    const snap = await getDocs(q);
    const customers: Customer[] = [];
    snap.forEach((d) => customers.push({ id: d.id, ...d.data() } as Customer));
    // Sort client-side
    return customers.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('❌ getCustomersByVle error:', error);
    return [];
  }
};

// ============================================
// REALTIME SUBSCRIBE — Live updates
// ============================================
export const subscribeToVleCustomers = (
  vleId: string,
  callback: (customers: Customer[]) => void
): (() => void) => {
  const q = query(
    collection(db, 'customers'),
    where('vleId', '==', vleId)
  );

  const unsub = onSnapshot(
    q,
    (snap) => {
      const customers: Customer[] = [];
      snap.forEach((d) => customers.push({ id: d.id, ...d.data() } as Customer));
      customers.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      callback(customers);
    },
    (error) => {
      console.error('❌ subscribeToVleCustomers error:', error);
      callback([]);
    }
  );

  return unsub;
};

// ============================================
// SEARCH — Find customer by mobile
// ============================================
export const findCustomerByMobile = async (
  vleId: string,
  mobile: string
): Promise<Customer | null> => {
  try {
    const q = query(
      collection(db, 'customers'),
      where('vleId', '==', vleId),
      where('mobile', '==', mobile)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as Customer;
  } catch (error) {
    console.error('❌ findCustomerByMobile error:', error);
    return null;
  }
};

// ============================================
// INCREMENT STATS — When new order/transaction happens
// ============================================
export const incrementCustomerStats = async (
  id: string,
  amount: number
): Promise<boolean> => {
  try {
    const customer = await getCustomerById(id);
    if (!customer) return false;

    await updateDoc(doc(db, 'customers', id), {
      totalOrders: (customer.totalOrders || 0) + 1,
      totalSpent: (customer.totalSpent || 0) + amount,
      lastVisitDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('❌ incrementCustomerStats error:', error);
    return false;
  }
};

// ============================================
// STATS — Calculate dashboard stats
// ============================================
export const calculateCustomerStats = (
  vleId: string,
  customers: Customer[]
): CustomerStats => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const today = now.toISOString().split('T')[0];

  const newThisMonth = customers.filter(
    (c) => c.createdAt && c.createdAt.split('T')[0] >= monthStart
  ).length;

  const activeThisMonth = customers.filter(
    (c) => c.lastVisitDate && c.lastVisitDate >= monthStart
  ).length;

  const topCustomers = [...customers]
    .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
    .slice(0, 5);

  // Birthdays this week (next 7 days)
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const birthdaysThisWeek = customers.filter((c) => {
    if (!c.dob) return false;
    const dob = new Date(c.dob);
    const thisYear = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
    return thisYear >= now && thisYear <= nextWeek;
  });

  // Followups — customers tagged 'followup'
  const followups = customers.filter((c) => c.tags?.includes('followup'));

  return {
    vleId,
    totalCustomers: customers.length,
    newThisMonth,
    activeThisMonth,
    topCustomers,
    birthdaysThisWeek,
    followups,
  };
};

// ============================================
// BULK EXPORT — CSV format
// ============================================
export const customersToCsv = (customers: Customer[]): string => {
  const headers = [
    'Name', 'Mobile', 'Email', 'Address', 'DOB', 'Tags',
    'Total Orders', 'Total Spent', 'First Visit', 'Last Visit', 'Notes'
  ];
  const rows = customers.map((c) => [
    c.name, c.mobile, c.email || '', c.address || '', c.dob || '',
    (c.tags || []).join('; '),
    c.totalOrders || 0, c.totalSpent || 0,
    c.firstVisitDate || '', c.lastVisitDate || '', c.notes || ''
  ]);
  const csvContent = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  return csvContent;
};

// ============================================
// WHATSAPP LINK — Click-to-chat
// ============================================
export const getWhatsAppLink = (
  mobile: string,
  message: string
): string => {
  // Remove non-digits
  const cleaned = mobile.replace(/\D/g, '');
  // Add India country code if 10 digits
  const withCountry = cleaned.length === 10 ? `91${cleaned}` : cleaned;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${withCountry}?text=${encoded}`;
};
