import React, { useEffect, useState } from 'react';
import {
  FileText, Search, Loader2, RefreshCw, User, Phone, Mail,
  CreditCard, CheckCircle2, XCircle, Clock, Package,
  ExternalLink, ChevronDown, AlertCircle, TrendingUp,
  DollarSign, Filter, Eye, X, Save, Trash2, Copy, Check,
} from 'lucide-react';
import {
  subscribeToOrders,
  updateOrderStatus,
  updatePaymentStatus,
  updateOwnerNotes,
  deleteOrder,
} from '../../services/serviceCatalogService';
import { ServiceOrder } from '../../types';

type FilterStatus = 'all' | 'pending' | 'paid' | 'in_progress' | 'completed' | 'cancelled';

const ServiceOrdersManager: React.FC = () => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Real-time subscription
  useEffect(() => {
    const unsub = subscribeToOrders((list) => {
      setOrders(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // ── Stats ──
  const stats = {
    total: orders.length,
    paidCount: orders.filter((o) => o.paymentStatus === 'paid').length,
    pendingPayment: orders.filter((o) => o.paymentStatus === 'pending').length,
    inProgress: orders.filter((o) => o.orderStatus === 'in_progress').length,
    completed: orders.filter((o) => o.orderStatus === 'completed').length,
    totalRevenue: orders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + (o.price || 0), 0),
  };

  // ── Filter + Search ──
  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      o.customerName?.toLowerCase().includes(q) ||
      o.customerPhone?.includes(q) ||
      o.serviceName?.toLowerCase().includes(q) ||
      o.id?.toLowerCase().includes(q) ||
      o.paymentReference?.toLowerCase().includes(q);

    let matchesFilter = true;
    if (filterStatus === 'pending') matchesFilter = o.paymentStatus === 'pending';
    else if (filterStatus === 'paid') matchesFilter = o.paymentStatus === 'paid';
    else if (filterStatus === 'in_progress') matchesFilter = o.orderStatus === 'in_progress';
    else if (filterStatus === 'completed') matchesFilter = o.orderStatus === 'completed';
    else if (filterStatus === 'cancelled') matchesFilter = o.orderStatus === 'cancelled';

    return matchesSearch && matchesFilter;
  });

  // ── Handlers ──
  const handleStatusChange = async (orderId: string, newStatus: ServiceOrder['orderStatus']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showNotif(`✅ Status updated to ${newStatus}`);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
      }
    } catch (err) {
      showNotif('❌ Failed to update status');
    }
  };

  const handlePaymentStatusChange = async (orderId: string, newStatus: ServiceOrder['paymentStatus']) => {
    try {
      await updatePaymentStatus(orderId, newStatus);
      showNotif(`✅ Payment marked as ${newStatus}`);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: newStatus });
      }
    } catch (err) {
      showNotif('❌ Failed to update payment');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;
    setSavingNotes(true);
    try {
      await updateOwnerNotes(selectedOrder.id, editingNotes);
      setSelectedOrder({ ...selectedOrder, ownerNotes: editingNotes });
      showNotif('✅ Notes saved');
    } catch (err) {
      showNotif('❌ Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Delete this order? This cannot be undone.')) return;
    try {
      await deleteOrder(orderId);
      setSelectedOrder(null);
      showNotif('✅ Order deleted');
    } catch (err) {
      showNotif('❌ Failed to delete');
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const getPaymentBadge = (status: string) => {
    if (status === 'paid')
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (status === 'failed') return 'bg-rose-100 text-rose-800 border-rose-300';
    return 'bg-amber-100 text-amber-800 border-amber-300';
  };

  const getOrderBadge = (status: string) => {
    if (status === 'completed') return 'bg-emerald-100 text-emerald-800';
    if (status === 'in_progress') return 'bg-blue-100 text-blue-800';
    if (status === 'cancelled') return 'bg-rose-100 text-rose-800';
    return 'bg-amber-100 text-amber-800';
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            Service Orders Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cashfree payments + service orders — real-time sync
          </p>
        </div>
        <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Sync Active
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="bg-slate-900 text-white rounded-lg p-3 text-sm font-semibold text-center animate-in fade-in">
          {notification}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Orders" value={stats.total} icon={<FileText className="w-4 h-4" />} color="slate" />
        <StatCard label="Paid" value={stats.paidCount} icon={<CheckCircle2 className="w-4 h-4" />} color="emerald" />
        <StatCard label="Pending Pay" value={stats.pendingPayment} icon={<Clock className="w-4 h-4" />} color="amber" />
        <StatCard label="In Progress" value={stats.inProgress} icon={<RefreshCw className="w-4 h-4" />} color="blue" />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 className="w-4 h-4" />} color="indigo" />
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
            <span>Revenue</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1 text-lg font-black font-mono text-emerald-700">
            ₹{stats.totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {([
            { id: 'all', label: 'All', count: orders.length },
            { id: 'pending', label: 'Pending Pay', count: stats.pendingPayment },
            { id: 'paid', label: 'Paid', count: stats.paidCount },
            { id: 'in_progress', label: 'In Progress', count: stats.inProgress },
            { id: 'completed', label: 'Completed', count: stats.completed },
            { id: 'cancelled', label: 'Cancelled', count: orders.filter((o) => o.orderStatus === 'cancelled').length },
          ] as { id: FilterStatus; label: string; count: number }[]).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterStatus === f.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f.label}
              <span className={`ml-1.5 text-[10px] ${filterStatus === f.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, service, order ID, or payment ref..."
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
            <p className="text-sm text-slate-500 mt-2">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">No orders found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery || filterStatus !== 'all'
                ? 'Try changing search or filter'
                : 'Orders will appear here when customers place them'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Service</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Order Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3">
                      <div className="font-mono font-bold text-slate-900 text-[10px]">
                        {order.id.slice(0, 18)}...
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{order.customerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{order.customerPhone}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{order.serviceName}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-mono font-bold text-slate-900">₹{order.price}</div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold border ${getPaymentBadge(order.paymentStatus)}`}>
                        {order.paymentStatus === 'paid' && '✓ '}
                        {order.paymentStatus?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold ${getOrderBadge(order.orderStatus)}`}>
                        {order.orderStatus?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setEditingNotes(order.ownerNotes || '');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* ORDER DETAIL MODAL */}
      {/* ═══════════════════════════════════════════ */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base font-bold text-slate-900">Order Details</h3>
                <p className="text-[10px] text-slate-500 font-mono">{selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">

              {/* Amount Banner */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-5 text-white text-center">
                <p className="text-[10px] uppercase tracking-wider text-indigo-100">Order Amount</p>
                <p className="text-4xl font-black mt-1">₹{selectedOrder.price}</p>
                <p className="text-xs text-indigo-100 mt-1">{selectedOrder.serviceName}</p>
              </div>

              {/* Status Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    💳 Payment Status
                  </label>
                  <div className="flex gap-2">
                    {(['pending', 'paid', 'failed'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => handlePaymentStatusChange(selectedOrder.id, s)}
                        className={`flex-1 py-2 text-[11px] font-bold rounded-lg border-2 transition ${
                          selectedOrder.paymentStatus === s
                            ? s === 'paid'
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : s === 'failed'
                              ? 'bg-rose-500 text-white border-rose-500'
                              : 'bg-amber-500 text-white border-amber-500'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    📦 Order Status
                  </label>
                  <select
                    value={selectedOrder.orderStatus}
                    onChange={(e) =>
                      handleStatusChange(selectedOrder.id, e.target.value as any)
                    }
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-bold focus:border-indigo-500 outline-none"
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="in_progress">🔄 In Progress</option>
                    <option value="completed">✅ Completed</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Customer Details */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  👤 Customer Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <InfoRow icon={<User />} label="Name" value={selectedOrder.customerName} />
                  <InfoRow
                    icon={<Phone />}
                    label="Phone"
                    value={selectedOrder.customerPhone}
                    onCopy={() => copyToClipboard(selectedOrder.customerPhone, 'phone')}
                    copied={copiedId === 'phone'}
                  />
                  <InfoRow icon={<Mail />} label="Email" value={selectedOrder.customerEmail || '—'} />
                  <InfoRow
                    icon={<FileText />}
                    label="Order ID"
                    value={selectedOrder.id}
                    mono
                    onCopy={() => copyToClipboard(selectedOrder.id, 'oid')}
                    copied={copiedId === 'oid'}
                  />
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  💳 Payment Info
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <InfoRow
                    icon={<CreditCard />}
                    label="Method"
                    value={selectedOrder.paymentMethod?.toUpperCase() || '—'}
                  />
                  <InfoRow
                    icon={<CheckCircle2 />}
                    label="Payment Ref"
                    value={selectedOrder.paymentReference || '—'}
                    mono
                    onCopy={
                      selectedOrder.paymentReference
                        ? () => copyToClipboard(selectedOrder.paymentReference, 'ref')
                        : undefined
                    }
                    copied={copiedId === 'ref'}
                  />
                  <InfoRow
                    icon={<FileText />}
                    label="Created"
                    value={formatDate(selectedOrder.createdAt)}
                  />
                  <InfoRow
                    icon={<RefreshCw />}
                    label="Updated"
                    value={formatDate(selectedOrder.updatedAt)}
                  />
                </div>

                {/* Extra fields if present */}
                {((selectedOrder as any).cashfreePaymentId || (selectedOrder as any).cashfreeOrderId) && (
                  <div className="pt-2 border-t border-slate-200 text-[10px] space-y-1">
                    {(selectedOrder as any).cashfreeOrderId && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cashfree Order:</span>
                        <span className="font-mono text-slate-700">{(selectedOrder as any).cashfreeOrderId}</span>
                      </div>
                    )}
                    {(selectedOrder as any).cashfreePaymentId && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cashfree Payment ID:</span>
                        <span className="font-mono text-slate-700">{(selectedOrder as any).cashfreePaymentId}</span>
                      </div>
                    )}
                    {(selectedOrder as any).webhookReceivedAt && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Webhook Received:</span>
                        <span className="font-mono text-slate-700">
                          {formatDate((selectedOrder as any).webhookReceivedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Owner Notes */}
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 space-y-3">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  📝 Owner Notes (Internal)
                </h4>
                <textarea
                  rows={3}
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Add internal notes about this order..."
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg text-xs focus:border-amber-500 outline-none resize-none bg-white"
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes || editingNotes === selectedOrder.ownerNotes}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition"
                >
                  {savingNotes ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-3.5 h-3.5" /> Save Notes</>
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                <a
                  href={`https://wa.me/91${selectedOrder.customerPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hi ${selectedOrder.customerName}, regarding your order for ${selectedOrder.serviceName} (₹${selectedOrder.price})...`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  WhatsApp Customer
                </a>
                <button
                  onClick={() => handleDelete(selectedOrder.id)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Order
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'slate' | 'emerald' | 'amber' | 'blue' | 'indigo';
}> = ({ label, value, icon, color }) => {
  const colorMap = {
    slate: 'bg-slate-50 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3">
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
        <span>{label}</span>
        <span className={`p-1 rounded ${colorMap[color]}`}>{icon}</span>
      </div>
      <div className="mt-1 text-lg font-black text-slate-900">{value}</div>
    </div>
  );
};

const InfoRow: React.FC<{
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}> = ({ icon, label, value, mono, onCopy, copied }) => (
  <div className="flex items-start justify-between gap-2">
    <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
      {icon && <span className="w-3.5 h-3.5 opacity-60">{icon}</span>}
      <span className="font-semibold">{label}:</span>
    </div>
    <div className="flex items-center gap-1.5 min-w-0">
      <span className={`font-bold text-slate-800 truncate ${mono ? 'font-mono text-[10px]' : ''}`}>
        {value}
      </span>
      {onCopy && (
        <button
          onClick={onCopy}
          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition shrink-0"
          title="Copy"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
        </button>
      )}
    </div>
  </div>
);

export default ServiceOrdersManager;
