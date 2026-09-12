import { 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  LedgerEntry, 
  LedgerEntryType, 
  CustomerLedgerSummary, 
  KhatabookStats,
  LedgerFilterOptions 
} from '../types';

const getTodayDate = (): string => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().split('T')[0];
};

const getCurrentMonth = (): string => getTodayDate().substring(0, 7);

export const createLedgerEntry = async (
  entryData: Omit<LedgerEntry, 'id' | 'createdAt' | 'timestamp' | 'date'>
): Promise<LedgerEntry | null> => {
  try {
    const id = 'led_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    const now = new Date();
    
    const newEntry: LedgerEntry = {
      ...entryData,
      id,
      date: getTodayDate(),
      timestamp: now.toISOString(),
      createdAt: now.toISOString(),
    };

    await setDoc(doc(db, 'ledgerEntries', id), newEntry);
    return newEntry;
  } catch (error) {
    return null;
  }
};

export const updateLedgerEntry = async (
  entryId: string,
  updates: Partial<LedgerEntry>
): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'ledgerEntries', entryId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    return false;
  }
};

export const deleteLedgerEntry = async (entryId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'ledgerEntries', entryId));
    return true;
  } catch (error) {
    return false;
  }
};

export const getVleLedgerEntries = async (vleId: string): Promise<LedgerEntry[]> => {
  try {
    const q = query(collection(db, 'ledgerEntries'), where('vleId', '==', vleId));
    const snap = await getDocs(q);
    const entries = snap.docs.map((d) => d.data() as LedgerEntry);
    return entries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    return [];
  }
};

export const subscribeToVleLedger = (
  vleId: string,
  callback: (entries: LedgerEntry[]) => void
) => {
  const q = query(collection(db, 'ledgerEntries'), where('vleId', '==', vleId));
  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map((d) => d.data() as LedgerEntry);
    const sorted = entries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    callback(sorted);
  });
};

export const getCustomerLedger = async (
  vleId: string,
  customerMobile: string
): Promise<LedgerEntry[]> => {
  try {
    const q = query(
      collection(db, 'ledgerEntries'),
      where('vleId', '==', vleId),
      where('customerMobile', '==', customerMobile)
    );
    const snap = await getDocs(q);
    const entries = snap.docs.map((d) => d.data() as LedgerEntry);
    return entries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    return [];
  }
};

export const calculateCustomerSummary = (
  entries: LedgerEntry[]
): CustomerLedgerSummary | null => {
  if (entries.length === 0) return null;

  let totalDebit = 0;
  let totalCredit = 0;

  entries.forEach((e) => {
    if (e.type === 'debit') totalDebit += e.amount;
    else if (e.type === 'credit' || e.type === 'payment_in') totalCredit += e.amount;
    else if (e.type === 'sale') { totalDebit += e.amount; totalCredit += e.amount; }
    else if (e.type === 'payment_out') totalDebit += e.amount;
  });

  const balance = totalDebit - totalCredit;
  const latest = entries[0];

  return {
    customerMobile: latest.customerMobile,
    customerName: latest.customerName,
    customerAddress: latest.customerAddress,
    totalDebit,
    totalCredit,
    balance: Math.abs(balance),
    balanceType: balance > 0 ? 'receivable' : balance < 0 ? 'payable' : 'settled',
    totalTransactions: entries.length,
    lastTransactionDate: latest.date,
    lastTransactionAmount: latest.amount,
    lastTransactionType: latest.type,
    firstTransactionDate: entries[entries.length - 1].date,
  };
};

export const getAllCustomerSummaries = (
  entries: LedgerEntry[]
): CustomerLedgerSummary[] => {
  const grouped: Record<string, LedgerEntry[]> = {};
  
  entries.forEach((e) => {
    const key = e.customerMobile;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  const summaries: CustomerLedgerSummary[] = [];
  Object.values(grouped).forEach((customerEntries) => {
    const summary = calculateCustomerSummary(customerEntries);
    if (summary) summaries.push(summary);
  });

  return summaries.sort((a, b) => {
    if (a.balanceType === 'receivable' && b.balanceType !== 'receivable') return -1;
    if (a.balanceType !== 'receivable' && b.balanceType === 'receivable') return 1;
    return b.balance - a.balance;
  });
};

export const calculateKhatabookStats = (
  vleId: string,
  entries: LedgerEntry[]
): KhatabookStats => {
  const summaries = getAllCustomerSummaries(entries);
  const today = getTodayDate();
  const month = getCurrentMonth();

  let totalReceivable = 0;
  let totalPayable = 0;

  summaries.forEach((s) => {
    if (s.balanceType === 'receivable') totalReceivable += s.balance;
    if (s.balanceType === 'payable') totalPayable += s.balance;
  });

  const todayEntries = entries.filter((e) => e.date === today);
  const monthEntries = entries.filter((e) => e.date.startsWith(month));

  return {
    vleId,
    totalCustomers: summaries.length,
    totalReceivable,
    totalPayable,
    netBalance: totalReceivable - totalPayable,
    todayTransactions: todayEntries.length,
    todaySales: todayEntries.filter((e) => e.type === 'sale' || e.type === 'debit').reduce((s, e) => s + e.amount, 0),
    todayReceived: todayEntries.filter((e) => e.type === 'credit' || e.type === 'payment_in').reduce((s, e) => s + e.amount, 0),
    monthTransactions: monthEntries.length,
    monthSales: monthEntries.filter((e) => e.type === 'sale' || e.type === 'debit').reduce((s, e) => s + e.amount, 0),
    monthReceived: monthEntries.filter((e) => e.type === 'credit' || e.type === 'payment_in').reduce((s, e) => s + e.amount, 0),
    topCustomers: summaries.filter((s) => s.balanceType === 'receivable').slice(0, 5),
  };
};

export const filterLedgerEntries = (
  entries: LedgerEntry[],
  filters: LedgerFilterOptions
): LedgerEntry[] => {
  return entries.filter((e) => {
    if (filters.customerMobile && e.customerMobile !== filters.customerMobile) return false;
    if (filters.type && e.type !== filters.type) return false;
    if (filters.dateFrom && e.date < filters.dateFrom) return false;
    if (filters.dateTo && e.date > filters.dateTo) return false;
    if (filters.minAmount && e.amount < filters.minAmount) return false;
    if (filters.maxAmount && e.amount > filters.maxAmount) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matches = 
        e.customerName.toLowerCase().includes(q) ||
        e.customerMobile.includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });
};

export const generateWhatsAppReminder = (
  summary: CustomerLedgerSummary,
  vleCenterName: string,
  vleMobile: string,
  siteName: string
): string => {
  const cleanPhone = summary.customerMobile.replace(/\D/g, '');
  const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone;
  
  const text = encodeURIComponent(
    `🙏 *Namaste ${summary.customerName} Ji*\n\n` +
    `Aapka *${vleCenterName}* mein pending balance hai:\n\n` +
    `💰 *Pending Amount:* ₹${summary.balance}\n` +
    `📅 *Last Transaction:* ${summary.lastTransactionDate}\n` +
    `📊 *Total Transactions:* ${summary.totalTransactions}\n\n` +
    `Kripya jaldi payment karein.\n\n` +
    `*Payment Options:*\n` +
    `📱 UPI: ${vleMobile}@upi\n` +
    `💵 Cash: ${vleCenterName} pe\n\n` +
    `Kisi bhi query ke liye contact karein: ${vleMobile}\n\n` +
    `Dhanyawad 🙏\n` +
    `*${siteName}*`
  );
  
  return `https://wa.me/${phoneWithCountry}?text=${text}`;
};

export const exportLedgerToCSV = (entries: LedgerEntry[]): string => {
  const headers = ['Date', 'Customer Name', 'Mobile', 'Type', 'Amount', 'Description', 'Category'];
  const rows = entries.map((e) => [
    e.date,
    `"${e.customerName}"`,
    e.customerMobile,
    e.type,
    e.amount,
    `"${e.description}"`,
    `"${e.category || ''}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
};

export const downloadCSV = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const getLedgerTypeLabel = (type: LedgerEntryType): string => {
  const labels: Record<LedgerEntryType, string> = {
    'credit': '💰 Payment Received',
    'debit': '📝 Udhar',
    'sale': '🛒 Cash Sale',
    'expense': '💸 Expense',
    'payment_in': '💵 Payment In',
    'payment_out': '📤 Payment Out',
    'adjustment': '⚖️ Adjustment',
  };
  return labels[type] || type;
};

export const getLedgerTypeColor = (type: LedgerEntryType): string => {
  const colors: Record<LedgerEntryType, string> = {
    'credit': 'text-emerald-600',
    'debit': 'text-rose-600',
    'sale': 'text-blue-600',
    'expense': 'text-orange-600',
    'payment_in': 'text-emerald-600',
    'payment_out': 'text-rose-600',
    'adjustment': 'text-slate-600',
  };
  return colors[type] || 'text-slate-600';
};
