import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Crown, 
  Settings, 
  Users, 
  Layers, 
  DollarSign, 
  FileText, 
  ShieldAlert, 
  Plus, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Wallet, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Store,
  ToggleLeft,
  ToggleRight,
  Megaphone,
  LogOut,
  Lock,
  UserCheck,
  Link2,
  Wrench,
  ShieldCheck,
  CreditCard,
  LifeBuoy,
  Smartphone,
  BarChart3,
  UserCog,
  Package,
} from 'lucide-react';
import { ServiceItem, ServiceCategory, CustomerOrder, VleOperator } from '../../types';
import { AdsterraManager } from './AdsterraManager';
import { OwnerSecurityGate } from './OwnerSecurityGate';
import { VleApprovalsManager } from './VleApprovalsManager';
import { ImportantLinksManager } from './ImportantLinksManager';
import { ToolsManager } from './ToolsManager';
import { PaymentApprovalsManager } from './PaymentApprovalsManager';
import { OwnerSupportManager } from './OwnerSupportManager';
import { OwnerRechargeQueue } from './OwnerRechargeQueue';
import { OwnerAnalytics } from './OwnerAnalytics';
import { StaffManager } from './StaffManager';
import ServiceSettingsManager from './ServiceSettingsManager';
import ServiceOrdersManager from './ServiceOrdersManager';

export const OwnerPortal: React.FC = () => {
  const { 
    siteConfig, 
    updateSiteConfig, 
    services, 
    toggleService, 
    updateService, 
    addService, 
    deleteService, 
    vles, 
    updateVleWallet, 
    toggleVleStatus, 
    addVle, 
    orders, 
    updateOrderStatus, 
    transactions,
    resetToDefaultData,
    showNotification,
    ownerAuthenticated,
    lockOwnerSession,
    vleApplications,
    importantLinks,
    allTools,
    paymentRequests,
    rechargeOrders,
  } = useApp();

  if (!ownerAuthenticated) {
    return <OwnerSecurityGate />;
  }

  const [activeTab, setActiveTab] = useState<
    | 'overview' 
    | 'analytics' 
    | 'vle_approvals' 
    | 'payment_approvals' 
    | 'recharge_queue' 
    | 'support' 
    | 'services' 
    | 'service_settings'
    | 'service_orders'
    | 'tools_hub' 
    | 'links' 
    | 'vles' 
    | 'staff' 
    | 'orders' 
    | 'settings' 
    | 'monetization'
  >('overview');

  // Service modal
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState<Omit<ServiceItem, 'id'>>({
    name: '',
    category: 'photo_tools',
    description: '',
    userPrice: 50,
    vlePrice: 30,
    vleCommission: 20,
    iconName: 'Sparkles',
    enabled: true,
    popular: false,
  });

  // Edit Service modal
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // VLE Add modal
  const [showAddVleModal, setShowAddVleModal] = useState(false);
  const [vleForm, setVleForm] = useState({
    centerName: '',
    operatorName: '',
    mobile: '',
    email: '',
    state: 'Uttar Pradesh',
    district: '',
    walletBalance: 1000,
    status: 'active' as const,
    kycVerified: true,
  });

  // Wallet Recharge modal
  const [walletModalVle, setWalletModalVle] = useState<VleOperator | null>(null);
  const [walletAmount, setWalletAmount] = useState<number>(500);
  const [walletType, setWalletType] = useState<'credit' | 'debit'>('credit');
  const [walletReason, setWalletReason] = useState<string>('Manual Admin Credit / UPI Approval');

  // Search queries
  const [orderSearch, setOrderSearch] = useState('');
  const [vleSearch, setVleSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  // Stats calculations
  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
  const totalVleBalances = vles.reduce((sum, v) => sum + v.walletBalance, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const activeVleCount = vles.filter((v) => v.status === 'active').length;
  const paymentPendingCount = paymentRequests.filter((p) => p.status === 'pending').length;

  // Recharge pending count for badge
  const rechargePendingCount = rechargeOrders.filter(
    (r) => r.status === 'payment_submitted' || r.status === 'payment_verified'
  ).length;

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name) return;
    addService(serviceForm);
    setShowAddServiceModal(false);
    setServiceForm({
      name: '',
      category: 'photo_tools',
      description: '',
      userPrice: 50,
      vlePrice: 30,
      vleCommission: 20,
      iconName: 'Sparkles',
      enabled: true,
      popular: false,
    });
  };

  const handleUpdateServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    updateService(editingService);
    setEditingService(null);
  };

  const handleCreateVle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vleForm.centerName || !vleForm.operatorName) return;
    addVle(vleForm);
    setShowAddVleModal(false);
  };

  const handleWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletModalVle) return;
    updateVleWallet(walletModalVle.id, walletAmount, walletType, walletReason);
    setWalletModalVle(null);
  };

  const pendingVleAppsCount = vleApplications.filter((a) => a.status === 'pending').length;

  return (
    <div id="owner-portal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner / Control Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-amber-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5" />
              Master Owner Panel • Full Control
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {siteConfig.siteName} Master Command Center
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Manage tools, links, VLE registrations, payments, staff, and site security.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={resetToDefaultData}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Demo
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition"
            >
              <Settings className="w-3.5 h-3.5" />
              Security & Settings
            </button>
            <button
              onClick={lockOwnerSession}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition"
              title="Securely Lock Owner Panel Session"
            >
              <Lock className="w-3.5 h-3.5" />
              Lock Panel
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Overview & Stats', icon: TrendingUp },
            { id: 'analytics', label: '📊 Analytics', icon: BarChart3 },
            { id: 'vle_approvals', label: `VLE Applications`, icon: UserCheck, badge: pendingVleAppsCount },
            { id: 'payment_approvals', label: `Payments`, icon: CreditCard, badge: paymentPendingCount },
            { id: 'recharge_queue', label: `📱 Recharge Orders`, icon: Smartphone, badge: rechargePendingCount },
            { id: 'support', label: `🎧 Support`, icon: LifeBuoy },
            { id: 'tools_hub', label: `50+ Tools Registry`, icon: Wrench },
            { id: 'links', label: `Govt Links (${importantLinks.length})`, icon: Link2 },
            { id: 'services', label: `Form Services (${services.length})`, icon: Layers },
            { id: 'service_settings', label: `⚙️ Service Orders Setup`, icon: Package },
            { id: 'service_orders', label: `📦 Service Orders`, icon: Package, badge: 0 },
            { id: 'vles', label: `VLE Operators (${vles.length})`, icon: Store },
            { id: 'staff', label: `👥 Staff Management`, icon: UserCog },
            { id: 'orders', label: `Customer Orders (${orders.length})`, icon: FileText, badge: pendingOrders },
            { id: 'monetization', label: 'Adsterra Ads', icon: Megaphone },
            { id: 'settings', label: 'Security & Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-black">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* TAB: OVERVIEW & STATS */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Service Orders</span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-4 h-4" /></span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{orders.length}</div>
              <div className="text-[11px] text-amber-600 font-medium mt-1">{pendingOrders} Pending Action</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Orders Revenue</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign className="w-4 h-4" /></span>
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">₹{totalRevenue.toLocaleString()}</div>
              <div className="text-[11px] text-slate-500 mt-1">Processed across India</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Active CSC VLEs</span>
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Store className="w-4 h-4" /></span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{activeVleCount} / {vles.length}</div>
              <div className="text-[11px] text-indigo-600 font-medium mt-1">Authorized Centers</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total VLE Wallets Pool</span>
                <span className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Wallet className="w-4 h-4" /></span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">₹{totalVleBalances.toLocaleString()}</div>
              <div className="text-[11px] text-slate-500 mt-1">Operator advance balances</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Latest Customer Applications</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{order.customerName}</div>
                      <div className="text-slate-500 text-[11px]">{order.serviceName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Token: {order.tokenNumber} • {order.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono">₹{order.amount}</div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${
                        order.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'approved'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Wallet Recharges & Ledger</h3>
                <button
                  onClick={() => setActiveTab('vles')}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  Manage VLEs
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">{tx.vleName}</div>
                      <div className="text-slate-500 text-[11px]">{tx.reason}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tx.timestamp}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold font-mono ${tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Bal: ₹{tx.balanceAfter}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* TAB: ANALYTICS DASHBOARD */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <OwnerAnalytics />
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* TAB: SERVICES & TOOLS MANAGER */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Services & Utility Tools Management</h2>
              <p className="text-xs text-slate-500">
                Owner controls tool availability, pricing (User fee vs VLE cost), and commission rates.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <button
                onClick={() => setShowAddServiceModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Add New Tool / Service
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">Service Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Customer Price</th>
                  <th className="p-3">VLE Price</th>
                  <th className="p-3">VLE Commission</th>
                  <th className="p-3">Live Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services
                  .filter((s) => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
                  .map((srv) => (
                    <tr key={srv.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{srv.name}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{srv.description}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                          {srv.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {srv.userPrice === 0 ? <span className="text-emerald-600 font-sans font-semibold">FREE</span> : `₹${srv.userPrice}`}
                      </td>
                      <td className="p-3 font-mono text-slate-700">₹{srv.vlePrice}</td>
                      <td className="p-3 font-mono font-bold text-emerald-600">+₹{srv.vleCommission}</td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleService(srv.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                            srv.enabled
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {srv.enabled ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-emerald-600" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-slate-500" />
                              <span>Disabled</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingService(srv)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                            title="Edit Pricing & Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete service "${srv.name}"?`)) {
                                deleteService(srv.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* 🆕 TAB: SERVICE ORDERS SETUP (Google Form + Payment) */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'service_settings' && (
        <ServiceSettingsManager />
      )}

      {activeTab === 'service_orders' && (
        <ServiceOrdersManager />
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* TAB: CSC VLE OPERATORS MANAGEMENT */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'vles' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">CSC VLE & Cyber Cafe Operators Network</h2>
              <p className="text-xs text-slate-500">
                Approve registrations, credit/debit wallet balances, and track offline center transactions.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search VLE center..."
                  value={vleSearch}
                  onChange={(e) => setVleSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <button
                onClick={() => setShowAddVleModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Register New VLE
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">VLE ID & Center Name</th>
                  <th className="p-3">Operator Name</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Wallet Balance</th>
                  <th className="p-3">Jobs Completed</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Owner Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vles
                  .filter(
                    (v) =>
                      v.centerName.toLowerCase().includes(vleSearch.toLowerCase()) ||
                      v.operatorName.toLowerCase().includes(vleSearch.toLowerCase()) ||
                      v.vleId.toLowerCase().includes(vleSearch.toLowerCase())
                  )
                  .map((vle) => (
                    <tr key={vle.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{vle.centerName}</div>
                        <div className="text-[11px] text-blue-600 font-mono font-semibold">{vle.vleId}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{vle.operatorName}</div>
                        <div className="text-[11px] text-slate-500">{vle.mobile}</div>
                      </td>
                      <td className="p-3 text-slate-600">{vle.district}, {vle.state}</td>
                      <td className="p-3">
                        <div className="font-bold font-mono text-emerald-700 text-sm">₹{vle.walletBalance.toLocaleString()}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{vle.totalOrdersCompleted} jobs</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          vle.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {vle.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setWalletModalVle(vle);
                              setWalletAmount(500);
                              setWalletType('credit');
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg text-xs flex items-center gap-1 transition"
                          >
                            <Wallet className="w-3.5 h-3.5" /> Top-Up
                          </button>
                          <button
                            onClick={() => toggleVleStatus(vle.id)}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                              vle.status === 'active'
                                ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {vle.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* TAB: ORDERS & SERVICE REQUESTS */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">All Applications & Service Orders</h2>
              <p className="text-xs text-slate-500">
                Update status, verify customer documents, attach acknowledgment slips, or approve requests.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search token, customer name, mobile..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">Token & Date</th>
                  <th className="p-3">Applicant Details</th>
                  <th className="p-3">Service Applied</th>
                  <th className="p-3">Assigned VLE</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Current Status</th>
                  <th className="p-3 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders
                  .filter(
                    (o) =>
                      o.tokenNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
                      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
                      o.customerMobile.includes(orderSearch)
                  )
                  .map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <div className="font-mono font-bold text-slate-900">{order.tokenNumber}</div>
                        <div className="text-[10px] text-slate-500">{order.date}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{order.customerName}</div>
                        <div className="text-[11px] text-slate-500">{order.customerMobile}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{order.serviceName}</div>
                        {order.notes && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">Note: {order.notes}</div>
                        )}
                      </td>
                      <td className="p-3 text-slate-600">
                        {order.vleCenterName || <span className="text-slate-400">Direct Online</span>}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">₹{order.amount}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          order.status === 'completed' ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'processing' ? 'bg-blue-100 text-blue-800'
                          : order.status === 'approved' ? 'bg-purple-100 text-purple-800'
                          : order.status === 'rejected' ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                          className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white font-semibold text-slate-700"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="approved">Approved</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* TAB: WEBSITE GLOBAL SETTINGS */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Website Global Control & Configuration</h2>
            <p className="text-xs text-slate-500">
              Live configuration for brand name, marquee alerts, UPI payment gateway, and contact information.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Branding & Helpdesk Details</h3>

              <div>
                <label className="text-[11px] text-slate-500 font-semibold">Website Title / Brand Name:</label>
                <input
                  type="text"
                  value={siteConfig.siteName}
                  onChange={(e) => updateSiteConfig({ siteName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-semibold">Tagline / Subtitle:</label>
                <input
                  type="text"
                  value={siteConfig.tagline}
                  onChange={(e) => updateSiteConfig({ tagline: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold">Support Phone:</label>
                  <input
                    type="text"
                    value={siteConfig.supportPhone}
                    onChange={(e) => updateSiteConfig({ supportPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold">WhatsApp Number:</label>
                  <input
                    type="text"
                    value={siteConfig.supportWhatsApp}
                    onChange={(e) => updateSiteConfig({ supportWhatsApp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-semibold">Official Support Email:</label>
                <input
                  type="email"
                  value={siteConfig.supportEmail}
                  onChange={(e) => updateSiteConfig({ supportEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Breaking News Marquee & Payments</h3>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-500 font-semibold">Marquee Scrolling Ticker Text:</label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-amber-600">
                    <input
                      type="checkbox"
                      checked={siteConfig.noticeEnabled}
                      onChange={(e) => updateSiteConfig({ noticeEnabled: e.target.checked })}
                      className="rounded accent-amber-600"
                    />
                    Enabled
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={siteConfig.noticeMarquee}
                  onChange={(e) => updateSiteConfig({ noticeMarquee: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-semibold">UPI ID for Direct Payments / Wallet:</label>
                <input
                  type="text"
                  value={siteConfig.upiId}
                  onChange={(e) => {
                    const id = e.target.value;
                    updateSiteConfig({ 
                      upiId: id,
                      upiQrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${id}&pn=999tools%20Services&cu=INR`
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">System Maintenance Mode</div>
                  <div className="text-[10px] text-slate-500">Temporarily show maintenance banner to public users</div>
                </div>
                <button
                  type="button"
                  onClick={() => updateSiteConfig({ maintenanceMode: !siteConfig.maintenanceMode })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    siteConfig.maintenanceMode ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {siteConfig.maintenanceMode ? 'Active' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="space-y-4 bg-blue-50/50 p-5 rounded-xl border border-blue-200 md:col-span-2">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600" />
                Subscription Pricing & Plans
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">Premium Monthly (₹):</label>
                  <input
                    type="number"
                    value={siteConfig.premiumMonthlyPrice || 49}
                    onChange={(e) => updateSiteConfig({ premiumMonthlyPrice: parseFloat(e.target.value) || 49 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">Premium Yearly (₹):</label>
                  <input
                    type="number"
                    value={siteConfig.premiumYearlyPrice || 399}
                    onChange={(e) => updateSiteConfig({ premiumYearlyPrice: parseFloat(e.target.value) || 399 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">VLE Monthly (₹):</label>
                  <input
                    type="number"
                    value={siteConfig.vleMonthlyPrice || 199}
                    onChange={(e) => updateSiteConfig({ vleMonthlyPrice: parseFloat(e.target.value) || 199 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">VLE Yearly (₹):</label>
                  <input
                    type="number"
                    value={siteConfig.vleYearlyPrice || 1499}
                    onChange={(e) => updateSiteConfig({ vleYearlyPrice: parseFloat(e.target.value) || 1499 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">Free User Daily Limit (uses per premium tool):</label>
                <input
                  type="number"
                  value={siteConfig.freeUserDailyLimit || 3}
                  onChange={(e) => updateSiteConfig({ freeUserDailyLimit: parseInt(e.target.value) || 3 })}
                  className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold bg-white"
                />
                <span className="text-[11px] text-slate-500 ml-3">Free users can use premium tools this many times per day</span>
              </div>
            </div>

            <div className="space-y-4 bg-amber-50/50 p-5 rounded-xl border border-amber-200 md:col-span-2">
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Owner Panel Security
              </h3>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                <div className="font-bold text-blue-800 mb-1">🔒 Firebase Auth Active</div>
                <div className="text-blue-700 text-[11px]">
                  Owner login is now protected by Google Firebase. Password is encrypted on Firebase servers.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: VLE REGISTRATION APPLICATIONS */}
      {activeTab === 'vle_approvals' && (
        <VleApprovalsManager />
      )}

      {/* TAB: PAYMENT APPROVALS */}
      {activeTab === 'payment_approvals' && (
        <PaymentApprovalsManager />
      )}

      {/* TAB: RECHARGE ORDERS QUEUE */}
      {activeTab === 'recharge_queue' && (
        <OwnerRechargeQueue />
      )}

      {/* 🆕 TAB: STAFF MANAGEMENT */}
      {activeTab === 'staff' && (
        <StaffManager />
      )}

      {/* TAB: SUPPORT TICKETS */}
      {activeTab === 'support' && (
        <OwnerSupportManager />
      )}

      {/* TAB: 50+ TOOLS REGISTRY */}
      {activeTab === 'tools_hub' && (
        <ToolsManager />
      )}

      {/* TAB: IMPORTANT GOVT LINKS */}
      {activeTab === 'links' && (
        <ImportantLinksManager />
      )}

      {/* TAB: ADSTERRA MONETIZATION */}
      {activeTab === 'monetization' && (
        <AdsterraManager />
      )}

      {/* MODAL: Add New Service */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add New Service / Tool</h3>
              <button onClick={() => setShowAddServiceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-600 font-semibold">Service Name:</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-semibold">Category:</label>
                <select
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value as ServiceCategory })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  <option value="photo_tools">Photo & Signature Tools</option>
                  <option value="pan_aadhaar">PAN & Aadhaar Services</option>
                  <option value="certificates">Certificates</option>
                  <option value="govt_schemes">Government Schemes</option>
                  <option value="exam_admit">Exams & Admit Cards</option>
                  <option value="banking_utility">Banking & Utility</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-semibold">Description:</label>
                <input
                  type="text"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold">User Price (₹):</label>
                  <input
                    type="number"
                    value={serviceForm.userPrice}
                    onChange={(e) => setServiceForm({ ...serviceForm, userPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold">VLE Cost (₹):</label>
                  <input
                    type="number"
                    value={serviceForm.vlePrice}
                    onChange={(e) => setServiceForm({ ...serviceForm, vlePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold">Commission (₹):</label>
                  <input
                    type="number"
                    value={serviceForm.vleCommission}
                    onChange={(e) => setServiceForm({ ...serviceForm, vleCommission: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Service */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Pricing & Details</h3>
              <button onClick={() => setEditingService(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateServiceSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-600 font-semibold">Service Name:</label>
                <input
                  type="text"
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-semibold">Description:</label>
                <input
                  type="text"
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold">Customer Fee (₹):</label>
                  <input
                    type="number"
                    value={editingService.userPrice}
                    onChange={(e) => setEditingService({ ...editingService, userPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold">VLE Price (₹):</label>
                  <input
                    type="number"
                    value={editingService.vlePrice}
                    onChange={(e) => setEditingService({ ...editingService, vlePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold">VLE Margin (₹):</label>
                  <input
                    type="number"
                    value={editingService.vleCommission}
                    onChange={(e) => setEditingService({ ...editingService, vleCommission: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Wallet Top-Up */}
      {walletModalVle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Wallet Top-Up / Deduction</h3>
              <button onClick={() => setWalletModalVle(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWalletSubmit} className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div className="text-slate-500">Center:</div>
                <div className="font-bold text-slate-800">{walletModalVle.centerName}</div>
                <div className="text-blue-600 font-mono text-[11px] font-semibold">{walletModalVle.vleId}</div>
                <div className="text-slate-500 mt-1">Balance: <strong className="text-emerald-700 font-mono">₹{walletModalVle.walletBalance}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWalletType('credit')}
                  className={`py-2 text-xs font-bold rounded-lg border ${
                    walletType === 'credit' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  + Credit
                </button>
                <button
                  type="button"
                  onClick={() => setWalletType('debit')}
                  className={`py-2 text-xs font-bold rounded-lg border ${
                    walletType === 'debit' ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  - Debit
                </button>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-semibold">Amount (₹):</label>
                <input
                  type="number"
                  required
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-semibold">Reason / Reference:</label>
                <input
                  type="text"
                  value={walletReason}
                  onChange={(e) => setWalletReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWalletModalVle(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 text-white text-xs font-bold rounded-lg shadow-sm ${
                    walletType === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Register New VLE */}
      {showAddVleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Register New CSC VLE Center</h3>
              <button onClick={() => setShowAddVleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateVle} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-600 font-semibold">Center / Cyber Cafe Name:</label>
                <input
                  type="text"
                  required
                  value={vleForm.centerName}
                  onChange={(e) => setVleForm({ ...vleForm, centerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold">Operator Name:</label>
                  <input
                    type="text"
                    required
                    value={vleForm.operatorName}
                    onChange={(e) => setVleForm({ ...vleForm, operatorName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold">Mobile Number:</label>
                  <input
                    type="text"
                    required
                    value={vleForm.mobile}
                    onChange={(e) => setVleForm({ ...vleForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold">State:</label>
                  <input
                    type="text"
                    value={vleForm.state}
                    onChange={(e) => setVleForm({ ...vleForm, state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold">District:</label>
                  <input
                    type="text"
                    required
                    value={vleForm.district}
                    onChange={(e) => setVleForm({ ...vleForm, district: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-semibold">Initial Wallet Balance (₹):</label>
                <input
                  type="number"
                  value={vleForm.walletBalance}
                  onChange={(e) => setVleForm({ ...vleForm, walletBalance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddVleModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Add Operator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
