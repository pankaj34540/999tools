import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Store, 
  Wallet, 
  Camera, 
  Maximize2, 
  CreditCard, 
  FileText, 
  Receipt, 
  Sparkles, 
  Calendar, 
  Plus, 
  QrCode, 
  Search, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  FileCheck2,
  Copy,
  Printer,
  ChevronRight,
  ExternalLink,
  Stamp
} from 'lucide-react';
import { quickGovtLinks } from '../../data/initialData';
import { PassportPhotoMaker } from '../tools/PassportPhotoMaker';
import { PhotoSignResizer } from '../tools/PhotoSignResizer';
import { AadhaarCardFormatter } from '../tools/AadhaarCardFormatter';
import { ResumeMaker } from '../tools/ResumeMaker';
import { ReceiptGenerator } from '../tools/ReceiptGenerator';
import { AgeCalculator } from '../tools/AgeCalculator';
import { DocumentCleanTool } from '../tools/DocumentCleanTool';
import { WatermarkTool } from '../tools/WatermarkTool';
import { ToolsExplorer } from '../tools/ToolsExplorer';
import { ShopBrandingManager } from './ShopBrandingManager';
import { VleRegistrationModal } from './VleRegistrationModal';
import { VleLoginModal } from './VleLoginModal';

export const VlePortal: React.FC = () => {
  const { 
    activeVle, 
    vles, 
    setActiveVle, 
    siteConfig, 
    services, 
    orders, 
    addCustomerOrder, 
    updateVleWallet,
    transactions,
    activeTool,
    setActiveTool,
    showNotification
  } = useApp();

  const [activeTab, setActiveTab] = useState<'tools' | 'apply' | 'orders' | 'branding' | 'formats'>('tools');
  const [toolsViewMode, setToolsViewMode] = useState<'all_50' | 'essentials'>('all_50');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Quick Apply Modal for customer coming to cyber cafe
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('srv_pan_new');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  // Current VLE Center
  const currentCenter = activeVle || vles[0];

  // Orders for this VLE
  const vleOrders = orders.filter((o) => o.vleId === currentCenter.vleId);
  const totalCounterEarnings = vleOrders.reduce((sum, o) => sum + o.amount, 0);

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerMobile) return;

    const srv = services.find((s) => s.id === selectedServiceId);
    if (!srv) return;

    // Create Order with 100% direct counter cash collection (No wallet deduction for lifetime VIP)
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

  return (
    <div id="vle-portal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* VLE Center Dashboard Banner */}
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

          {/* Membership Status & Counter Revenue Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-4 shadow-inner">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Membership: Lifetime VIP (Active)
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                ₹{totalCounterEarnings.toLocaleString()}
              </div>
              <div className="text-[10px] text-blue-200 mt-0.5">
                Total Direct Counter Cash Collected ({vleOrders.length} jobs)
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition border border-white/30 flex items-center gap-1"
                title="Switch Operator ID or Login"
              >
                <span>Switch / Login</span>
              </button>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Registration (₹{siteConfig.vleOneTimeFee || 299})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap gap-2">
          {[
            { id: 'tools', label: 'Cyber Cafe Quick Tools (Unlimited)', icon: Camera },
            { id: 'apply', label: 'Customer Form Fill Up & Services', icon: Plus },
            { id: 'orders', label: `Customer Job Ledger (${vleOrders.length})`, icon: FileText },
            { id: 'branding', label: 'Shop Branding & UPI Standee', icon: Store },
            { id: 'formats', label: 'Affidavits & Print Formats', icon: FileCheck2 },
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
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDER ACTIVE TOOL MODAL IF ANY */}
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

      {(activeTool === 'watermark' || activeTool === 'tool-pdf-watermark') && (
        <div className="animate-in fade-in zoom-in-95">
          <WatermarkTool onClose={() => setActiveTool(null)} />
        </div>
      )}

      {/* TAB 1: CYBER CAFE ESSENTIAL TOOLS */}
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
                Optimized for fast customer turnaround: print ready sheets, PVC cards, PDF mergers, typing tests & bills.
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
                <span>All 50 Tools Engine</span>
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
            {/* Passport Sheet */}
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

            {/* Govt Resizer */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Maximize2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Govt Exam Photo & Sign Resizer</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Exact KB & pixel presets for SSC, UPSC, Railway, PAN Card, and State Police with live range badge.
                </p>
              </div>
              <button
                onClick={() => setActiveTool('resizer')}
                className="mt-5 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                Launch Resizer <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* CR80 Smart Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Aadhaar & Smart Card Formatter</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Align front and back scans into standard 85.6mm x 54mm CR80 PVC dimensions with cut guide markers.
                </p>
              </div>
              <button
                onClick={() => setActiveTool('aadhaar')}
                className="mt-5 w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                Format Smart Card <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Resume / Bio-Data */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Cyber Cafe Bio-Data & Resume</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Fill candidate profile and generate a clean 1-page professional resume/bio-data ready for printing.
                </p>
              </div>
              <button
                onClick={() => setActiveTool('resume')}
                className="mt-5 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                Create Bio-Data <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Receipt & Token */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Customer Job Slip & Receipt</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Print thermal 80mm or slip bill with QR code, token number, advance paid, and delivery time.
                </p>
              </div>
              <button
                onClick={() => setActiveTool('receipt')}
                className="mt-5 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                Generate Token Slip <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Document Cleaner */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Scanned Document Cleaner</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Turn dark mobile camera shots of marksheets and certificates into clean photocopy-ready black & white.
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

      {/* TAB 2: ASSISTED ONLINE SERVICES (APPLY FOR CUSTOMER) */}
      {activeTab === 'apply' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Online Services & Assisted Form Applications
              </h2>
              <p className="text-xs text-slate-500">
                Earn commissions on PAN card, Caste/Income/Domicile certificates, PM Kisan, and Voter ID forms.
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
                      <span className="text-[10px] text-slate-500 block">VLE Fee: ₹{srv.vlePrice}</span>
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

      {/* TAB 3: VLE ORDER HISTORY / CUSTOMER JOBS QUEUE */}
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
                  <th className="p-3">Customer Charged</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Receipt Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vleOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      No customer orders recorded yet for this center.
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
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            order.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'processing'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{order.date}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setActiveTool('receipt');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto"
                        >
                          <Printer className="w-3 h-3" /> Print Token
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

      {/* TAB 4: SHOP BRANDING & CUSTOMER COUNTER UPI QR */}
      {activeTab === 'branding' && (
        <ShopBrandingManager currentCenter={currentCenter} />
      )}

      {/* TAB 5: OFFICIAL AFFIDAVITS & PRINT FORMATS */}
      {activeTab === 'formats' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Ready Cyber Cafe Affidavits & Verification Drafts
            </h2>
            <p className="text-xs text-slate-500">
              One-click copy or print standard Indian legal drafts, police complaints, and rent agreements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                title: 'Lost Document Police Complaint Draft',
                category: 'Aadhaar / Marks Sheet / PAN Loss',
                content: `To,
The Station House Officer (SHO),
Police Station: [Local Area], Lucknow, UP.

Subject: Intimation regarding loss of original [High School Marksheet / Aadhaar Card].

Respected Sir,
I, [Applicant Name], S/O [Father Name], resident of [Complete Address], state that on dated [Date of Loss], I have accidentally lost my original [Document Name] bearing Number [Document Number] while travelling from [Source] to [Destination].

Despite my best search efforts, the document could not be traced. You are requested to kindly lodge a Non-Cognizable Report (NCR) and issue an acknowledgment so that I may apply for a duplicate certificate from the respective issuing authority.

Thanking You,
Yours faithfully,
[Applicant Name]
Mobile: [Mobile Number]`,
              },
              {
                title: 'Rent Agreement Draft (Standard 11 Months)',
                category: 'Rental & Residence Proof',
                content: `RENT AGREEMENT (11 MONTHS)

This agreement made on this [Date] day of [Month, Year] between:
FIRST PARTY (LANDLORD): [Owner Name], S/O [Father Name], R/O [Landlord Address].
AND
SECOND PARTY (TENANT): [Tenant Name], S/O [Father Name], R/O [Permanent Address].

WHEREAS the Landlord is the absolute owner of residential premises at [Property Address].
The monthly rent has been mutually agreed at Rs. [Rent Amount]/- per month, excluding electricity and water charges.
The Tenant has paid a refundable security deposit of Rs. [Security Deposit]/-.

IN WITNESS WHEREOF both parties have set their hands on the day and date mentioned above.
First Party (Landlord)                Second Party (Tenant)`,
              },
              {
                title: 'Character & Conduct Self-Declaration',
                category: 'Govt Employment & Admission',
                content: `SELF DECLARATION / CHARACTER CERTIFICATE

I, [Candidate Name], son/daughter of Shri [Father Name], resident of [Full Village/City Address], do hereby solemnly affirm and state as follows:

1. That I am a law-abiding citizen of India and have never been convicted in any criminal offence by any Court of Law.
2. That no FIR, criminal investigation, or disciplinary proceedings are pending against me in any police station or institution.
3. That all educational certificates and identity cards submitted by me are genuine and verified.

Date: [Date]
Place: [City]
Signature of Candidate: _________________`,
              },
              {
                title: 'Name Discrepancy Affidavit Draft',
                category: 'Mark Sheet vs Aadhaar Mismatch',
                content: `AFFIDAVIT FOR NAME DISCREPANCY / CORRECTION

I, [Candidate Correct Name], S/O [Father Name], aged [Age] years, R/O [Address], do hereby state on oath as under:

1. That my actual, correct and official name is [Correct Name] as registered in my Matriculation Certificate.
2. That in my Aadhaar Card / PAN Card, my name was erroneously printed as [Incorrect Name].
3. That [Correct Name] and [Incorrect Name] both refer to one and the same identical person, which is myself.

Deponent: [Candidate Signature]
Verification: Verified at [City] that the contents of this affidavit are true to the best of my knowledge.`,
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
                        showNotification('Draft copied to clipboard!');
                      }}
                      className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Text
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
                          <html>
                            <head><title>${draft.title} - 999tools</title></head>
                            <body style="font-family:serif;padding:40px;white-space:pre-wrap;line-height:1.6;font-size:14px;">
                              ${draft.content}
                            </body>
                          </html>
                        `);
                        printWin.document.close();
                        printWin.print();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Draft
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
              <h3 className="text-sm font-bold text-slate-900">Walk-in Customer Service Entry</h3>
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
                  {services
                    .filter((s) => s.enabled)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Fee: ₹{s.userPrice} | Comm: +₹{s.vleCommission})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-semibold">Customer Full Name:</label>
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
                <label className="text-[11px] text-slate-600 font-semibold">Applicant Note / Docs Attached:</label>
                <textarea
                  rows={2}
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="e.g. Aadhaar copy submitted, Father name Ramesh"
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
                  Confirm & Create Job Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VLE REGISTRATION MODAL */}
      <VleRegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />

      {/* VLE OPERATOR LOGIN MODAL */}
      <VleLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onOpenRegister={() => setShowRegisterModal(true)}
      />
    </div>
  );
};
