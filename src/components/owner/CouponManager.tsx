import React, { useState, useEffect } from 'react';
import {
  Ticket, Plus, Trash2, Edit3, Copy, Check, X,
  Sparkles, Calendar, Users, TrendingUp, AlertCircle,
  ToggleLeft, ToggleRight, RefreshCw, Search,
} from 'lucide-react';
import {
  subscribeToCoupons,
  createCoupon,
  updateCoupon,
  toggleCouponActive,
  deleteCoupon,
  generateRandomCode,
} from '../../services/couponService';
import { Coupon } from '../../types';
import { useApp } from '../../context/AppContext';

const CouponManager: React.FC = () => {
  const { showNotification, currentUser } = useApp();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    trialDays: 7,
    maxUses: 100,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    active: true,
  });

  useEffect(() => {
    const unsub = subscribeToCoupons((list) => {
      setCoupons(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setFormData({
      code: '',
      trialDays: 7,
      maxUses: 100,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
      active: true,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      showNotification('❌ Coupon code required');
      return;
    }
    const cleanCode = formData.code.trim().toUpperCase();
    const exists = coupons.some((c) => c.code.toUpperCase() === cleanCode);
    if (exists) {
      showNotification('❌ Ye code already exist karta hai');
      return;
    }

    try {
      await createCoupon({
        code: cleanCode,
        trialDays: formData.trialDays,
        maxUses: formData.maxUses,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil,
        active: formData.active,
        notes: formData.notes.trim(),
        createdBy: currentUser?.email || 'owner',
      });
      showNotification('✅ Coupon create ho gaya');
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      showNotification('❌ Create failed');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;

    try {
      await updateCoupon(editingCoupon.id, {
        code: editingCoupon.code.toUpperCase(),
        trialDays: editingCoupon.trialDays,
        maxUses: editingCoupon.maxUses,
        validFrom: editingCoupon.validFrom,
        validUntil: editingCoupon.validUntil,
        notes: editingCoupon.notes,
      });
      showNotification('✅ Coupon update ho gaya');
      setEditingCoupon(null);
    } catch (err) {
      console.error(err);
      showNotification('❌ Update failed');
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await toggleCouponActive(id, active);
      showNotification(active ? '✅ Active' : '⏸️ Paused');
    } catch (err) {
      showNotification('❌ Toggle failed');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    try {
      await deleteCoupon(id);
      showNotification('✅ Delete ho gaya');
    } catch (err) {
      showNotification('❌ Delete failed');
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    showNotification('📋 Code copied');
  };

  const handleGenerateCode = () => {
    setFormData({ ...formData, code: generateRandomCode('VLE') });
  };

  const filtered = coupons.filter((c) =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUses = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
  const activeCoupons = coupons.filter((c) => c.active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full w-fit">
              <Ticket className="w-3.5 h-3.5" /> VLE Trial Coupon System
            </div>
            <h2 className="text-2xl font-black">Coupon Manager</h2>
            <p className="text-sm text-pink-100">
              Trial coupons banao, VLE registration ke liye free access do
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-white text-pink-700 font-bold rounded-xl shadow-lg hover:bg-pink-50 transition"
          >
            <Plus className="w-4 h-4" /> Create Coupon
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 pt-4 border-t border-white/20 grid grid-cols-3 gap-3 text-xs">
          <div>
            <div className="text-2xl font-black">{coupons.length}</div>
            <div className="text-pink-100">Total Coupons</div>
          </div>
          <div>
            <div className="text-2xl font-black">{activeCoupons}</div>
            <div className="text-pink-100">Active</div>
          </div>
          <div>
            <div className="text-2xl font-black">{totalUses}</div>
            <div className="text-pink-100">Total Uses</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 mt-2">Loading coupons...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 mb-1">No coupons yet</h3>
          <p className="text-xs text-slate-500 mb-4">
            Pehla coupon banao VLE trial ke liye
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl shadow-md hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" /> Create First Coupon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((coupon) => {
            const today = new Date().toISOString().split('T')[0];
            const isExpired = coupon.validUntil && today > coupon.validUntil;
            const isExhausted = coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses;
            const usagePercent = coupon.maxUses > 0
              ? Math.min(100, (coupon.usedCount / coupon.maxUses) * 100)
              : 0;

            return (
              <div
                key={coupon.id}
                className={`bg-white rounded-2xl border-2 p-5 shadow-sm transition ${
                  coupon.active && !isExpired && !isExhausted
                    ? 'border-purple-200 hover:border-purple-400'
                    : 'border-slate-200 opacity-75'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-lg text-slate-900">
                        {coupon.code}
                      </span>
                      <button
                        onClick={() => handleCopy(coupon.code)}
                        className="p-1 hover:bg-slate-100 rounded transition"
                        title="Copy code"
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                    {coupon.notes && (
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{coupon.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {isExpired && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full">
                        EXPIRED
                      </span>
                    )}
                    {isExhausted && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                        USED UP
                      </span>
                    )}
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Trial Days
                    </div>
                    <div className="font-black text-slate-900 mt-0.5">
                      {coupon.trialDays} days
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                      <Users className="w-3 h-3" /> Uses
                    </div>
                    <div className="font-black text-slate-900 mt-0.5">
                      {coupon.usedCount} / {coupon.maxUses || '∞'}
                    </div>
                  </div>
                </div>

                {/* Usage Bar */}
                {coupon.maxUses > 0 && (
                  <div className="mb-3">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          usagePercent >= 100
                            ? 'bg-rose-500'
                            : usagePercent >= 75
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Valid Dates */}
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-3">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {coupon.validFrom} → {coupon.validUntil}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleToggle(coupon.id, !coupon.active)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      coupon.active
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {coupon.active ? (
                      <>
                        <ToggleRight className="w-4 h-4" /> Active
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" /> Paused
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setEditingCoupon(coupon)}
                    className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition ml-auto"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id, coupon.code)}
                    className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* MODAL: Create Coupon */}
      {/* ═══════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl my-8 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Trial Coupon</h3>
                <p className="text-[11px] text-slate-500">VLE registration ke liye free trial</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Coupon Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. VLE2026TRIAL"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold rounded-lg text-xs"
                    title="Generate random"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trial Days *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={365}
                    value={formData.trialDays}
                    onChange={(e) =>
                      setFormData({ ...formData, trialDays: parseInt(e.target.value) || 7 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Uses *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.maxUses}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUses: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">0 = unlimited</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valid From *</label>
                  <input
                    type="date"
                    required
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valid Until *</label>
                  <input
                    type="date"
                    required
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Diwali offer for new VLEs"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-purple-900 leading-relaxed">
                  <strong>Trial logic:</strong> VLE user is code ko registration pe daalega → ₹0 payment → {formData.trialDays} din ka full VLE access milega. Expiry pe auto-downgrade ho jayega.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-md hover:from-purple-500 hover:to-pink-500"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* MODAL: Edit Coupon */}
      {/* ═══════════════════════════════════════ */}
      {editingCoupon && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl my-8 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Coupon</h3>
              <button
                onClick={() => setEditingCoupon(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Code</label>
                <input
                  type="text"
                  disabled
                  value={editingCoupon.code}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold bg-slate-50"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Code change nahi ho sakta</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trial Days</label>
                  <input
                    type="number"
                    min={1}
                    value={editingCoupon.trialDays}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        trialDays: parseInt(e.target.value) || 7,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Uses</label>
                  <input
                    type="number"
                    min={0}
                    value={editingCoupon.maxUses}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        maxUses: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valid From</label>
                  <input
                    type="date"
                    value={editingCoupon.validFrom}
                    onChange={(e) =>
                      setEditingCoupon({ ...editingCoupon, validFrom: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={editingCoupon.validUntil}
                    onChange={(e) =>
                      setEditingCoupon({ ...editingCoupon, validUntil: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes</label>
                <input
                  type="text"
                  value={editingCoupon.notes}
                  onChange={(e) =>
                    setEditingCoupon({ ...editingCoupon, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCoupon(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManager;
