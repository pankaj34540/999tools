import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users, UserPlus, Search, X, Phone, MessageCircle, Edit2, Trash2,
  Download, Cake, AlertCircle, Star, TrendingUp, Check, Loader2,
  Filter, ChevronDown, Tag, MapPin, Mail, Calendar
} from 'lucide-react';
import {
  Customer,
  CustomerTag,
  CustomerFilterOptions,
} from '../../types';
import {
  customersToCsv,
  getWhatsAppLink,
} from '../../services/customerService';

// ============================================
// TAG CONFIG
// ============================================
const TAG_CONFIG: Record<CustomerTag, { label: string; color: string; bg: string }> = {
  regular:    { label: 'Regular',    color: 'text-blue-700',    bg: 'bg-blue-100' },
  vip:        { label: '⭐ VIP',      color: 'text-amber-800',   bg: 'bg-amber-100' },
  defaulter:  { label: '⚠ Defaulter', color: 'text-rose-700',    bg: 'bg-rose-100' },
  new:        { label: '✨ New',       color: 'text-emerald-700', bg: 'bg-emerald-100' },
  wholesale:  { label: '📦 Wholesale', color: 'text-purple-700',  bg: 'bg-purple-100' },
  followup:   { label: '📞 Follow-up', color: 'text-orange-700',  bg: 'bg-orange-100' },
};

const ALL_TAGS: CustomerTag[] = ['regular', 'vip', 'defaulter', 'new', 'wholesale', 'followup'];

// ============================================
// MAIN COMPONENT
// ============================================
interface CustomerCrmProps {
  vle: {
    id: string;
    vleId: string;
    centerName: string;
    operatorName: string;
    mobile: string;
  };
}

export const CustomerCrm: React.FC<CustomerCrmProps> = ({ vle }) => {
  const {
    customers,
    customersLoading,
    addCustomer,
    updateCustomerById,
    deleteCustomerById,
    showNotification,
  } = useApp();

  // ── Filters & UI state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<CustomerTag | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'spent' | 'orders'>('recent');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // ── Modal state ──
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);

  // ── Form fields ──
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formAltMobile, setFormAltMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formAnniversary, setFormAnniversary] = useState('');
  const [formTags, setFormTags] = useState<CustomerTag[]>(['new']);
  const [formNotes, setFormNotes] = useState('');
  const [formWhatsappOptIn, setFormWhatsappOptIn] = useState(true);

  // ============================================
  // STATS
  // ============================================
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString().split('T')[0];

    const newThisMonth = customers.filter(
      (c) => c.createdAt && c.createdAt.split('T')[0] >= monthStart
    ).length;

    const activeThisMonth = customers.filter(
      (c) => c.lastVisitDate && c.lastVisitDate >= monthStart
    ).length;

    return {
      total: customers.length,
      newThisMonth,
      activeThisMonth,
    };
  }, [customers]);

  // ============================================
  // BIRTHDAYS THIS WEEK
  // ============================================
  const birthdaysThisWeek = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return customers.filter((c) => {
      if (!c.dob) return false;
      const dob = new Date(c.dob);
      const thisYear = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      return thisYear >= now && thisYear <= nextWeek;
    });
  }, [customers]);

  // ============================================
  // FILTERED & SORTED CUSTOMERS
  // ============================================
  const filteredCustomers = useMemo(() => {
    let list = [...customers];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.mobile?.includes(q) ||
          c.email?.toLowerCase().includes(q)
      );
    }

    // Tag filter
    if (selectedTag !== 'all') {
      list = list.filter((c) => c.tags?.includes(selectedTag));
    }

    // Sort
    list.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'spent':
          return (b.totalSpent || 0) - (a.totalSpent || 0);
        case 'orders':
          return (b.totalOrders || 0) - (a.totalOrders || 0);
        case 'recent':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    return list;
  }, [customers, searchQuery, selectedTag, sortBy]);

  // ============================================
  // OPEN MODAL
  // ============================================
  const openAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormMobile('');
    setFormAltMobile('');
    setFormEmail('');
    setFormAddress('');
    setFormDob('');
    setFormAnniversary('');
    setFormTags(['new']);
    setFormNotes('');
    setFormWhatsappOptIn(true);
    setShowFormModal(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormName(customer.name || '');
    setFormMobile(customer.mobile || '');
    setFormAltMobile(customer.altMobile || '');
    setFormEmail(customer.email || '');
    setFormAddress(customer.address || '');
    setFormDob(customer.dob || '');
    setFormAnniversary(customer.anniversary || '');
    setFormTags(customer.tags || []);
    setFormNotes(customer.notes || '');
    setFormWhatsappOptIn(customer.whatsappOptIn !== false);
    setShowFormModal(true);
  };

  // ============================================
  // SAVE CUSTOMER
  // ============================================
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showNotification('❌ Name is required');
      return;
    }
    if (!formMobile.trim() || formMobile.replace(/\D/g, '').length < 10) {
      showNotification('❌ Valid 10-digit mobile required');
      return;
    }

    setFormBusy(true);
    try {
      if (editingCustomer) {
        // ── UPDATE ──
        const success = await updateCustomerById(editingCustomer.id, {
          name: formName.trim(),
          mobile: formMobile.trim(),
          altMobile: formAltMobile.trim() || undefined,
          email: formEmail.trim() || undefined,
          address: formAddress.trim() || undefined,
          dob: formDob || undefined,
          anniversary: formAnniversary || undefined,
          tags: formTags,
          notes: formNotes.trim() || undefined,
          whatsappOptIn: formWhatsappOptIn,
        });
        if (success) {
          showNotification('✅ Customer updated!');
          setShowFormModal(false);
        } else {
          showNotification('❌ Update failed');
        }
      } else {
        // ── CREATE ──
        const result = await addCustomer({
          vleId: vle.vleId,
          name: formName.trim(),
          mobile: formMobile.trim(),
          altMobile: formAltMobile.trim() || undefined,
          email: formEmail.trim() || undefined,
          address: formAddress.trim() || undefined,
          dob: formDob || undefined,
          anniversary: formAnniversary || undefined,
          tags: formTags,
          notes: formNotes.trim() || undefined,
          whatsappOptIn: formWhatsappOptIn,
        });
        if (result) {
          showNotification(`✅ Customer added: ${formName}`);
          setShowFormModal(false);
        } else {
          showNotification('❌ Failed to add customer');
        }
      }
    } finally {
      setFormBusy(false);
    }
  };

  // ============================================
  // DELETE
  // ============================================
  const handleDelete = async (id: string) => {
    setFormBusy(true);
    try {
      const success = await deleteCustomerById(id);
      if (success) {
        showNotification('🗑️ Customer deleted');
        setDeletingId(null);
      } else {
        showNotification('❌ Delete failed');
      }
    } finally {
      setFormBusy(false);
    }
  };

  // ============================================
  // WHATSAPP
  // ============================================
  const openWhatsApp = (customer: Customer, customMsg?: string) => {
    const msg = customMsg || `Namaste ${customer.name} ji 🙏\n\n${vle.centerName} se...`;
    const link = getWhatsAppLink(customer.mobile, msg);
    window.open(link, '_blank');
  };

  // ============================================
  // CSV EXPORT
  // ============================================
  const handleExportCsv = () => {
    const csv = customersToCsv(filteredCustomers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    showNotification(`✅ Exported ${filteredCustomers.length} customers`);
  };

  // ============================================
  // TAG TOGGLE
  // ============================================
  const toggleTag = (tag: CustomerTag) => {
    setFormTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Customer CRM
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your customers, orders, reminders — sab ek jagah.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCsv}
            disabled={customers.length === 0}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* ═══ STATS CARDS ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl text-white shadow-md">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 opacity-80" />
            <TrendingUp className="w-4 h-4 opacity-60" />
          </div>
          <div className="text-2xl font-black">{stats.total}</div>
          <div className="text-[10px] uppercase tracking-wider opacity-90 font-bold">Total Customers</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-2xl text-white shadow-md">
          <div className="flex items-center justify-between mb-2">
            <UserPlus className="w-5 h-5 opacity-80" />
          </div>
          <div className="text-2xl font-black">{stats.newThisMonth}</div>
          <div className="text-[10px] uppercase tracking-wider opacity-90 font-bold">New This Month</div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl text-white shadow-md">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-5 h-5 opacity-80" />
          </div>
          <div className="text-2xl font-black">{stats.activeThisMonth}</div>
          <div className="text-[10px] uppercase tracking-wider opacity-90 font-bold">Active This Month</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl text-white shadow-md">
          <div className="flex items-center justify-between mb-2">
            <Cake className="w-5 h-5 opacity-80" />
          </div>
          <div className="text-2xl font-black">{birthdaysThisWeek.length}</div>
          <div className="text-[10px] uppercase tracking-wider opacity-90 font-bold">Birthdays (7 days)</div>
        </div>
      </div>

      {/* ═══ BIRTHDAY ALERT ═══ */}
      {birthdaysThisWeek.length > 0 && (
        <div className="bg-gradient-to-r from-pink-50 to-amber-50 border-2 border-pink-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cake className="w-5 h-5 text-pink-600" />
            <h3 className="text-sm font-bold text-pink-900">
              🎂 {birthdaysThisWeek.length} Birthday(s) This Week
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {birthdaysThisWeek.map((c) => (
              <div
                key={c.id}
                className="bg-white px-3 py-2 rounded-xl border border-pink-200 flex items-center gap-2 shadow-sm"
              >
                <span className="text-xs font-bold text-slate-800">{c.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">{c.mobile}</span>
                <button
                  onClick={() =>
                    openWhatsApp(
                      c,
                      `🎂 Happy Birthday ${c.name} ji! 🎉\n\nAapko ${vle.centerName} ki taraf se bahut-bahut shubhkamnayein! 🎊`
                    )
                  }
                  className="p-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition"
                  title="Send WhatsApp Wish"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SEARCH & FILTERS ═══ */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, mobile, email..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tag Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{selectedTag === 'all' ? 'All Tags' : TAG_CONFIG[selectedTag].label}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showTagDropdown && (
              <div className="absolute top-full mt-1 right-0 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[150px]">
                <button
                  onClick={() => { setSelectedTag('all'); setShowTagDropdown(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 ${selectedTag === 'all' ? 'text-blue-600' : 'text-slate-700'}`}
                >
                  All Tags
                </button>
                {ALL_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => { setSelectedTag(tag); setShowTagDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 ${selectedTag === tag ? 'text-blue-600' : 'text-slate-700'}`}
                  >
                    {TAG_CONFIG[tag].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>
                {sortBy === 'name' ? 'Name (A-Z)'
                  : sortBy === 'recent' ? 'Recent First'
                  : sortBy === 'spent' ? 'Top Spent'
                  : 'Most Orders'}
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showSortDropdown && (
              <div className="absolute top-full mt-1 right-0 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[140px]">
                {[
                  { id: 'recent', label: 'Recent First' },
                  { id: 'name', label: 'Name (A-Z)' },
                  { id: 'spent', label: 'Top Spent' },
                  { id: 'orders', label: 'Most Orders' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => { setSortBy(opt.id as any); setShowSortDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 ${sortBy === opt.id ? 'text-blue-600' : 'text-slate-700'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-[10px] text-slate-500 font-semibold">
          Showing <span className="text-slate-800">{filteredCustomers.length}</span> of {customers.length} customers
        </div>
      </div>

      {/* ═══ LOADING ═══ */}
      {customersLoading && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-bold">Loading customers...</p>
        </div>
      )}

      {/* ═══ EMPTY STATE ═══ */}
      {!customersLoading && customers.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-black text-slate-800 mb-1">No customers yet</h3>
          <p className="text-xs text-slate-500 mb-5 max-w-md mx-auto">
            Add your first customer to start tracking orders, reminders, and WhatsApp messages.
          </p>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add First Customer
          </button>
        </div>
      )}

      {/* ═══ NO MATCHES ═══ */}
      {!customersLoading && customers.length > 0 && filteredCustomers.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No customers match your filter</h4>
          <p className="text-xs text-slate-500 mt-1">Try a different search or clear filters</p>
        </div>
      )}

      {/* ═══ CUSTOMER CARDS ═══ */}
      {!customersLoading && filteredCustomers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition group"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-slate-900 truncate">{customer.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-mono text-slate-600">{customer.mobile}</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-black flex items-center justify-center shrink-0">
                  {customer.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              </div>

              {/* Tags */}
              {customer.tags && customer.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {customer.tags.slice(0, 3).map((tag) => {
                    const cfg = TAG_CONFIG[tag];
                    if (!cfg) return null;
                    return (
                      <span
                        key={tag}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color} ${cfg.bg}`}
                      >
                        {cfg.label}
                      </span>
                    );
                  })}
                  {customer.tags.length > 3 && (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      +{customer.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Extra info */}
              <div className="space-y-1.5 mb-3">
                {customer.address && (
                  <div className="flex items-start gap-1.5 text-xs text-slate-600">
                    <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                    <span className="line-clamp-1">{customer.address}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100 mt-2">
                  <div className="text-center">
                    <div className="text-sm font-black text-slate-900">{customer.totalOrders || 0}</div>
                    <div className="text-[9px] uppercase text-slate-400 font-bold">Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-black text-emerald-600">₹{customer.totalSpent || 0}</div>
                    <div className="text-[9px] uppercase text-slate-400 font-bold">Spent</div>
                  </div>
                  {customer.lastVisitDate && (
                    <div className="text-center ml-auto">
                      <div className="text-xs font-bold text-slate-700">
                        {new Date(customer.lastVisitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="text-[9px] uppercase text-slate-400 font-bold">Last Visit</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openWhatsApp(customer)}
                  className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
                <a
                  href={`tel:${customer.mobile}`}
                  className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
                  title="Call"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Call</span>
                </a>
                <button
                  onClick={() => openEditModal(customer)}
                  className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeletingId(customer.id)}
                  className="py-2 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ ADD / EDIT MODAL ═══ */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full my-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {editingCustomer ? (
                  <Edit2 className="w-5 h-5 text-blue-600" />
                ) : (
                  <UserPlus className="w-5 h-5 text-blue-600" />
                )}
                <h3 className="text-base font-black text-slate-900">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h3>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCustomer} className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              {/* Name & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Mobile <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Alt Mobile & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Alt Mobile (optional)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formAltMobile}
                    onChange={(e) => setFormAltMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Email (optional)</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Address (optional)</label>
                <textarea
                  rows={2}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Village / Street / City"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* DOB & Anniversary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    🎂 Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    💍 Anniversary
                  </label>
                  <input
                    type="date"
                    value={formAnniversary}
                    onChange={(e) => setFormAnniversary(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_TAGS.map((tag) => {
                    const cfg = TAG_CONFIG[tag];
                    const isSelected = formTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold border-2 transition ${
                          isSelected
                            ? `${cfg.bg} ${cfg.color} border-current`
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Notes (optional)</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Any important notes about this customer..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* WhatsApp Opt-In */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formWhatsappOptIn}
                  onChange={(e) => setFormWhatsappOptIn(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                <span className="text-xs font-bold text-slate-700">
                  💬 Allow WhatsApp messages (birthday, offers, updates)
                </span>
              </label>
            </form>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomer as any}
                disabled={formBusy}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                {formBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {editingCustomer ? 'Save Changes' : 'Add Customer'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE CONFIRM ═══ */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-rose-600" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">Delete Customer?</h3>
            <p className="text-xs text-slate-500 mb-5">
              Ye customer permanently delete ho jayega. Undo nahi hoga.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={formBusy}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                {formBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
