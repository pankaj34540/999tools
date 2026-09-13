import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Receipt,
  Plus,
  Search,
  Trash2,
  Edit3,
  X,
  Check,
  Printer,
  Download,
  MessageSquare,
  IndianRupee,
  TrendingUp,
  Clock,
  Crown,
  Lock,
  Loader2,
  Filter,
  Calendar,
  Percent,
  Hash,
  FileText,
  Copy,
  Eye,
  ShoppingCart,
  Calculator,
  AlertCircle
} from 'lucide-react';
import { Bill, BillItem, PaymentMode, BillStatus } from '../../types';

interface BillingManagerProps {
  vle: {
    id: string;
    vleId: string;
    centerName: string;
    operatorName: string;
    mobile: string;
    address?: string;
    state?: string;
    district?: string;
  };
}

const GST_RATES = [0, 5, 12, 18, 28];

export const BillingManager: React.FC<BillingManagerProps> = ({ vle }) => {
  const { 
    siteConfig,
    currentUser,
    isUserPremium,
    activeVle,
    showNotification
  } = useApp();

  // States
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid' | 'partial'>('all');

  // Create bill form state
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerMobile, setFormCustomerMobile] = useState('');
  const [formCustomerAddress, setFormCustomerAddress] = useState('');
  const [formGstEnabled, setFormGstEnabled] = useState(false);
  const [formItems, setFormItems] = useState<BillItem[]>([
    { id: '1', name: '', hsnCode: '', quantity: 1, rate: 0, gstRate: 0, discount: 0, amount: 0 }
  ]);
  const [formBillDiscount, setFormBillDiscount] = useState(0);
  const [formPaymentMode, setFormPaymentMode] = useState<PaymentMode>('cash');
  const [formStatus, setFormStatus] = useState<BillStatus>('paid');
  const [formNotes, setFormNotes] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // Access check
  const hasAccess = 
    currentUser?.plan === 'vle' ||
    (currentUser?.plan === 'premium' && isUserPremium()) ||
    !!activeVle;

  // Load bills
  useEffect(() => {
    if (!hasAccess) return;

    let unsubscribe: (() => void) | undefined;
    
    const loadBills = async () => {
      try {
        const { subscribeToVleBills } = await import('../../services/billingService');
        unsubscribe = subscribeToVleBills(vle.vleId, (fetchedBills) => {
          setBills(fetchedBills);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error loading bills:', error);
        setLoading(false);
      }
    };

    loadBills();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [vle.vleId, hasAccess]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const today = new Date(now.getTime() + istOffset).toISOString().split('T')[0];
    const month = today.substring(0, 7);

    const todayBills = bills.filter(b => b.date === today);
    const monthBills = bills.filter(b => b.date.startsWith(month));

    const sum = (arr: Bill[]) => arr.reduce((s, b) => s + b.grandTotal, 0);
    const sumPaid = (arr: Bill[]) => arr.filter(b => b.status === 'paid').reduce((s, b) => s + b.grandTotal, 0);
    const sumUnpaid = (arr: Bill[]) => arr.filter(b => b.status !== 'paid').reduce((s, b) => s + b.balanceAmount, 0);

    return {
      todayBills: todayBills.length,
      todayRevenue: sum(todayBills),
      todayPaid: sumPaid(todayBills),
      todayUnpaid: sumUnpaid(todayBills),
      monthBills: monthBills.length,
      monthRevenue: sum(monthBills),
      monthPaid: sumPaid(monthBills),
      monthUnpaid: sumUnpaid(monthBills),
      totalBills: bills.length,
      totalRevenue: sum(bills),
    };
  }, [bills]);

  // Filtered bills
  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      const matchStatus = filterStatus === 'all' || b.status === filterStatus;
      const q = searchQuery.toLowerCase();
      const matchSearch = !searchQuery ||
        b.billNumber.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        (b.customerMobile || '').includes(q);
      return matchStatus && matchSearch;
    });
  }, [bills, filterStatus, searchQuery]);

  // Real-time totals for form
  const formTotals = useMemo(() => {
    let subtotal = 0;
    let itemDiscount = 0;
    let totalGst = 0;

    formItems.forEach(item => {
      const itemTotal = item.quantity * item.rate;
      subtotal += itemTotal;
      const itemDisc = item.discount ? (itemTotal * item.discount) / 100 : 0;
      itemDiscount += itemDisc;
      
      if (formGstEnabled && item.gstRate > 0) {
        const taxable = itemTotal - itemDisc;
        totalGst += (taxable * item.gstRate) / 100;
      }
    });

    const afterItemDisc = subtotal - itemDiscount;
    const billDiscAmount = (afterItemDisc * formBillDiscount) / 100;
    const discountAmount = itemDiscount + billDiscAmount;
    const taxableValue = subtotal - discountAmount;
    const beforeRound = taxableValue + totalGst;
    const grandTotal = Math.round(beforeRound);
    const roundOff = grandTotal - beforeRound;

    return {
      subtotal,
      itemDiscount,
      billDiscAmount,
      discountAmount,
      totalGst,
      cgst: totalGst / 2,
      sgst: totalGst / 2,
      grandTotal,
      roundOff,
    };
  }, [formItems, formGstEnabled, formBillDiscount]);

  // ============================================
  // FORM HANDLERS
  // ============================================
  const resetForm = () => {
    setFormCustomerName('');
    setFormCustomerMobile('');
    setFormCustomerAddress('');
    setFormGstEnabled(false);
    setFormItems([{ id: Date.now().toString(), name: '', hsnCode: '', quantity: 1, rate: 0, gstRate: 0, discount: 0, amount: 0 }]);
    setFormBillDiscount(0);
    setFormPaymentMode('cash');
    setFormStatus('paid');
    setFormNotes('');
  };

  const addItem = () => {
    setFormItems(prev => [
      ...prev,
      { id: Date.now().toString() + Math.random(), name: '', hsnCode: '', quantity: 1, rate: 0, gstRate: 0, discount: 0, amount: 0 }
    ]);
  };

  const removeItem = (id: string) => {
    if (formItems.length === 1) {
      showNotification('At least one item is required');
      return;
    }
    setFormItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof BillItem, value: any) => {
    setFormItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        updated.amount = updated.quantity * updated.rate;
        return updated;
      }
      return item;
    }));
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formCustomerName.trim()) {
      showNotification('Please enter customer name');
      return;
    }

    const validItems = formItems.filter(i => i.name.trim() && i.quantity > 0 && i.rate > 0);
    if (validItems.length === 0) {
      showNotification('Please add at least one valid item');
      return;
    }

    setFormSaving(true);

    try {
      const { createBill, generateBillNumber, calculateBillTotals } = await import('../../services/billingService');
      
      const totals = calculateBillTotals(validItems, formGstEnabled, formBillDiscount);
      const billNumber = generateBillNumber(bills.length);
      const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];

      const paidAmount = formStatus === 'paid' ? totals.grandTotal : 0;
      const balanceAmount = totals.grandTotal - paidAmount;

      const newBill = await createBill({
        billNumber,
        vleId: vle.vleId,
        vleCenterName: vle.centerName,
        vleMobile: vle.mobile,
        vleAddress: vle.address,
        
        customerName: formCustomerName.trim(),
        customerMobile: formCustomerMobile.trim() || undefined,
        customerAddress: formCustomerAddress.trim() || undefined,
        
        items: validItems,
        
        subtotal: totals.subtotal,
        itemDiscount: totals.itemDiscount,
        billDiscount: formBillDiscount,
        discountAmount: totals.discountAmount,
        gstEnabled: formGstEnabled,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: 0,
        totalGst: totals.totalGst,
        roundOff: totals.roundOff,
        grandTotal: totals.grandTotal,
        
        paymentMode: formPaymentMode,
        status: formStatus,
        paidAmount,
        balanceAmount,
        
        notes: formNotes.trim() || undefined,
        date: today,
      });

      if (newBill) {
        showNotification(`✅ Bill ${newBill.billNumber} created!`);
        resetForm();
        setShowCreateModal(false);
      } else {
        showNotification('❌ Failed to create bill');
      }
    } catch (error: any) {
      console.error('Bill creation error:', error);
      showNotification('❌ Error: ' + (error.message || 'Try again'));
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Delete this bill? This action cannot be undone.')) return;
    
    try {
      const { deleteBill } = await import('../../services/billingService');
      const success = await deleteBill(billId);
      if (success) {
        showNotification('✅ Bill deleted');
      }
    } catch (error) {
      showNotification('❌ Failed to delete');
    }
  };

  const handlePrint = async (bill: Bill, format: 'thermal' | 'a4') => {
    const { generateBillHTML } = await import('../../services/billingService');
    const html = generateBillHTML(bill, format, siteConfig.siteName);
    
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
      setTimeout(() => {
        printWin.print();
      }, 300);
    }
  };

  const handleWhatsApp = async (bill: Bill) => {
    if (!bill.customerMobile) {
      showNotification('No mobile number on this bill');
      return;
    }
    const { generateBillWhatsApp } = await import('../../services/billingService');
    const url = generateBillWhatsApp(bill, siteConfig.siteName);
    window.open(url, '_blank');
  };

  const handleCopyBillText = async (bill: Bill) => {
    const text = `BILL ${bill.billNumber}\n${bill.vleCenterName}\nDate: ${bill.date}\nCustomer: ${bill.customerName}\nTotal: ₹${bill.grandTotal}`;
    navigator.clipboard.writeText(text);
    showNotification('Bill details copied!');
  };

  // ============================================
  // ACCESS LOCK
  // ============================================
  if (!hasAccess) {
    return (
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl">
        <div className="w-20 h-20 mx-auto bg-amber-400/20 border border-amber-400/40 rounded-2xl flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-amber-400" />
        </div>
        <h2 className="text-2xl font-black mb-3">Billing Software Locked</h2>
        <p className="text-sm text-blue-200 mb-6 max-w-md mx-auto leading-relaxed">
          Billing software is only available for <strong className="text-amber-300">VLE / Cyber Cafe Plan</strong> users.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition cursor-pointer">
          <Crown className="w-4 h-4" />
          <span>Upgrade to VLE Plan — ₹{siteConfig.vleMonthlyPrice}/month</span>
        </div>
      </div>
    );
  }

  // ============================================
  // LOADING
  // ============================================
  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading bills...</p>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[10px] font-bold uppercase tracking-wider mb-2">
              <Receipt className="w-3 h-3" />
              GST Billing Software
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              🧾 Billing & Invoices
            </h2>
            <p className="text-sm text-emerald-200 mt-1">
              Create GST bills, track revenue, print receipts
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-black rounded-xl shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Bill</span>
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Today's Bills
            </span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-700">
            {stats.todayBills}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Revenue: ₹{stats.todayRevenue.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Today's Paid
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Check className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 font-mono">
            ₹{stats.todayPaid.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Cash / UPI / Card
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              Today's Pending
            </span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700 font-mono">
            ₹{stats.todayUnpaid.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Sent to Khatabook
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              This Month
            </span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700 font-mono">
            ₹{stats.monthRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.monthBills} bills this month
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by bill no, customer name, mobile..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          {(['all', 'paid', 'unpaid', 'partial'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg capitalize transition ${
                filterStatus === s
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* BILLS LIST */}
      {filteredBills.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">
            {searchQuery ? 'No bills found' : 'No Bills Yet'}
          </h4>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {searchQuery 
              ? 'Try a different search keyword.' 
              : 'Create your first bill — items, GST, print, all in one.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Bill</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBills.map((bill) => (
            <div
              key={bill.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-emerald-400 hover:shadow-md transition"
            >
              <div className="flex flex-wrap items-center gap-4">
                {/* Bill Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  bill.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-700'
                    : bill.status === 'partial'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  <Receipt className="w-6 h-6" />
                </div>

                {/* Bill Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm font-mono">
                      {bill.billNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      bill.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-700'
                        : bill.status === 'partial'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {bill.status}
                    </span>
                    {bill.gstEnabled && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700">
                        GST
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                    <span className="font-semibold text-slate-700">
                      {bill.customerName}
                    </span>
                    {bill.customerMobile && (
                      <span>📱 {bill.customerMobile}</span>
                    )}
                    <span>📅 {bill.date}</span>
                    <span>📦 {bill.items.length} items</span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <div className="text-xl font-black font-mono text-slate-900">
                    ₹{bill.grandTotal.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">
                    {bill.paymentMode}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setSelectedBill(bill); setShowViewModal(true); }}
                    className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePrint(bill, 'thermal')}
                    className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600 transition"
                    title="Print Thermal"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleWhatsApp(bill)}
                    disabled={!bill.customerMobile}
                    className="p-2 rounded-lg hover:bg-green-100 text-green-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    title="WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBill(bill.id)}
                    className="p-2 rounded-lg hover:bg-rose-100 text-rose-600 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE BILL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 my-8 max-h-[95vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-emerald-50 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Create New Bill</h3>
                  <p className="text-xs text-slate-500">Add customer & items</p>
                </div>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="w-9 h-9 rounded-full bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateBill} className="p-5 overflow-y-auto flex-1 space-y-5">
              
              {/* Customer Details */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Customer Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formCustomerName}
                      onChange={(e) => setFormCustomerName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={formCustomerMobile}
                      onChange={(e) => setFormCustomerMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit (for WhatsApp bill)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Items ({formItems.length})
                  </h4>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formGstEnabled}
                      onChange={(e) => setFormGstEnabled(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600"
                    />
                    <span>Enable GST</span>
                  </label>
                </div>

                {formItems.map((item, idx) => (
                  <div key={item.id} className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-500 bg-slate-200 rounded-full w-6 h-6 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        placeholder="Item / Service name"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={formItems.length === 1}
                        className="p-2 rounded-lg hover:bg-rose-100 text-rose-500 transition disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Qty</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0.01"
                          step="0.01"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Rate ₹</label>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Disc %</label>
                        <input
                          type="number"
                          value={item.discount || 0}
                          onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      {formGstEnabled && (
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">GST %</label>
                          <select
                            value={item.gstRate}
                            onChange={(e) => updateItem(item.id, 'gstRate', parseInt(e.target.value))}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                          >
                            {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                          </select>
                        </div>
                      )}
                      <div className={formGstEnabled ? '' : 'col-span-2'}>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Amount</label>
                        <div className="px-2 py-1.5 bg-slate-200 rounded-lg text-sm font-black text-slate-700 text-right">
                          ₹{(item.quantity * item.rate).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addItem}
                  className="w-full py-2 border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl text-xs font-bold text-slate-600 hover:text-emerald-700 transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add More Item</span>
                </button>
              </div>

              {/* Bill Discount & Payment */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" />
                  Discount & Payment
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bill Discount (%)
                    </label>
                    <input
                      type="number"
                      value={formBillDiscount}
                      onChange={(e) => setFormBillDiscount(parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={formPaymentMode}
                      onChange={(e) => setFormPaymentMode(e.target.value as PaymentMode)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="cash">💵 Cash</option>
                      <option value="upi">📱 UPI</option>
                      <option value="card">💳 Card</option>
                      <option value="credit">📝 Credit (Udhar)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormStatus('paid')}
                      className={`p-2 rounded-xl border-2 text-xs font-bold transition ${
                        formStatus === 'paid'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      ✅ Fully Paid
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStatus('partial')}
                      className={`p-2 rounded-xl border-2 text-xs font-bold transition ${
                        formStatus === 'partial'
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      ⚠️ Partial
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStatus('unpaid')}
                      className={`p-2 rounded-xl border-2 text-xs font-bold transition ${
                        formStatus === 'unpaid'
                          ? 'border-rose-500 bg-rose-50 text-rose-700'
                          : 'border-slate-200 hover:border-rose-300'
                      }`}
                    >
                      ❌ Unpaid
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. Delivery on Monday"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Bill Summary */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border-2 border-emerald-200">
                <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-3">
                  Bill Summary
                </h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-700">
                    <span>Subtotal</span>
                    <span className="font-mono font-bold">₹{formTotals.subtotal.toFixed(2)}</span>
                  </div>
                  {formTotals.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Discount</span>
                      <span className="font-mono font-bold">-₹{formTotals.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {formGstEnabled && formTotals.totalGst > 0 && (
                    <>
                      <div className="flex justify-between text-slate-600 text-xs">
                        <span>CGST</span>
                        <span className="font-mono">₹{formTotals.cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-xs">
                        <span>SGST</span>
                        <span className="font-mono">₹{formTotals.sgst.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {Math.abs(formTotals.roundOff) > 0.01 && (
                    <div className="flex justify-between text-slate-500 text-xs">
                      <span>Round Off</span>
                      <span className="font-mono">{formTotals.roundOff > 0 ? '+' : ''}₹{formTotals.roundOff.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t-2 border-emerald-300 mt-2">
                    <span className="text-base font-black text-emerald-900">GRAND TOTAL</span>
                    <span className="text-xl font-black text-emerald-700 font-mono">
                      ₹{formTotals.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

            </form>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                disabled={formSaving}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBill}
                disabled={formSaving}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-black shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {formSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Create Bill</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW BILL MODAL */}
      {showViewModal && selectedBill && (
        <div className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 my-8 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedBill.billNumber}</h3>
                  <p className="text-[11px] text-slate-500">{selectedBill.date}</p>
                </div>
              </div>
              <button
                onClick={() => { setShowViewModal(false); setSelectedBill(null); }}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              
              {/* Customer Info */}
              <div className="bg-slate-50 rounded-xl p-3 text-xs">
                <div className="font-bold text-slate-800 text-sm mb-1">{selectedBill.customerName}</div>
                {selectedBill.customerMobile && (
                  <div className="text-slate-500">📱 {selectedBill.customerMobile}</div>
                )}
                {selectedBill.customerAddress && (
                  <div className="text-slate-500">📍 {selectedBill.customerAddress}</div>
                )}
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2 text-left font-bold text-slate-600">Item</th>
                      <th className="p-2 text-center font-bold text-slate-600">Qty</th>
                      <th className="p-2 text-right font-bold text-slate-600">Rate</th>
                      <th className="p-2 text-right font-bold text-slate-600">Amt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedBill.items.map((item, i) => (
                      <tr key={i}>
                        <td className="p-2 font-semibold text-slate-800">
                          {item.name}
                          {selectedBill.gstEnabled && item.gstRate > 0 && (
                            <span className="text-[10px] text-purple-600 ml-1">(GST {item.gstRate}%)</span>
                          )}
                        </td>
                        <td className="p-2 text-center font-mono">{item.quantity}</td>
                        <td className="p-2 text-right font-mono">₹{item.rate}</td>
                        <td className="p-2 text-right font-mono font-bold">₹{(item.quantity * item.rate).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="bg-emerald-50 rounded-xl p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">₹{selectedBill.subtotal.toFixed(2)}</span>
                </div>
                {selectedBill.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span className="font-mono font-bold">-₹{selectedBill.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {selectedBill.gstEnabled && selectedBill.totalGst > 0 && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST:</span>
                      <span className="font-mono">₹{selectedBill.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST:</span>
                      <span className="font-mono">₹{selectedBill.sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-2 border-t-2 border-emerald-300 mt-1">
                  <span className="font-black text-emerald-900">GRAND TOTAL:</span>
                  <span className="font-black text-emerald-700 font-mono text-base">
                    ₹{selectedBill.grandTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Payment: {selectedBill.paymentMode.toUpperCase()}</span>
                  <span>Status: {selectedBill.status.toUpperCase()}</span>
                </div>
              </div>

              {selectedBill.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-800">
                  <strong>Notes:</strong> {selectedBill.notes}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handlePrint(selectedBill, 'thermal')}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Thermal</span>
              </button>
              <button
                onClick={() => handlePrint(selectedBill, 'a4')}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 Print</span>
              </button>
              <button
                onClick={() => handleWhatsApp(selectedBill)}
                disabled={!selectedBill.customerMobile}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-green-50 border border-slate-200 hover:border-green-300 text-slate-700 hover:text-green-700 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => handleCopyBillText(selectedBill)}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Text</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
