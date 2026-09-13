import { 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { SupportTicket, SupportResponse, FAQItem, SupportStats, SupportTicketStatus } from '../types';

// Deep clean
const deepClean = (value: any): any => {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value.map(item => deepClean(item)).filter(item => item !== undefined);
  }
  if (typeof value === 'object') {
    const cleanedObj: Record<string, any> = {};
    Object.entries(value).forEach(([key, val]) => {
      const cleanedVal = deepClean(val);
      if (cleanedVal !== undefined && cleanedVal !== '') {
        cleanedObj[key] = cleanedVal;
      }
    });
    return cleanedObj;
  }
  if (value === '') return undefined;
  return value;
};

// ============================================
// GENERATE TICKET NUMBER
// Format: TKT-YYYYMMDD-XXXX
// ============================================
export const generateTicketNumber = (existingCount: number): string => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const dateStr = istTime.toISOString().split('T')[0].replace(/-/g, '');
  const seq = (existingCount + 1).toString().padStart(4, '0');
  return `TKT-${dateStr}-${seq}`;
};

// ============================================
// CREATE SUPPORT TICKET
// ============================================
export const createSupportTicket = async (
  ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'responses' | 'status'>
): Promise<SupportTicket | null> => {
  try {
    const id = 'tkt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    const now = new Date().toISOString();

    const newTicket: SupportTicket = {
      ...ticketData,
      id,
      status: 'open',
      createdAt: now,
      responses: [],
    };

    const cleaned = deepClean(newTicket);
    await setDoc(doc(db, 'supportTickets', id), cleaned);

    console.log('✅ Support ticket created:', newTicket.ticketNumber);
    return newTicket;
  } catch (error: any) {
    console.error('❌ Error creating ticket:', error.code, error.message);
    return null;
  }
};

// ============================================
// ADD RESPONSE TO TICKET
// ============================================
export const addTicketResponse = async (
  ticketId: string,
  response: Omit<SupportResponse, 'id' | 'ticketId' | 'createdAt'>
): Promise<boolean> => {
  try {
    const ticketRef = doc(db, 'supportTickets', ticketId);
    const ticketSnap = await getDocs(query(collection(db, 'supportTickets'), where('id', '==', ticketId)));
    
    if (ticketSnap.empty) return false;
    
    const ticket = ticketSnap.docs[0].data() as SupportTicket;
    const newResponse: SupportResponse = {
      ...response,
      id: 'res_' + Date.now().toString(36),
      ticketId,
      createdAt: new Date().toISOString(),
    };

    const updatedResponses = [...(ticket.responses || []), newResponse];
    const cleaned = deepClean({
      responses: updatedResponses,
      updatedAt: new Date().toISOString(),
      status: response.responderRole === 'owner' ? 'in_progress' : ticket.status,
    });

    await updateDoc(ticketRef, cleaned);
    return true;
  } catch (error: any) {
    console.error('❌ Error adding response:', error);
    return false;
  }
};

// ============================================
// UPDATE TICKET STATUS
// ============================================
export const updateTicketStatus = async (
  ticketId: string,
  status: SupportTicketStatus,
): Promise<boolean> => {
  try {
    const updates = deepClean({
      status,
      updatedAt: new Date().toISOString(),
      ...(status === 'resolved' ? { resolvedAt: new Date().toISOString() } : {}),
    });
    await updateDoc(doc(db, 'supportTickets', ticketId), updates);
    return true;
  } catch (error) {
    console.error('❌ Error updating status:', error);
    return false;
  }
};

// ============================================
// DELETE TICKET
// ============================================
export const deleteTicket = async (ticketId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'supportTickets', ticketId));
    return true;
  } catch (error) {
    return false;
  }
};

// ============================================
// GET USER TICKETS
// ============================================
export const getUserTickets = async (userId: string): Promise<SupportTicket[]> => {
  try {
    const q = query(
      collection(db, 'supportTickets'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const tickets = snap.docs.map((d) => d.data() as SupportTicket);
    return tickets.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    return [];
  }
};

// ============================================
// SUBSCRIBE USER TICKETS
// ============================================
export const subscribeToUserTickets = (
  userId: string,
  callback: (tickets: SupportTicket[]) => void
) => {
  const q = query(
    collection(db, 'supportTickets'),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snap) => {
    const tickets = snap.docs.map((d) => d.data() as SupportTicket);
    const sorted = tickets.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    callback(sorted);
  });
};

// ============================================
// GET ALL TICKETS (Owner)
// ============================================
export const getAllTickets = async (): Promise<SupportTicket[]> => {
  try {
    const q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as SupportTicket);
  } catch (error) {
    console.error('❌ Error getting all tickets:', error);
    return [];
  }
};

// ============================================
// SUBSCRIBE ALL TICKETS (Owner)
// ============================================
export const subscribeToAllTickets = (
  callback: (tickets: SupportTicket[]) => void
) => {
  const q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as SupportTicket));
  });
};

// ============================================
// CALCULATE SUPPORT STATS
// ============================================
export const calculateSupportStats = (tickets: SupportTicket[]): SupportStats => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const today = new Date(now.getTime() + istOffset).toISOString().split('T')[0];

  return {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
    resolvedTickets: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    todayTickets: tickets.filter(t => t.createdAt.startsWith(today)).length,
  };
};

// ============================================
// DEFAULT FAQS
// ============================================
export const DEFAULT_FAQS: FAQItem[] = [
  {
    id: 'faq_1',
    question: 'How do I create a free account?',
    answer: 'Click on "Signup Free" button in the top-right corner. Enter your name, email, and password (min 6 characters). Your account will be created instantly with 700+ free tools access.',
    category: 'Account',
    order: 1,
    active: true,
  },
  {
    id: 'faq_2',
    question: 'What is the difference between Free, Premium, and VLE plans?',
    answer: 'Free Plan: 700+ tools unlimited + 299 premium tools (3 uses/day). Premium Plan (₹49/month): All 999 tools unlimited, no ads. VLE Plan (₹199/month): Everything in Premium + Khatabook customer ledger + Billing software + Shop branding + Priority support.',
    category: 'Billing',
    order: 2,
    active: true,
  },
  {
    id: 'faq_3',
    question: 'How do I upgrade to Premium or VLE plan?',
    answer: 'Click the "Upgrade" button in the header. Choose your plan (Premium or VLE). Pay via UPI using the QR code shown. Submit the UTR/Transaction ID. Owner will verify and activate your plan within 2-24 hours.',
    category: 'Billing',
    order: 3,
    active: true,
  },
  {
    id: 'faq_4',
    question: 'What is Khatabook and who can use it?',
    answer: 'Khatabook is a customer ledger system for VLE/Cyber Cafe operators. Track customer credit (udhar), payments, sales, and send WhatsApp reminders. Only VLE Plan users can access this feature.',
    category: 'Features',
    order: 4,
    active: true,
  },
  {
    id: 'faq_5',
    question: 'How do I create a bill/invoice?',
    answer: 'Go to VLE Portal → Billing tab → Click "New Bill". Add customer details, items (with quantity, rate, GST if needed), choose payment mode. Save the bill and print on Thermal 80mm or A4 paper. Bill auto-syncs to Khatabook.',
    category: 'Features',
    order: 5,
    active: true,
  },
  {
    id: 'faq_6',
    question: 'I forgot my password. How to reset it?',
    answer: 'Go to Login page → Click "Forgot Password". Enter your registered email. Firebase will send a password reset link to your email. Follow the link to set a new password.',
    category: 'Account',
    order: 6,
    active: true,
  },
  {
    id: 'faq_7',
    question: 'Are my files safe? Do you store them on server?',
    answer: 'Yes, 100% safe. All tools process your files directly in your browser (client-side processing). No files are uploaded to any server. Your photos, PDFs, and documents never leave your device.',
    category: 'Privacy',
    order: 7,
    active: true,
  },
  {
    id: 'faq_8',
    question: 'How do I become a VLE / Cyber Cafe operator?',
    answer: 'Click "VLE Registration" button. Fill the registration form with your center name, operator name, mobile, email, and shop address. Pay ₹199 registration fee via UPI. Submit UTR. Owner will verify and send you login credentials within 15-30 minutes.',
    category: 'VLE',
    order: 8,
    active: true,
  },
  {
    id: 'faq_9',
    question: 'How long does payment verification take?',
    answer: 'Owner manually verifies all payments within 2-24 hours. You will receive a notification once your plan is activated. For urgent activation, contact support via WhatsApp.',
    category: 'Billing',
    order: 9,
    active: true,
  },
  {
    id: 'faq_10',
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel anytime. No long-term commitment. Your plan will remain active until the end of the current billing cycle. After that, it will not auto-renew.',
    category: 'Billing',
    order: 10,
    active: true,
  },
];

// ============================================
// GET FAQS
// ============================================
export const getFAQs = async (): Promise<FAQItem[]> => {
  try {
    const q = query(collection(db, 'faqs'));
    const snap = await getDocs(q);
    if (snap.empty) return DEFAULT_FAQS;
    const faqs = snap.docs.map((d) => d.data() as FAQItem);
    return faqs.filter(f => f.active).sort((a, b) => a.order - b.order);
  } catch (error) {
    return DEFAULT_FAQS;
  }
};

// ============================================
// INITIALIZE FAQS IN FIREBASE
// ============================================
export const initializeFAQs = async (): Promise<boolean> => {
  try {
    for (const faq of DEFAULT_FAQS) {
      await setDoc(doc(db, 'faqs', faq.id), faq);
    }
    return true;
  } catch (error) {
    console.error('Error initializing FAQs:', error);
    return false;
  }
};
