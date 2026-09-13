import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BookOpen, 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Wallet, 
  IndianRupee, 
  MessageSquare, 
  Download, 
  X, 
  Check, 
  AlertCircle,
  Copy,
  Trash2,
  Edit3,
  Send,
  Calendar,
  Phone,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Loader2,
  Clock,
  Crown,
  Lock
} from 'lucide-react';
import { LedgerEntryType, CustomerLedgerSummary, LedgerEntry } from '../../types';

interface KhatabookManagerProps {
  vle: {
    id: string;
    vleId: string;
    centerName: string;
    operatorName: string;
    mobile: string;
  };
}

export const KhatabookManager: React.FC<KhatabookManagerProps> = ({ vle }) => {
  const { 
    ledgerEntries, 
    ledgerLoading, 
    addLedgerEntry, 
    removeLedgerEntry,
    getKhatabookStats,
    getCustomerSummaries,
    siteConfig,
    currentUser,
    isUserPremium,
    activeVle,
    showNotification
  } = useApp();

  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerLedgerSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'receivable' | 'payable' | 'settled'>('all');
  const [copied, setCopied] = useState(false);

  // Entry form state
  const [formType, setFormType] = useState<LedgerEntryType>('debit');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerMobile, setFormCustomerMobile] = useState('');
  const [formCustomerAddress, setFormCustomerAddress] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // ============================================
  // UNIFIED ACCESS CHECK
  // 1. User plan === 'vle' → Access
  // 2. User plan === 'premium' with valid sub → Access
  // 3. VLE Portal mein logged in (activeVle) → Access
  // 4. Otherwise → Locked
  // ============================================
  const hasAccess = 
    currentUser?.plan === 'vle' ||
    (currentUser?.plan === 'premium' && isUserPremium()) ||
    !!activeVle;

  // STATS
  const stats = useMemo(() => {
    return getKhatabookStats();
  }, [ledgerEntries]);

  const customerSummaries = useMemo(() => {
    return getCustomerSummaries();
  }, [ledgerEntries]);

  // FILTERED CUSTOMERS
  const filteredCustomers = useMemo(() => {
    return customerSummaries.filter((c) => {
      const matchSearch = 
        !searchQuery ||
        c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customerMobile.includes(searchQuery);
      
      const matchFilter = 
        filterType === 'all' ||
        c.balanceType === filterType;
      
      return matchSearch && matchFilter;
    });
  }, [customerSummaries, searchQuery, filterType]);

  // RESET FORM
  const resetForm = () => {
    setFormType('debit');
    setFormCustomerName('');
    setFormCustomerMobile('');
    setFormCustomerAddress('');
    setFormAmount('');
    setFormDescription('');
    setFormCategory('');
  };

  // SUBMIT ENTRY
  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCustomerName.trim() || !formCustomerMobile.trim() || !formAmount || !formDescription.trim()) {
      showNotification('Saari fields bharni zaroori hain');
      return;
    }

    const amountNum = parseFloat(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showNotification('Sahi amount daalo');
      return;
    }

    if (formCustomerMobile.length !== 10) {
      showNotification('10-digit mobile number daalo');
      return;
    }

    setFormSaving(true);
    try {
      const result = await addLedgerEntry({
        vleId: vle.vleId,
        vleCenterName: vle.centerName,
        customerName: formCustomerName.trim(),
        customerMobile: formCustomerMobile.trim(),
        customerAddress: formCustomerAddress.trim() || undefined,
        type: formType,
        amount: amountNum,
        description: formDescription.trim(),
        category: formCategory.trim() || undefined,
      });

      if (result) {
        resetForm();
        setShowEntryModal(false);
      }
    } finally {
      setFormSaving(false);
    }
  };

  // DELETE ENTRY
  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Ye entry delete karni hai? Yeh action undo nahi hoga.')) return;
    await removeLedgerEntry(entryId);
  };

  // WHATSAPP REMINDER
  const sendWhatsAppReminder = (customer: CustomerLedgerSummary) => {
    const cleanPhone = customer.customerMobile.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone;

    const text = encodeURIComponent(
      `🙏 *Namaste ${customer.customerName} Ji*\n\n` +
      `Aapka *${vle.centerName}* mein pending balance hai:\n\n` +
      `💰 *Pending Amount:* ₹${customer.balance}\n` +
      `📅 *Last Transaction:* ${customer.lastTransactionDate}\n` +
      `📊 *Total Transactions:* ${customer.totalTransactions}\n\n` +
      `Kripya jaldi payment karein.\n\n` +
      `*Payment Options:*\n` +
      `📱 UPI: ${siteConfig.upiId}\n` +
      `💵 Cash: ${vle.centerName} pe\n\n` +
      `Kisi bhi query ke liye contact karein: ${vle.mobile}\n\n` +
      `Dhanyawad 🙏\n` +
      `*${siteConfig.siteName}*`
    );

    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank');
  };

  // EXPORT CSV
  const exportToCSV = () => {
    if (ledgerEntries.length === 0) {
      showNotification('Koi data nahi hai export ke liye');
      return;
    }

    const headers = ['Date', 'Customer Name', 'Mobile', 'Type', 'Amount', 'Description', 'Category'];
    const rows = ledgerEntries.map((e) => [
      e.date,
      `"${e.customerName}"`,
      e.customerMobile,
      e.type,
      e.amount,
      `"${e.description}"`,
      `"${e.category || ''}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `khatabook-${vle.vleId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('✅ CSV download ho gayi!');
  };

  // TYPE LABEL & COLOR
  const getTypeLabel = (type: LedgerEntryType) => {
    const labels: Record<LedgerEntryType, string> = {
      credit: '💰 Payment Received',
      debit: '📝 Udhar (Credit Sale)',
      sale: '🛒 Cash Sale',
      expense: '💸 Expense',
      payment_in: '💵 Payment In',
      payment_out: '📤 Payment Out',
      adjustment: '⚖️ Adjustment',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: LedgerEntryType) => {
    const colors: Record<LedgerEntryType, string> = {
      credit: 'text-emerald-600 bg-emerald-50',
      debit: 'text-rose-600 bg-rose-50',
      sale: 'text-blue-600 bg-blue-50',
      expense: 'text-orange-600 bg-orange-50',
      payment_in: 'text-emerald-600 bg-emerald-50',
      payment_out: 'text-rose-600 bg-rose-50',
      adjustment: 'text-slate-600 bg-slate-100',
    };
    return colors[type] || 'text-slate-600 bg-slate-100';
  };

  // GET CUSTOMER'S ENTRIES
  const getCustomerEntries = (mobile: string): LedgerEntry[] => {
    return ledgerEntries.filter((e) => e.customerMobile === mobile);
  };

  // ACCESS LOCK
  if (!hasAccess) {
    return (
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl">
        <div className="w-20 h-20 mx-auto bg-amber-400/20 border border-amber-400/40 rounded-2xl flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-amber-400" />
        </div>
        <h2 className="text-2xl font-black mb-3">Khatabook Locked</h2>
        <p className="text-sm text-blue-200 mb-6 max-w-md mx-auto leading-relaxed">
          Khatabook customer ledger sirf <strong className="text-amber-300">VLE / Cyber Cafe Plan</strong> ya <strong className="text-amber-300">Premium Plan</strong> users ke liye available hai.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition cursor-pointer">
          <Crown className="w-4 h-4" />
          <span>Upgrade to VLE Plan — ₹{siteConfig.vleMonthlyPrice}/month</span>
        </div>
      </div>
    );
  }

  // LOADING
  if (ledgerLoading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Khatabook load ho raha hai...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-2">
              <BookOpen className="w-3 h-3" />
              Customer Ledger System
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              📖 Khatabook
            </h2>
            <p className="text-sm text-blue-200 mt-1">
              {vle.centerName} ka complete customer hisaab
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white text-xs font-bold rounded-xl transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setShowEntryModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              Lena Hai (Receivable)
            </span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700 font-mono">
            ₹{stats.totalReceivable.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {customerSummaries.filter(c => c.balanceType === 'receivable').length} customers se
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Dena Hai (Payable)
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 font-mono">
            ₹{stats.totalPayable.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {customerSummaries.filter(c => c.balanceType === 'payable').length} customers ko
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Aaj Ka Sale
            </span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-700 font-mono">
            ₹{stats.todaySales.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.todayTransactions} transactions aaj
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Aaj Receive
            </span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700 font-mono">
            ₹{stats.todayReceived.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Is mahine: ₹{stats.monthReceived.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* FILTERS + SEARCH */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Customer ka naam ya mobile search karo..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          {(['all', 'receivable', 'payable', 'settled'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg capitalize transition ${
                filterType === t
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t === 'receivable' ? 'Lena' : t === 'payable' ? 'Dena' : t === 'settled' ? 'Settled' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* CUSTOMERS LIST */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">
            {searchQuery ? 'Koi customer nahi mila' : 'Abhi Koi Entry Nahi'}
          </h4>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {searchQuery 
              ? 'Try different search keyword.' 
              : 'Pehla customer entry add karo — udhar diya, payment aaya, sale — sab yahan rahega.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowEntryModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Entry</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.customerMobile}
              className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-blue-400 hover:shadow-md transition cursor-pointer"
              onClick={() => {
                setSelectedCustomer(customer);
                setShowCustomerModal(true);
              }}
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${
                  customer.balanceType === 'receivable'
                    ? 'bg-rose-100 text-rose-700'
                    : customer.balanceType === 'payable'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {customer.customerName.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm truncate">
                      {customer.customerName}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      customer.balanceType === 'receivable'
                        ? 'bg-rose-100 text-rose-700'
                        : customer.balanceType === 'payable'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {customer.balanceType === 'receivable' ? 'Lena Hai' : 
                       customer.balanceType === 'payable' ? 'Dena Hai' : 'Settled'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {customer.customerMobile}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {customer.lastTransactionDate}
                    </span>
                    <span className="text-slate-400">
                      {customer.totalTransactions} transactions
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-xl font-black font-mono ${
                    customer.balanceType === 'receivable'
                      ? 'text-rose-700'
                      : customer.balanceType === 'payable'
                      ? 'text-emerald-700'
                      : 'text-slate-700'
                  }`}>
                    ₹{customer.balance.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">
                    {customer.balanceType === 'receivable' ? 'Receivable' : 
                     customer.balanceType === 'payable' ? 'Payable' : 'Settled'}
                  </div>
                </div>

                {customer.balanceType === 'receivable' && customer.balance > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sendWhatsAppReminder(customer);
                    }}
                    className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition"
                    title="Send WhatsApp Reminder"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NEW ENTRY MODAL */}
      {showEntryModal && (
        <div className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 my-8 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">New Khatabook Entry</h3>
                  <p className="text-[11px] text-slate-500">Customer ka hisaab record karo</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEntryModal(false);
                  resetForm();
                }}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEntry} className="p-5 overflow-y-auto flex-1 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Transaction Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('debit')}
                    className={`p-3 rounded-xl border-2 text-left transition ${
                      formType === 'debit'
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-slate-200 hover:border-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowDownLeft className={`w-4 h-4 ${formType === 'debit' ? 'text-rose-600' : 'text-slate-400'}`} />
                      <span className={`text-xs font-black ${formType === 'debit' ? 'text-rose-700' : 'text-slate-600'}`}>
                        Udhar Diya
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">Customer baad mein pay karega</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('credit')}
                    className={`p-3 rounded-xl border-2 text-left transition ${
                      formType === 'credit'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowUpRight className={`w-4 h-4 ${formType === 'credit' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className={`text-xs font-black ${formType === 'credit' ? 'text-emerald-700' : 'text-slate-600'}`}>
                        Payment Aaya
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">Customer ne paisa diya</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('sale')}
                    className={`p-3 rounded-xl border-2 text-left transition ${
                      formType === 'sale'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className={`w-4 h-4 ${formType === 'sale' ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className={`text-xs font-black ${formType === 'sale' ? 'text-blue-700' : 'text-slate-600'}`}>
                        Cash Sale
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">Turant cash mila</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('expense')}
                    className={`p-3 rounded-xl border-2 text-left transition ${
                      formType === 'expense'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className={`w-4 h-4 ${formType === 'expense' ? 'text-orange-600' : 'text-slate-400'}`} />
                      <span className={`text-xs font-black ${formType === 'expense' ? 'text-orange-700' : 'text-slate-600'}`}>
                        Expense
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">Dukan ka kharcha</p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    required
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={formCustomerMobile}
                    onChange={(e) => setFormCustomerMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit"
                    required
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  value={formCustomerAddress}
                  onChange={(e) => setFormCustomerAddress(e.target.value)}
                  placeholder="Village / Area"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount (₹) *
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0"
                    required
                    min="1"
                    className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl text-lg font-black font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. PAN card ka form bhara"
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category (Optional)
                </label>
                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="e.g. PAN Card, Print, Xerox"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </form>

            <div className="p-5 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowEntryModal(false);
                  resetForm();
                }}
                disabled={formSaving}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEntry}
                disabled={formSaving}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {formSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Entry</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAIL MODAL */}
      {showCustomerModal && selectedCustomer && (
        <div className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 my-8 max-h-[90vh] flex flex-col">
            
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl ${
                    selectedCustomer.balanceType === 'receivable'
                      ? 'bg-rose-100 text-rose-700'
                      : selectedCustomer.balanceType === 'payable'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedCustomer.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{selectedCustomer.customerName}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {selectedCustomer.customerMobile}
                      </span>
                      {selectedCustomer.customerAddress && (
                        <span>{selectedCustomer.customerAddress}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className={`rounded-2xl p-4 ${
                selectedCustomer.balanceType === 'receivable'
                  ? 'bg-rose-50 border border-rose-200'
                  : selectedCustomer.balanceType === 'payable'
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-slate-50 border border-slate-200'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {selectedCustomer.balanceType === 'receivable' ? 'Lena Hai' : 
                       selectedCustomer.balanceType === 'payable' ? 'Dena Hai' : 'Settled'}
                    </div>
                    <div className={`text-3xl font-black font-mono ${
                      selectedCustomer.balanceType === 'receivable'
                        ? 'text-rose-700'
                        : selectedCustomer.balanceType === 'payable'
                        ? 'text-emerald-700'
                        : 'text-slate-700'
                    }`}>
                      ₹{selectedCustomer.balance.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {selectedCustomer.balanceType === 'receivable' && (
                      <button
                        onClick={() => sendWhatsAppReminder(selectedCustomer)}
                        className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp Reminder</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Total Udhar</div>
                    <div className="text-sm font-bold text-rose-700 font-mono">
                      ₹{selectedCustomer.totalDebit.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Total Paid</div>
                    <div className="text-sm font-bold text-emerald-700 font-mono">
                      ₹{selectedCustomer.totalCredit.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Transactions</div>
                    <div className="text-sm font-bold text-slate-700">
                      {selectedCustomer.totalTransactions}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Transaction History
              </h4>

              <div className="space-y-2">
                {getCustomerEntries(selectedCustomer.customerMobile).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getTypeColor(entry.type)}`}>
                      {entry.type === 'debit' || entry.type === 'expense' || entry.type === 'payment_out' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {entry.description}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span>{getTypeLabel(entry.type)}</span>
                        <span>•</span>
                        <span>{entry.date}</span>
                        {entry.category && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">{entry.category}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-sm font-black font-mono ${
                        entry.type === 'debit' || entry.type === 'expense' || entry.type === 'payment_out'
                          ? 'text-rose-700'
                          : 'text-emerald-700'
                      }`}>
                        {entry.type === 'debit' || entry.type === 'expense' || entry.type === 'payment_out' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
