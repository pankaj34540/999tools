import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Smartphone, Tv, Zap, CheckCircle2, XCircle, Clock, Loader2,
  Volume2, VolumeX, Search, Filter, ChevronDown, Copy,
  MessageCircle, Play, IndianRupee, Bell,
} from 'lucide-react';
import { RechargeOrder, RechargeStatus, Staff } from '../../types';
import { useAuditLog } from '../../hooks/useAuditLog';
import {
  subscribeToAllRechargeOrders,
  updateRechargeOrder,
  completeRechargeOrder,
  calculateRechargeStats,
  getRechargeWhatsAppLink,
  getRechargeStatusMessage,
} from '../../services/rechargeService';

// ============================================
// SOUND NOTIFICATION — Web Audio API
// ============================================
const playPaymentSound = () => {
  try {
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const notes = [
      { freq: 880, time: now, dur: 0.15 },
      { freq: 1320, time: now + 0.15, dur: 0.25 },
    ];
    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = n.freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0, n.time);
      gain.gain.linearRampToValueAtTime(0.3, n.time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, n.time + n.dur);
      osc.start(n.time);
      osc.stop(n.time + n.dur);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch (e) {
    console.log('Sound failed:', e);
  }
};

const STATUS_CONFIG: Record<RechargeStatus, { label: string; color: string; bg: string; icon: any }> = {
  pending_payment:   { label: 'Pending Payment', color: 'text-slate-600', bg: 'bg-slate-100', icon: Clock },
  payment_submitted: { label: 'Payment Submitted', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
  payment_verified:  { label: 'Payment Verified', color: 'text-blue-700', bg: 'bg-blue-100', icon: CheckCircle2 },
  processing:        { label: 'Processing', color: 'text-indigo-700', bg: 'bg-indigo-100', icon: Loader2 },
  completed:         { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
  rejected:          { label: 'Rejected', color: 'text-rose-700', bg: 'bg-rose-100', icon: XCircle },
  refunded:          { label: 'Refunded', color: 'text-purple-700', bg: 'bg-purple-100', icon: IndianRupee },
};

const FILTER_TABS: { id: 'all' | RechargeStatus; label: string }[] = [
  { id: 'all', label: 'All Orders' },
  { id: 'payment_submitted', label: 'New / Pending' },
  { id: 'payment_verified', label: 'Verified' },
  { id: 'processing', label: 'Processing' },
  { id: 'completed', label: 'Completed' },
  { id: 'rejected', label: 'Rejected' },
];

interface OwnerRechargeQueueProps {
  staff?: Staff | null;
}

export const OwnerRechargeQueue: React.FC<OwnerRechargeQueueProps> = ({ staff }) => {
  const { showNotification, siteConfig } = useApp();
  const { log } = useAuditLog(staff);

  const [orders, setOrders] = useState<RechargeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState<'all' | RechargeStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [actionOrder, setActionOrder] = useState<RechargeOrder | null>(null);
  const [actionType, setActionType] = useState<'complete' | 'reject' | null>(null);
  const [refNumber, setRefNumber] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState(false);

  const prevOrderCount = useRef(0);
  const initialLoad = useRef(true);

  useEffect(() => {
    const unsub = subscribeToAllRechargeOrders((list) => {
      if (!initialLoad.current && list.length > prevOrderCount.current && soundEnabled) {
        const newCount = list.length - prevOrderCount.current;
        playPaymentSound();
        showNotification(`🔔 ${newCount} new recharge order${newCount > 1 ? 's' : ''}!`);
      }
      prevOrderCount.current = list.length;
      initialLoad.current = false;
      setOrders(list);
      setLoading(false);
    });
    return () => unsub();
  }, [soundEnabled, showNotification]);

  const stats = useMemo(() => calculateRechargeStats(orders), [orders]);

  const filteredOrders = useMemo(() => {
    let list = [...orders];
    if (filter !== 'all') list = list.filter((o) => o.status === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((o) =>
        o.tokenNumber?.toLowerCase().includes(q) ||
        o.accountNumber?.includes(q) ||
        o.operator?.toLowerCase().includes(q) ||
        o.utr?.includes(q) ||
        o.vleCenterName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, filter, searchQuery]);

  // ============================================
  // HANDLERS with AUDIT LOG
  // ============================================
  const handleVerifyPayment = async (order: RechargeOrder) => {
    setBusy(true);
    try {
      const success = await updateRechargeOrder(order.id, { status: 'payment_verified' });
      showNotification(success ? '✅ Payment verified' : '❌ Failed');
      if (success) {
        await log(
          'recharge_verified',
          'recharge',
          order.id,
          `${order.operator} - ${order.accountNumber} (₹${order.amount})`,
          `Token: ${order.tokenNumber} — UTR: ${order.utr || 'N/A'}`
        );
      }
    } finally { setBusy(false); }
  };

  const handleStartProcessing = async (order: RechargeOrder) => {
    setBusy(true);
    try {
      const success = await updateRechargeOrder(order.id, { status: 'processing' });
      if (success) {
        showNotification('⚙️ Order processing');
        await log(
          'recharge_processing',
          'recharge',
          order.id,
          `${order.operator} - ${order.accountNumber} (₹${order.amount})`,
          `Token: ${order.tokenNumber}`
        );
      }
    } finally { setBusy(false); }
  };

  const handleComplete = async () => {
    if (!actionOrder || !refNumber.trim()) {
      showNotification('⚠️ Enter recharge reference number');
      return;
    }
    setBusy(true);
    try {
      const success = await completeRechargeOrder(actionOrder.id, refNumber.trim());
      if (success) {
        showNotification('✅ Order completed!');
        await log(
          'recharge_completed',
          'recharge',
          actionOrder.id,
          `${actionOrder.operator} - ${actionOrder.accountNumber} (₹${actionOrder.amount})`,
          `Token: ${actionOrder.tokenNumber} — Ref: ${refNumber.trim()}`
        );
        setActionOrder(null);
        setActionType(null);
        setRefNumber('');
      }
    } finally { setBusy(false); }
  };

  const handleReject = async () => {
    if (!actionOrder || !rejectReason.trim()) {
      showNotification('⚠️ Enter rejection reason');
      return;
    }
    setBusy(true);
    try {
      const success = await updateRechargeOrder(actionOrder.id, {
        status: 'rejected',
        rejectionReason: rejectReason.trim(),
      });
      if (success) {
        showNotification('❌ Order rejected');
        await log(
          'recharge_rejected',
          'recharge',
          actionOrder.id,
          `${actionOrder.operator} - ${actionOrder.accountNumber} (₹${actionOrder.amount})`,
          `Token: ${actionOrder.tokenNumber} — Reason: ${rejectReason.trim()}`
        );
        setActionOrder(null);
        setActionType(null);
        setRejectReason('');
      }
    } finally { setBusy(false); }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification('📋 Copied!');
  };

  const notifyCustomer = (order: RechargeOrder) => {
    const shopName = order.vleCenterName || siteConfig.siteName;
    const msg = getRechargeStatusMessage(order, shopName);
    const target = order.vleMobile || '';
    if (!target) {
      showNotification('⚠️ No mobile found');
      return;
    }
    window.open(getRechargeWhatsAppLink(target, msg), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            Recharge Orders Queue
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Mobile, DTH, aur utility bill recharge orders — verify & fulfill karein.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              showNotification(soundEnabled ? '🔇 Sound OFF' : '🔔 Sound ON');
              if (!soundEnabled) playPaymentSound();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              soundEnabled ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Sound ON' : 'Sound OFF'}</span>
          </button>
          <button
            onClick={() => { playPaymentSound(); showNotification('🔔 Test sound'); }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Test</span>
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl text-white shadow-md">
          <Clock className="w-5 h-5 opacity-80 mb-1" />
          <div className="text-2xl font-black">{stats.pending}</div>
          <div className="text-[10px] opacity-90 mt-0.5">Pending Orders</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-4 rounded-2xl text-white shadow-md">
          <Loader2 className="w-5 h-5 opacity-80 mb-1" />
          <div className="text-2xl font-black">{stats.processing}</div>
          <div className="text-[10px] opacity-90 mt-0.5">Processing</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl text-white shadow-md">
          <CheckCircle2 className="w-5 h-5 opacity-80 mb-1" />
          <div className="text-2xl font-black">{stats.completed}</div>
          <div className="text-[10px] opacity-90 mt-0.5">Completed</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-2xl text-white shadow-md">
          <IndianRupee className="w-5 h-5 opacity-80 mb-1" />
          <div className="text-2xl font-black">₹{stats.todayAmount}</div>
          <div className="text-[10px] opacity-90 mt-0.5">{stats.todayCount} orders today</div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by token, mobile, operator, UTR..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{FILTER_TABS.find((t) => t.id === filter)?.label}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showFilterDropdown && (
              <div className="absolute top-full mt-1 right-0 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[180px]">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setFilter(tab.id); setShowFilterDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 ${filter === tab.id ? 'text-blue-600' : 'text-slate-700'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="text-[10px] text-slate-500 font-semibold">
          Showing <span className="text-slate-800">{filteredOrders.length}</span> of {orders.length} orders
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-bold">Loading recharge orders...</p>
        </div>
      )}

      {/* EMPTY */}
      {!loading && filteredOrders.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Smartphone className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-black text-slate-800 mb-1">
            {orders.length === 0 ? 'No recharge orders yet' : 'No matching orders'}
          </h3>
          <p className="text-xs text-slate-500">
            {orders.length === 0
              ? 'Jab VLE ya user recharge order karenge, yahan dikhega.'
              : 'Try a different filter or search.'}
          </p>
        </div>
      )}

      {/* ORDERS LIST */}
      {!loading && filteredOrders.length > 0 && (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const cfg = STATUS_CONFIG[order.status];
            const StatusIcon = cfg.icon;
            const isNew = order.status === 'payment_submitted';
            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition ${
                  isNew ? 'border-amber-400 bg-amber-50/30' : 'border-slate-200'
                }`}
              >
                <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
                      <StatusIcon className={`w-3 h-3 ${order.status === 'processing' ? 'animate-spin' : ''}`} />
                      {cfg.label}
                    </div>
                    <span className="text-xs font-mono font-black text-blue-700">{order.tokenNumber}</span>
                    {isNew && (
                      <span className="text-[10px] font-black text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                        🔔 NEW
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">
                    {new Date(order.createdAt).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {order.type === 'mobile' ? <Smartphone className="w-4 h-4 text-blue-600" />
                        : order.type === 'dth' ? <Tv className="w-4 h-4 text-purple-600" />
                        : <Zap className="w-4 h-4 text-amber-600" />}
                      <span className="text-sm font-black text-slate-900 capitalize">
                        {order.type} Recharge
                      </span>
                    </div>
                    <div className="text-xs space-y-1 pl-6">
                      <div><span className="text-slate-500">Operator:</span> <span className="font-bold">{order.operator}</span></div>
                      <div>
                        <span className="text-slate-500">Number:</span>{' '}
                        <span className="font-mono font-bold">{order.accountNumber}</span>
                        <button onClick={() => copyText(order.accountNumber)} className="ml-1 text-blue-600 hover:text-blue-800">
                          <Copy className="w-3 h-3 inline" />
                        </button>
                      </div>
                      {order.accountName && (
                        <div><span className="text-slate-500">Name:</span> <span className="font-bold">{order.accountName}</span></div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">💰 Payment</div>
                    <div className="space-y-1 text-xs">
                      <div><span className="text-slate-500">Amount:</span> <span className="font-black text-emerald-600 text-sm">₹{order.amount}</span></div>
                      {order.utr && (
                        <div>
                          <span className="text-slate-500">UTR:</span>{' '}
                          <span className="font-mono font-bold">{order.utr}</span>
                          <button onClick={() => copyText(order.utr!)} className="ml-1 text-blue-600 hover:text-blue-800">
                            <Copy className="w-3 h-3 inline" />
                          </button>
                        </div>
                      )}
                      {order.commission > 0 && (
                        <div><span className="text-slate-500">Commission:</span> <span className="font-bold text-amber-600">₹{order.commission}</span></div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {order.placedBy === 'vle' ? '🏪 VLE Center' : '👤 User'}
                    </div>
                    <div className="space-y-1 text-xs">
                      {order.vleCenterName && <div className="font-bold">{order.vleCenterName}</div>}
                      {order.vleMobile && <div className="font-mono text-slate-600">{order.vleMobile}</div>}
                      {order.placedBy === 'user' && order.userId && (
                        <div className="text-slate-500">User ID: {order.userId.slice(0, 10)}...</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex flex-wrap gap-2">
                  {order.status === 'payment_submitted' && (
                    <>
                      <button
                        onClick={() => handleVerifyPayment(order)}
                        disabled={busy}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verify Payment
                      </button>
                      <button
                        onClick={() => { setActionOrder(order); setActionType('reject'); }}
                        className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  )}

                  {order.status === 'payment_verified' && (
                    <button
                      onClick={() => handleStartProcessing(order)}
                      disabled={busy}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Recharge
                    </button>
                  )}

                  {order.status === 'processing' && (
                    <>
                      <button
                        onClick={() => { setActionOrder(order); setActionType('complete'); }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete
                      </button>
                      <button
                        onClick={() => { setActionOrder(order); setActionType('reject'); }}
                        className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  )}

                  {order.status === 'completed' && order.rechargeRefNumber && (
                    <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                      <span className="text-emerald-700 font-bold">✅ Ref: </span>
                      <span className="font-mono text-emerald-900">{order.rechargeRefNumber}</span>
                    </div>
                  )}

                  {(order.status === 'completed' || order.status === 'rejected') && order.vleMobile && (
                    <button
                      onClick={() => notifyCustomer(order)}
                      className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold text-xs rounded-xl flex items-center gap-1.5 ml-auto"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Notify
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: COMPLETE */}
      {actionOrder && actionType === 'complete' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">✅ Complete Recharge</h3>
              <button
                onClick={() => { setActionOrder(null); setActionType(null); setRefNumber(''); }}
                className="text-slate-400 hover:text-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
              <div><span className="text-slate-500">Token:</span> <span className="font-mono font-bold">{actionOrder.tokenNumber}</span></div>
              <div><span className="text-slate-500">Number:</span> <span className="font-mono font-bold">{actionOrder.accountNumber}</span></div>
              <div><span className="text-slate-500">Amount:</span> <span className="font-bold text-emerald-600">₹{actionOrder.amount}</span></div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Recharge Reference Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                placeholder="Enter operator's ref/transaction ID"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setActionOrder(null); setActionType(null); setRefNumber(''); }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={busy || !refNumber.trim()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REJECT */}
      {actionOrder && actionType === 'reject' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">❌ Reject Order</h3>
              <button
                onClick={() => { setActionOrder(null); setActionType(null); setRejectReason(''); }}
                className="text-slate-400 hover:text-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs">
              <div><span className="text-slate-500">Token:</span> <span className="font-mono font-bold">{actionOrder.tokenNumber}</span></div>
              <div><span className="text-slate-500">Amount:</span> <span className="font-bold">₹{actionOrder.amount}</span></div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. UTR not found, Invalid payment"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setActionOrder(null); setActionType(null); setRejectReason(''); }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={busy || !rejectReason.trim()}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Reject Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
