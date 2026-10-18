import React, { useState, useEffect } from 'react';
import {
  Package, Loader2, CheckCircle2, Clock, XCircle,
  Search, Download, Eye, X, FileText, User, Phone,
  MapPin, Wallet, RefreshCw, AlertCircle,
} from 'lucide-react';
import { subscribeToAllVleOrders, updateVleOrderStatus } from '../../services/vleOrderService';
import { VleOrder } from '../../types';
import { useApp } from '../../context/AppContext';

const VleOrdersManager: React.FC = () => {
  const { showNotification } = useApp();
  const [orders, setOrders] = useState<VleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | VleOrder['status']>('all');
  const [viewingOrder, setViewingOrder] = useState<VleOrder | null>(null);

  useEffect(() => {
    const unsub = subscribeToAllVleOrders((list) => {
      setOrders(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = orders.filter(o => {
    const matchSearch = 
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerMobile.includes(searchQuery) ||
      o.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.vleCenterName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    inProgress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
    revenue: orders.reduce((sum, o) => sum + o.servicePrice, 0),
  };

  const handleStatusChange = async (orderId: string, status: VleOrder['status']) => {
    const success = await updateVleOrderStatus(orderId, status);
    if (success) {
      showNotification(`✅ Status updated to ${status}`);
      if (viewingOrder?.id === orderId) {
        setViewingOrder({ ...viewingOrder, status });
      }
    } else {
      showNotification('❌ Failed to update status');
    }
  };

  const getStatusColor = (status: VleOrder['status']) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-300';
      default: return 'bg-amber-100 text-amber-700 border-amber-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full w-fit mb-2">
          <Package className="w-3.5 h-3.5" /> VLE Special Orders
        </div>
        <h1 className="text-2xl font-black">VLE Orders Management</h1>
        <p className="text-sm text-purple-100 mt-1">Sabhi VLE orders ko manage karo</p>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-black">{stats.total}</div>
            <div className="text-[10px] text-purple-100">Total Orders</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-black">{stats.pending}</div>
            <div className="text-[10px] text-purple-100">Pending</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-black">{stats.inProgress}</div>
            <div className="text-[10px] text-purple-100">In Progress</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-black">{stats.completed}</div>
            <div className="text-[10px] text-purple-100">Completed</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-black">₹{stats.revenue}</div>
            <div className="text-[10px] text-purple-100">Revenue</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer, service, VLE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'in_progress', 'completed', 'cancelled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterStatus === s
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 mt-2">Loading orders...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-800 mb-1">No orders yet</h3>
          <p className="text-xs text-slate-500">Jab VLE order karega tab yahan dikhega</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">VLE</th>
                  <th className="p-3">Service</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="text-xs font-semibold text-slate-800">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{order.vleCenterName}</div>
                      <div className="text-[10px] text-slate-500">{order.vleMobile}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{order.serviceName}</div>
                      <div className="text-[10px] text-slate-500">₹{order.servicePrice}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{order.customerName}</div>
                      <div className="text-[10px] text-slate-500">{order.customerMobile}</div>
                    </td>
                    <td className="p-3 font-bold text-purple-700">₹{order.servicePrice}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold border ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setViewingOrder(order)}
                        className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-bold flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Order Details</h3>
                <p className="text-xs text-slate-500 font-mono">{viewingOrder.id}</p>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Service Info */}
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="text-[10px] text-purple-700 font-bold uppercase mb-1">Service</div>
                <div className="font-bold text-purple-900 text-lg">{viewingOrder.serviceName}</div>
                <div className="text-sm text-purple-700 mt-1">Amount: ₹{viewingOrder.servicePrice}</div>
              </div>

              {/* VLE Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">VLE Center</div>
                  <div className="font-bold text-slate-800 text-sm">{viewingOrder.vleCenterName}</div>
                  <div className="text-xs text-slate-600">{viewingOrder.vleMobile}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Customer</div>
                  <div className="font-bold text-slate-800 text-sm">{viewingOrder.customerName}</div>
                  <div className="text-xs text-slate-600">{viewingOrder.customerMobile}</div>
                </div>
              </div>

              {/* Customer Form Data */}
              {Object.keys(viewingOrder.customerData || {}).length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-[10px] text-blue-700 font-bold uppercase mb-2">Customer Details</div>
                  <div className="space-y-1.5">
                    {Object.entries(viewingOrder.customerData).map(([key, value]) => (
                      <div key={key} className="flex items-start text-xs">
                        <span className="font-semibold text-slate-700 w-1/3">{key}:</span>
                        <span className="text-slate-800 flex-1">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded Files */}
              {Object.keys(viewingOrder.documentUrls || {}).length > 0 && (
                <div className="bg-emerald-50 rounded-xl p-4">
                  <div className="text-[10px] text-emerald-700 font-bold uppercase mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Uploaded Documents ({Object.keys(viewingOrder.documentUrls).length})
                  </div>
                  <div className="space-y-2">
                    {Object.entries(viewingOrder.documentUrls).map(([fieldId, url]) => (
                      <a
                        key={fieldId}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-white rounded-lg border border-emerald-200 hover:border-emerald-400 transition"
                      >
                        <Download className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs text-emerald-800 font-semibold flex-1 truncate">
                          {fieldId.replace('field_', 'Document ')}
                        </span>
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div className="bg-amber-50 rounded-xl p-4">
                <div className="text-[10px] text-amber-700 font-bold uppercase mb-2">Update Status</div>
                <div className="grid grid-cols-2 gap-2">
                  {(['pending', 'in_progress', 'completed', 'cancelled'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(viewingOrder.id, s)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition ${
                        viewingOrder.status === s
                          ? getStatusColor(s)
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VleOrdersManager;
