import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Shield, LogOut, Clock, Activity,
  LifeBuoy, Store, CreditCard, Smartphone, Wrench,
  Mail, Phone, CheckCircle2, Lock,
} from 'lucide-react';
import { Staff, STAFF_ROLE_LABELS, StaffPermission } from '../../types';
import { staffLogout } from '../../services/staffService';

// Import existing manager components (reuse them for staff)
import { OwnerSupportManager } from '../owner/OwnerSupportManager';
import { VleApprovalsManager } from '../owner/VleApprovalsManager';
import { PaymentApprovalsManager } from '../owner/PaymentApprovalsManager';
import { OwnerRechargeQueue } from '../owner/OwnerRechargeQueue';
import { ToolsManager } from '../owner/ToolsManager';

interface AdminPortalProps {
  staff: Staff;
  onLogout: () => void;
}

type TabId = 
  | 'overview' 
  | 'tickets' 
  | 'vle_approvals' 
  | 'payment_approvals' 
  | 'recharge_queue' 
  | 'tools';

export const AdminPortal: React.FC<AdminPortalProps> = ({ staff, onLogout }) => {
  const { showNotification } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // ============================================
  // PERMISSION CHECK
  // ============================================
  const has = (p: StaffPermission) => staff.permissions.includes(p);

  // ============================================
  // LOGOUT
  // ============================================
  const handleLogout = async () => {
    await staffLogout();
    showNotification('✅ Logged out from Admin Panel');
    onLogout();
  };

  // ============================================
  // TAB CONFIG — Show only allowed tabs
  // ============================================
  const allTabs: { id: TabId; label: string; icon: any; show: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: Activity, show: true },
    { id: 'tickets', label: '🎧 Support', icon: LifeBuoy, show: has('tickets_view') },
    { id: 'vle_approvals', label: '🏪 VLE Approvals', icon: Store, show: has('vle_view') },
    { id: 'payment_approvals', label: '💳 Payments', icon: CreditCard, show: has('payments_view') },
    { id: 'recharge_queue', label: '📱 Recharge Orders', icon: Smartphone, show: has('recharge_view') },
    { id: 'tools', label: '🔧 Tools & Content', icon: Wrench, show: has('tools_view') || has('links_view') },
  ];

  const visibleTabs = allTabs.filter((t) => t.show);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ═══ HEADER ═══ */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 px-4 py-3 border-b border-blue-600/40 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">
                🛡️ Admin Panel
              </div>
              <div className="text-sm text-white font-black">
                {STAFF_ROLE_LABELS[staff.role]}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block bg-white/10 backdrop-blur border border-white/20 rounded-xl px-3 py-2 text-right">
              <div className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Logged in as</div>
              <div className="text-xs text-white font-black truncate max-w-[150px]">
                {staff.name}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/30 hover:bg-rose-500/50 text-white text-xs font-bold rounded-xl border border-rose-400/40 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ TAB NAVIGATION ═══ */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap gap-2">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-2xl font-black">
                    {staff.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-1">
                      Welcome back
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                      {staff.name}
                    </h1>
                    <p className="text-xs text-blue-100 mt-1">
                      {STAFF_ROLE_LABELS[staff.role]} • {staff.email}
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4">
                  <div className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">
                    Assigned Permissions
                  </div>
                  <div className="text-3xl font-black">{staff.permissions.length}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Email</span>
                </div>
                <div className="text-sm font-black text-slate-900 truncate">{staff.email}</div>
              </div>

              {staff.mobile && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Mobile</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 font-mono">{staff.mobile}</div>
                </div>
              )}

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Last Login</span>
                </div>
                <div className="text-sm font-black text-slate-900">
                  {staff.lastLoginAt
                    ? new Date(staff.lastLoginAt).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })
                    : 'Just now'}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Your Permissions
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {staff.permissions.map((p) => (
                  <span
                    key={p}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[10px] font-mono font-bold text-blue-700"
                  >
                    ✓ {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-900 mb-1">
                    💡 Quick Start
                  </h3>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Upar wale tabs se apna kaam shuru karo. Har action automatically log hota hai 
                    taaki Owner ko complete visibility mile. Kaam pura karte waqt dhyan rakho:
                    apna sahi status update karo, aur koi bhi decision lene se pehle verify karo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SUPPORT TICKETS */}
        {activeTab === 'tickets' && has('tickets_view') && (
          <OwnerSupportManager staff={staff} />
        )}

        {/* TAB: VLE APPROVALS */}
        {activeTab === 'vle_approvals' && has('vle_view') && (
          <VleApprovalsManager staff={staff} />
        )}

        {/* TAB: PAYMENT APPROVALS */}
        {activeTab === 'payment_approvals' && has('payments_view') && (
          <PaymentApprovalsManager staff={staff} />
        )}

        {/* TAB: RECHARGE QUEUE */}
        {activeTab === 'recharge_queue' && has('recharge_view') && (
          <OwnerRechargeQueue staff={staff} />
        )}

        {/* TAB: TOOLS & CONTENT */}
        {activeTab === 'tools' && (has('tools_view') || has('links_view')) && (
          <ToolsManager />
        )}
      </div>
    </div>
  );
};
