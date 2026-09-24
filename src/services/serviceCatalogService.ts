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
import { db } from './firebaseSync';
import {
  ServiceDefinition,
  ServiceOrder,
  ServiceSettings,
} from '../types';
import {
  DEFAULT_SERVICES,
  DEFAULT_SERVICE_SETTINGS,
} from '../data/servicesCatalog';

// ============================================
// 📦 SERVICES CRUD
// ============================================

const SERVICES_COLLECTION = 'services';
const ORDERS_COLLECTION = 'serviceOrders';
const SETTINGS_DOC = 'serviceSettings/main';

// ── Seed default services (only if collection empty) ──
export const seedDefaultServices = async (): Promise<void> => {
  try {
    const snap = await getDocs(collection(db, SERVICES_COLLECTION));
    if (snap.empty) {
      // Seed all defaults
      for (const service of DEFAULT_SERVICES) {
        await setDoc(doc(db, SERVICES_COLLECTION, service.id), service);
      }
    }
  } catch (err) {
    console.error('Error seeding services:', err);
  }
};

// ── Get all services (real-time) ──
export const subscribeToServices = (
  callback: (services: ServiceDefinition[]) => void
): (() => void) => {
  const q = query(collection(db, SERVICES_COLLECTION));
  return onSnapshot(
    q,
    (snap) => {
      const services: ServiceDefinition[] = [];
      snap.forEach((d) => {
        services.push({ ...(d.data() as ServiceDefinition), id: d.id });
      });
      services.sort((a, b) => a.name.localeCompare(b.name));
      callback(services);
    },
    (err) => {
      console.error('Error subscribing to services:', err);
      callback([]);
    }
  );
};

// ── Get all services (one-time) ──
export const getAllServices = async (): Promise<ServiceDefinition[]> => {
  try {
    const snap = await getDocs(collection(db, SERVICES_COLLECTION));
    const services: ServiceDefinition[] = [];
    snap.forEach((d) => {
      services.push({ ...(d.data() as ServiceDefinition), id: d.id });
    });
    return services.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
};

// ── Add/Update a service ──
export const upsertService = async (
  service: ServiceDefinition
): Promise<void> => {
  const now = new Date().toISOString();
  await setDoc(doc(db, SERVICES_COLLECTION, service.id), {
    ...service,
    updatedAt: now,
  });
};

// ── Toggle service enabled ──
export const toggleServiceEnabled = async (
  serviceId: string,
  enabled: boolean
): Promise<void> => {
  await updateDoc(doc(db, SERVICES_COLLECTION, serviceId), {
    enabled,
    updatedAt: new Date().toISOString(),
  });
};

// ── Delete service ──
export const deleteService = async (serviceId: string): Promise<void> => {
  await deleteDoc(doc(db, SERVICES_COLLECTION, serviceId));
};

// ============================================
// 📋 SERVICE ORDERS
// ============================================

// ── Create new order ──
export const createServiceOrder = async (
  order: Omit<ServiceOrder, 'id'>
): Promise<string> => {
  const id = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await setDoc(doc(db, ORDERS_COLLECTION, id), { ...order, id });
  return id;
};

// ── Subscribe to all orders (real-time, owner) ──
export const subscribeToOrders = (
  callback: (orders: ServiceOrder[]) => void
): (() => void) => {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const orders: ServiceOrder[] = [];
      snap.forEach((d) => {
        orders.push({ ...(d.data() as ServiceOrder), id: d.id });
      });
      callback(orders);
    },
    (err) => {
      console.error('Error subscribing to orders:', err);
      callback([]);
    }
  );
};

// ── Update order status ──
export const updateOrderStatus = async (
  orderId: string,
  orderStatus: ServiceOrder['orderStatus']
): Promise<void> => {
  await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
    orderStatus,
    updatedAt: new Date().toISOString(),
  });
};

// ── Update payment status ──
export const updatePaymentStatus = async (
  orderId: string,
  paymentStatus: ServiceOrder['paymentStatus']
): Promise<void> => {
  await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
    paymentStatus,
    updatedAt: new Date().toISOString(),
  });
};

// ── Update owner notes ──
export const updateOwnerNotes = async (
  orderId: string,
  ownerNotes: string
): Promise<void> => {
  await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
    ownerNotes,
    updatedAt: new Date().toISOString(),
  });
};

// ── Delete order ──
export const deleteOrder = async (orderId: string): Promise<void> => {
  await deleteDoc(doc(db, ORDERS_COLLECTION, orderId));
};

// ============================================
// ⚙️ SETTINGS
// ============================================

// ── Get settings ──
export const getServiceSettings = async (): Promise<ServiceSettings> => {
  try {
    const snap = await getDoc(doc(db, SETTINGS_DOC));
    if (snap.exists()) {
      return snap.data() as ServiceSettings;
    }
    // Seed defaults
    await setDoc(doc(db, SETTINGS_DOC), DEFAULT_SERVICE_SETTINGS);
    return DEFAULT_SERVICE_SETTINGS;
  } catch {
    return DEFAULT_SERVICE_SETTINGS;
  }
};

// ── Subscribe to settings (real-time) ──
export const subscribeToSettings = (
  callback: (settings: ServiceSettings) => void
): (() => void) => {
  return onSnapshot(
    doc(db, SETTINGS_DOC),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as ServiceSettings);
      } else {
        callback(DEFAULT_SERVICE_SETTINGS);
      }
    },
    () => callback(DEFAULT_SERVICE_SETTINGS)
  );
};

// ── Update settings ──
export const updateServiceSettings = async (
  settings: Partial<ServiceSettings>
): Promise<void> => {
  await setDoc(
    doc(db, SETTINGS_DOC),
    {
      ...settings,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
};
