import { ServiceDefinition, ServiceSettings } from '../types';

// ============================================
// 🆕 DEFAULT SERVICES CATALOG
// Ye initial data hai — Firestore mein seed karega
// ============================================

export const DEFAULT_SERVICES: ServiceDefinition[] = [
  {
    id: 'pan_card',
    name: 'PAN Card Apply',
    description: 'New PAN card application with documents',
    category: 'govt_id',
    price: 200,
    processingDays: 7,
    icon: 'CreditCard',
    enabled: true,
    googleFormUrl: '',
    serviceFieldId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'aadhaar_update',
    name: 'Aadhaar Update',
    description: 'Aadhaar card name/address/mobile update',
    category: 'govt_id',
    price: 150,
    processingDays: 15,
    icon: 'UserCheck',
    enabled: true,
    googleFormUrl: '',
    serviceFieldId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'voter_id',
    name: 'Voter ID Apply',
    description: 'New voter ID card application',
    category: 'govt_id',
    price: 100,
    processingDays: 30,
    icon: 'Vote',
    enabled: true,
    googleFormUrl: '',
    serviceFieldId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ration_card',
    name: 'Ration Card',
    description: 'New ration card or modification',
    category: 'govt_id',
    price: 150,
    processingDays: 20,
    icon: 'ShoppingBasket',
    enabled: true,
    googleFormUrl: '',
    serviceFieldId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ayushman_card',
    name: 'Ayushman Card',
    description: 'Ayushman Bharat health card',
    category: 'govt_id',
    price: 100,
    processingDays: 10,
    icon: 'Heart',
    enabled: true,
    googleFormUrl: '',
    serviceFieldId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================
// 🆕 DEFAULT SETTINGS (Fallback for services without own form)
// ============================================

export const DEFAULT_SERVICE_SETTINGS: ServiceSettings = {
  googleFormUrl: 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform',
  serviceFieldId: 'entry.0000000000',
  ownerUpiId: '9124231432@mairtel',
  ownerWhatsapp: '919124231432',
  updatedAt: new Date().toISOString(),
};

// Category labels for display
export const SERVICE_CATEGORIES: Record<string, string> = {
  govt_id: '🆔 Government ID',
  certificate: '📜 Certificate',
  utility: '🔧 Utility',
  other: '📦 Other',
};
