import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Wallet, LogOut, LayoutDashboard, ShoppingBag, 
  Zap, FileText, Search, ChevronRight
} from 'lucide-react';
import PassbookGenerator from '../vle/services/PassbookGenerator';

const ESuvidhaPortal: React.FC = () => {
  const { activeVle, currentUser, vleLogout, vles } = useApp();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'wallet'>('dashboard');
  
  // 🆕 State for Passbook Generator Modal
  const [showPassbook, setShowPassbook] = useState(false);
  const [selectedBank, setSelectedBank] = useState<'Airtel' | 'Paytm' | 'Fino'>('Airtel');

  const currentCenter = activeVle || (currentUser?.vleData ? {
    id: currentUser.id,
    centerName: currentUser.vleData.centerName,
    vleId: currentUser.vleData.vleId,
    walletBalance: vles.find(v => v.id === currentUser.id)?.walletBalance || 0,
  } : null);

  if (!currentCenter) return null;

  const handleLogout = async () => {
    await vleLogout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-auto md:h-screen z-20 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl">
            E
          </div>
          <div>
            <h1 className="font-black text-slate-900 leading-tight">E SUVIDHA</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">VLE Portal</p>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-md relative overflow-hidden">
            <div className="absolute -right-2 -top-2 opacity-20"><Wallet className="w-16 h-16" /></div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1 mb-1">
              <Wallet className="w-3 h-3" /> Wallet Balance
            </div>
            <div className="text-2xl font-black font-mono">₹{currentCenter.walletBalance || 0}</div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('services')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'services' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <ShoppingBag className="w-5 h-5" /> All Services
          </button>
          <button 
            onClick={() => setActiveTab('wallet')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'wallet' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Wallet className="w-5 h-5" /> Wallet & History
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{currentCenter.centerName}</div>
              <div className="text-[10px] text-slate-500 font-mono">{currentCenter.vleId}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg text-xs transition"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-black text-slate-900">
            Welcome, {currentCenter.centerName}
          </h2>
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             Online
          </div>
        </header>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" /> Quick Actions
                </h3>
                <p className="text-sm text-slate-500">E SUVIDHA Dashboard mein aapka swagat hai.</p>
              </div>
            </div>
          )}

          {/* ALL SERVICES TAB */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">All Services</h2>
                <div className="relative">
                   <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                   <input type="text" placeholder="Search services..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 🆕 HARDCODED PASSBOOK SERVICES */}
                
                {/* 1. Airtel */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-red-400 transition group">
                   <div className="flex items-start justify-between mb-4">
                     <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-red-600" />
                     </div>
                     <span className="px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded-full uppercase">Banking</span>
                   </div>
                   <h3 className="font-bold text-slate-900 text-base">Airtel Payments Bank Passbook</h3>
                   <p className="text-xs text-slate-500 mt-1 mb-4">Front page print for Airtel Payments Bank customers.</p>
                   <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                     <span className="font-black text-slate-900">₹5</span>
                     <button 
                       onClick={() => { setSelectedBank('Airtel'); setShowPassbook(true); }}
                       className="flex items-center gap-1 text-xs font-bold text-red-600 group-hover:translate-x-1 transition"
                     >
                       Open <ChevronRight className="w-3 h-3" />
                     </button>
                   </div>
                </div>

                {/* 2. Paytm */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-blue-400 transition group">
                   <div className="flex items-start justify-between mb-4">
                     <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                     </div>
                     <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full uppercase">Banking</span>
                   </div>
                   <h3 className="font-bold text-slate-900 text-base">Paytm Payments Bank Passbook</h3>
                   <p className="text-xs text-slate-500 mt-1 mb-4">Front page print for Paytm Payments Bank customers.</p>
                   <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                     <span className="font-black text-slate-900">₹5</span>
                     <button 
                       onClick={() => { setSelectedBank('Paytm'); setShowPassbook(true); }}
                       className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition"
                     >
                       Open <ChevronRight className="w-3 h-3" />
                     </button>
                   </div>
                </div>

                {/* Placeholder for Fino */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm opacity-60">
                   <div className="flex items-start justify-between mb-4">
                     <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-slate-400" />
                     </div>
                     <span className="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-full uppercase">Soon</span>
                   </div>
                   <h3 className="font-bold text-slate-700 text-base">Fino Payments Bank</h3>
                   <p className="text-xs text-slate-400 mt-1 mb-4">Coming soon...</p>
                   <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                     <span className="font-black text-slate-400">₹5</span>
                   </div>
                </div>

              </div>
            </div>
          )}
          
          {/* WALLET TAB */}
          {activeTab === 'wallet' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[300px] flex items-center justify-center">
              <p className="text-slate-400 font-bold">Wallet History Coming Soon...</p>
            </div>
          )}
        </div>
      </main>

      {/* 🆕 PASSBOOK MODAL */}
      {showPassbook && (
        <PassbookGenerator 
          bankName={selectedBank}
          onClose={() => setShowPassbook(false)} 
        />
      )}

    </div>
  );
};

export default ESuvidhaPortal;
