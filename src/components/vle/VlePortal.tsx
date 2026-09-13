import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Store, 
  Camera, 
  Maximize2, 
  CreditCard, 
  FileText, 
  Receipt, 
  Sparkles, 
  Plus, 
  ArrowUpRight, 
  FileCheck2,
  Copy,
  Printer,
  Lock,
  KeyRound,
  BookOpen
} from 'lucide-react';
import { PassportPhotoMaker } from '../tools/PassportPhotoMaker';
import { PhotoSignResizer } from '../tools/PhotoSignResizer';
import { AadhaarCardFormatter } from '../tools/AadhaarCardFormatter';
import { ResumeMaker } from '../tools/ResumeMaker';
import { ReceiptGenerator } from '../tools/ReceiptGenerator';
import { AgeCalculator } from '../tools/AgeCalculator';
import { DocumentCleanTool } from '../tools/DocumentCleanTool';
import { ToolsExplorer } from '../tools/ToolsExplorer';
import { ShopBrandingManager } from './ShopBrandingManager';
import { VleRegistrationModal } from './VleRegistrationModal';
import { VleLoginModal } from './VleLoginModal';
import { KhatabookManager } from './KhatabookManager';

export const VlePortal: React.FC = () => {
  const { 
    activeVle, 
    siteConfig, 
    services, 
    orders, 
    addCustomerOrder, 
    activeTool,
    setActiveTool,
    showNotification,
    vleLoggedIn,
    vleLogout,
    ledgerEntries,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'tools' | 'khatabook' | 'apply' | 'orders' | 'branding' | 'formats'>('tools');
  const [toolsViewMode, setToolsViewMode] = useState<'all_50' | 'essentials'>('all_50');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('srv_pan_new');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  // ============================================
  // UNIFIED ACCESS CHECK
  // 1. VLE Portal se login (activeVle + vleLoggedIn)
  // 2. User account with plan === 'vle' (unified system)
  // ============================================
  const isVleUser = currentUser?.plan === 'vle' && currentUser?.vleData;
  const hasVleAccess = (activeVle && vleLoggedIn) || !!isVleUser;

  // LOGIN GUARD
  if (!hasVleAccess) {
    return (
      <div id="vle-portal-login" className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-10 text-center shadow-2xl border border-blue-700/40 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto bg-amber-400/20 border border-amber-400/40 rounded-2xl flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-amber-400" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-4">
              <Store className="w-3 h-3" />
              CSC VLE & Cyber Cafe Portal
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tight">
              🔒 Login Required
            </h1>

            <p className="text-sm text-blue-200 mb-2 leading-relaxed">
              Yeh portal sirf <strong className="text-amber-300">registered CSC VLE</strong> aur 
              <strong className="text-amber-300"> Cyber Cafe operators</strong> ke liye hai.
            </p>
            <p className="text-xs text-blue-300/80 mb-8">
              Pehle apne email aur password se login karein. Agar abhi tak register nahi kiya hai, 
              toh ₹{siteConfig.vleMonthlyPrice || 199}/month ka VLE plan lein.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-blue-900/30 active:scale-[0.98]"
              >
                <KeyRound className="w-4 h-4" />
                <span>VLE Operator Login</span>
              </button>

              <button
                onClick={() => setShowRegisterModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3.5 rounded-xl transition shadow-lg shadow-amber-900/20 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>New VLE Registration (₹{siteConfig.vleMonthlyPrice || 199}/mo)</span>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-3 gap-3 text-[10px] text-blue-200">
              <div>
                <div className="text-amber-400 font-black text-lg">50+</div>
                <div>Tools Access</div>
              </div>
              <div>
                <div className="text-amber-400 font-black text-lg">📖</div>
                <div>Khatabook</div>
              </div>
              <div>
                <div className="text-amber-400 font-black text-lg">∞</div>
                <div>Unlimited</div>
              </div>
            </div>
          </div>
        </div>

        <VleRegistrationModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
        />
        <VleLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onOpenRegister={() => setShowRegisterModal(true)}
        />
      </div>
    );
  }

  // ============================================
  // CURRENT CENTER — From activeVle ya from currentUser.vleData
  // ============================================
  const currentCenter = activeVle || (isVleUser && currentUser?.vleData ? {
    id: currentUser.id,
    vleId: currentUser.vleData.vleId,
    centerName: currentUser.vleData.centerName,
    operatorName: currentUser.vleData.operatorName,
    mobile: currentUser.vleData.mobile,
    email: currentUser.email,
    state: currentUser.vleData.state,
    district: currentUser.vleData.district,
    address: currentUser.vleData.address || '',
    walletBalance: 0,
    status: currentUser.vleData.status,
    kycVerified: currentUser.vleData.kycVerified,
    totalOrdersCompleted: currentUser.vleData.totalOrdersCompleted,
    joinedDate: currentUser.vleData.joinedDate,
    shopUpiId: currentUser.vleData.shopUpiId,
  } : null);

  if (!currentCenter) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Store className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <h3 className="text-sm font-bold text-slate-800">VLE Center not found</h3>
        <p className="text-xs mt-1">Kuch issue hai. Page refresh karo.</p>
      </div>
    );
  }

  const vleOrders = orders.filter((o) => o.vleId === currentCenter.vleId);
  const totalCounterEarnings = vleOrders.reduce((sum, o) => sum + o.amount, 0);
  const receivableCount = ledgerEntries.filter((e) => e.type === 'debit').length;

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerMobile) return;

    const srv = services.find((s) => s.id === selectedServiceId);
    if (!srv) return;

    addCustomerOrder({
      customerName,
      customerMobile,
      serviceId: srv.id,
      serviceName: srv.name,
      amount: srv.userPrice,
      vleId: currentCenter.vleId,
      vleCenterName: currentCenter.centerName,
      status: 'processing',
      notes: customerNote || 'Applied at Cyber Cafe counter (Direct Cash/UPI)',
    });

    setShowApplyModal(false);
    setCustomerName('');
    setCustomerMobile('');
    setCustomerNote('');
  };

  const handleLogout = () => {
    vleLogout();
  };

  return (
    <div id="vle-portal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-700/40 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider">
              <Store className="w-3.5 h-3.5 text-blue-300" />
              CSC VLE & Cyber Cafe Operator Portal
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {currentCenter.centerName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-mono text-xs font-black">
                {currentCenter.vleId}
              </span>
            </div>

            <p className="text-xs text-blue-200 flex items-center gap-2">
              <span>Operator: <strong>{currentCenter.operatorName}</strong> ({currentCenter.mobile})</span>
              <span>•</span>
              <span>{currentCenter.district}, {currentCenter.state}</span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-4 shadow-inner">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                VLE Premium Active
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                ₹{totalCounterEarnings.toLocaleString()}
              </div>
              <div className="text-[10px] text-blue-200 mt-0.5">
                Total Counter Cash ({vleOrders.length} jobs)
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-500/30 hover:bg-red-500/50 text-white font-bold text-xs rounded-xl transition border border-red-400/40 flex items-center gap-1"
                title="Logout from VLE Portal"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap gap-2">
          {[
            { id: 'tools', label: 'Cyber Cafe Tools', icon: Camera },
            { id: 'khatabook', label: '📖 Khatabook', icon: BookOpen, badge: receivableCount },
            { id: 'apply', label: 'Customer Services', icon: Plus },
            { id: 'orders', label: `Job Ledger (${vleOrders.length})`, icon: FileText },
            { id: 'branding', label: 'Shop Branding', icon: Store },
            { id: 'formats', label: 'Affidavits', icon: FileCheck2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-white text-blue-950 shadow-md'
                    : 'bg-white/10 text-white hover:bg-white/20'
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

      {activeTool === 'passport' && (
        <div className="animate-in fade-in zoom-in-95">
          <PassportPhotoMaker onClose={() => setActiveTool(null)} />
        </div>
      )}

      {activeTool === 'resizer' && (
        <div className="animate-in fade-in zoom-in-95">
          <PhotoSignResizer onClose={() => setActiveTool(null)} />
        </div>
      )}

      {activeTool === 'aadhaar' && (
        <div className="animate-in fade-in zoom-in-95">
          <AadhaarCardFormatter onClose={() => setActiveTool(null)} />
        </div>
      )}

      {activeTool === 'resume' && (
        <div className="animate-in fade-in zoom-in-95">
          <ResumeMaker onClose={() => setActiveTool(null)} />
        </div>
      )}

      {activeTool === 'receipt' && (
        <div className="animate-in fade-in zoom-in-95">
          <ReceiptGenerator onClose={() => setActiveTool(null)} />
        </div>
      )}

      {activeTool === 'age' && (
        <div className="animate-in fade-in zoom-in-95">
          <AgeCalculator onClose={() => setActiveTool(null)} />
        </div>
      )}

      {activeTool === 'doc_clean' && (
        <div className="animate-in fade-in zoom-in-95">
          <DocumentCleanTool onClose={() => setActiveTool(null)} />
        </div>
      )}

      {/* TAB: TOOLS */}
      {activeTab === 'tools' && !activeTool && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Cyber Cafe & CSC Tools Center
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                  50 / 999 LIVE
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Print sheets, PVC cards, PDF tools, typing tests & bills — sab yahan.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setToolsViewMode('all_50')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  toolsViewMode === 'all_50'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>All 50 Tools</span>
              </button>
              <button
                onClick={() => setToolsViewMode('essentials')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  toolsViewMode === 'essentials'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Quick 6 Workstations</span>
              </button>
            </div>
          </div>

          {toolsViewMode === 'all_50' ? (
            <ToolsExplorer />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Passport Photo Sheet Maker</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Make 6, 8, 16, or 32 photos on 4x6" lab paper or A4 sheet with 1px border & Govt exam name/date stamp.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTool('passport')}
                  className="mt-5 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  Launch Photo Maker <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <Maximize2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Govt Exam Photo & Sign Resizer</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Exact KB & pixel presets for SSC, UPSC, Railway, PAN Card, and State Police.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTool('resizer')}
                  className="mt-5 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  Launch Resizer <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Aadhaar & Smart Card Formatter</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Align front and back scans into standard 85.6mm x 54mm CR80 PVC dimensions.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTool('aadhaar')}
                  className="mt-5 w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  Format Smart Card <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Cyber Cafe Bio-Data & Resume</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Fill candidate profile and generate a clean 1-page professional resume/bio-data.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTool('resume')}
                  className="mt-5 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  Create Bio-Data <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Customer Job Slip & Receipt</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Print thermal 80mm or slip bill with QR code, token number, advance paid.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTool('receipt')}
                  className="mt-5 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  Generate Token Slip <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Scanned Document Cleaner</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Turn dark mobile camera shots of marksheets into clean photocopy-ready B&W.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTool('doc_clean')}
                  className="mt-5 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  Clean Scanned Doc <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: KHATABOOK */}
      {activeTab === 'khatabook' && (
        <KhatabookManager vle={{
          id: currentCenter.id,
          vleId: currentCenter.vleId,
          centerName: currentCenter.centerName,
          operatorName: currentCenter.operatorName,
          mobile: currentCenter.mobile,
        }} />
      )}

      {/* TAB: APPLY */}
      {activeTab === 'apply' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Online Services & Assisted Form Applications
              </h2>
              <p className="text-xs text-slate-500">
                Earn commissions on PAN card, Caste/Income/Domicile certificates, PM Kisan, and Voter ID.
              </p>
            </div>

            <button
              onClick={() => setShowApplyModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Apply for Walk-in Customer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services
              .filter((s) => s.enabled && s.category !== 'photo_tools')
              .map((srv) => (
                <div
                  key={srv.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {srv.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Earn +₹{srv.vleCommission}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm mt-1">{srv.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{srv.description}</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Customer Price:</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">₹{srv.userPrice}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedServiceId(srv.id);
                        setShowApplyModal(true);
                      }}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Customer Jobs & Applications Queue</h2>
              <p className="text-xs text-slate-500">
                Track status of customers served at {currentCenter.centerName}.
              </p>
            </div>

            <button
              onClick={() => setShowApplyModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
            >
              <Plus className="w-4 h-4" /> New Customer Entry
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">Token No</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Service</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vleOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      No customer orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  vleOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-700">{order.tokenNumber}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{order.customerName}</div>
                        <div className="text-[11px] text-slate-500">{order.customerMobile}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{order.serviceName}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">₹{order.amount}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          order.status === 'completed' ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'processing' ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{order.date}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setActiveTool('receipt')}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto"
                        >
                          <Printer className="w-3 h-3" /> Print
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: BRANDING */}
      {activeTab === 'branding' && (
        <ShopBrandingManager currentCenter={currentCenter as any} />
      )}

      {/* TAB: FORMATS */}
      {activeTab === 'formats' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Ready Cyber Cafe Affidavits & Verification Drafts
            </h2>
            <p className="text-xs text-slate-500">
              One-click copy or print standard Indian legal drafts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                title: 'Lost Document Police Complaint Draft',
                category: 'Aadhaar / Marks Sheet / PAN Loss',
                content: `To,
The Station House Officer (SHO),
Police Station: [Local Area]

Subject: Intimation regarding loss of original [Document].

Respected Sir,
I, [Applicant Name], S/O [Father Name], resident of [Address], state that on dated [Date], I lost my original [Document Name] bearing Number [Number].

You are requested to kindly lodge an NCR and issue an acknowledgment.

Thanking You,
[Applicant Name]
Mobile: [Mobile Number]`,
              },
              {
                title: 'Rent Agreement Draft (11 Months)',
                category: 'Rental & Residence',
                content: `RENT AGREEMENT (11 MONTHS)

Between:
FIRST PARTY (LANDLORD): [Owner Name]
AND
SECOND PARTY (TENANT): [Tenant Name]

Property: [Address]
Monthly Rent: Rs. [Amount]
Security Deposit: Rs. [Amount]

Both parties have set their hands on the day mentioned above.
First Party (Landlord)                Second Party (Tenant)`,
              },
              {
                title: 'Character Self-Declaration',
                category: 'Govt Employment',
                content: `SELF DECLARATION / CHARACTER CERTIFICATE

I, [Candidate Name], S/O Shri [Father Name], resident of [Address], do hereby solemnly affirm:

1. I am a law-abiding citizen of India with no criminal convictions.
2. No FIR or investigation is pending against me.
3. All submitted certificates are genuine.

Date: [Date]
Place: [City]
Signature: _________________`,
              },
              {
                title: 'Name Discrepancy Affidavit',
                category: 'Document Name Mismatch',
                content: `AFFIDAVIT FOR NAME DISCREPANCY

I, [Correct Name], S/O [Father Name], aged [Age] years, R/O [Address], state on oath:

1. My actual name is [Correct Name] as per Matriculation Certificate.
2. In my Aadhaar/PAN, it was printed as [Incorrect Name].
3. Both names refer to me, the same person.

Deponent: [Signature]
Verified at [City]`,
              },
            ].map((draft, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {draft.category}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(draft.content);
                        showNotification('Draft copied!');
                      }}
                      className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{draft.title}</h3>
                  <pre className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto leading-relaxed">
                    {draft.content}
                  </pre>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => {
                      const printWin = window.open('', '_blank');
                      if (printWin) {
                        printWin.document.write(`
                          <html><head><title>${draft.title}</title></head>
                          <body style="font-family:serif;padding:40px;white-space:pre-wrap;line-height:1.6;font-size:14px;">
                            ${draft.content}
                          </body></html>
                        `);
                        printWin.document.close();
                        printWin.print();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Apply for Customer */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Walk-in Customer Entry</h3>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-600 font-semibold">Select Service:</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold"
                >
                  {services.filter((s) => s.enabled).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Fee: ₹{s.userPrice})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-semibold">Customer Name:</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-semibold">Mobile Number:</label>
                <input
                  type="text"
                  required
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-semibold">Notes (Optional):</label>
                <textarea
                  rows={2}
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="e.g. Aadhaar copy submitted"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Create Job Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <VleRegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />

      <VleLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onOpenRegister={() => setShowRegisterModal(true)}
      />
    </div>
  );
};
