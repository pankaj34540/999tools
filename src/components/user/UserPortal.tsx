import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  Camera, 
  Maximize2, 
  CreditCard, 
  FileText, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ExternalLink,
  ShieldCheck,
  Building,
  HelpCircle,
  PhoneCall,
  Send,
  AlertCircle
} from 'lucide-react';
import { quickGovtLinks } from '../../data/initialData';
import { ToolsExplorer } from '../tools/ToolsExplorer';
import { AdsterraBanner } from '../common/AdsterraBanner';

export const UserPortal: React.FC = () => {
  const { 
    siteConfig, 
    services, 
    orders, 
    addCustomerOrder, 
    vles,
    activeTool,
    setActiveTool,
    showNotification,
    importantLinks
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<any | null>(null);
  const [trackSearched, setTrackSearched] = useState(false);

  const [reqCustomerName, setReqCustomerName] = useState('');
  const [reqMobile, setReqMobile] = useState('');
  const [reqServiceId, setReqServiceId] = useState('srv_pan_new');
  const [reqNotes, setReqNotes] = useState('');
  const [reqSuccessToken, setReqSuccessToken] = useState<string | null>(null);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackSearched(true);
    const clean = trackQuery.trim().toLowerCase();
    const found = orders.find(
      (o) => o.tokenNumber.toLowerCase() === clean || o.customerMobile === clean
    );
    setTrackedOrder(found || null);
  };

  const handlePublicRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqCustomerName || !reqMobile) return;

    const srv = services.find((s) => s.id === reqServiceId);
    const newOrder = addCustomerOrder({
      customerName: reqCustomerName,
      customerMobile: reqMobile,
      serviceId: reqServiceId,
      serviceName: srv?.name || 'Online Service',
      amount: srv?.userPrice || 100,
      status: 'pending',
      notes: reqNotes || 'Customer submitted via 999tools online portal',
    });

    setReqSuccessToken(newOrder.tokenNumber);
    setReqCustomerName('');
    setReqMobile('');
    setReqNotes('');
  };

  const filteredServices = services.filter((s) => {
    if (!s.enabled) return false;
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'all' || s.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div id="user-portal" className="space-y-12 pb-16">
      {siteConfig.maintenanceMode && (
        <div className="bg-amber-500 text-slate-950 px-4 py-3 text-center text-xs font-bold flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Scheduled Maintenance in Progress: Tools remain operational, some government portals may take extra time.
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide">
            <span>🇮🇳 India's #1 Online Citizen & Cyber Cafe Utility Suite</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Fast, Free & Accurate <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
              {siteConfig.siteName} Digital Tools
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {siteConfig.tagline}. Prepare passport photo sheets, crop exam signatures to exact KB, format CR80 smart cards, and generate bio-data in seconds.
          </p>

          <div className="max-w-2xl mx-auto relative pt-2">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools (e.g. Photo sheet, Resizer, PAN card, Resume, Age calc)..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-800/90 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-400 shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {[
              { id: 'all', label: 'All Tools & Services' },
              { id: 'photo_tools', label: 'Photo & Sign Resizer' },
              { id: 'pan_aadhaar', label: 'PAN & Aadhaar' },
              { id: 'exam_admit', label: 'Exams & Age' },
              { id: 'certificates', label: 'Certificates & Resume' },
              { id: 'govt_schemes', label: 'Govt Schemes' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 50-TOOL ENGINE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ToolsExplorer initialToolId={activeTool} onSelectTool={setActiveTool} />
      </section>

      {/* 🎯 NATIVE BANNER AD — Natural content break ke baad */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdsterraBanner slot="native_banner" className="my-8" />
      </section>

      {/* TRACK APPLICATION & ASSISTED REQUEST DUAL PANEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-850 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">
                <Clock className="w-3.5 h-3.5" /> Live Status Tracker
              </div>
              <h3 className="text-xl font-bold">Track Application / Service Status</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your Token Number (e.g. <span className="text-amber-400 font-mono font-bold">999-2026-8801</span>) or 10-digit registered mobile number.
              </p>

              <form onSubmit={handleTrackSubmit} className="pt-2 space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                    placeholder="Token No or Mobile No..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Check Real-Time Status
                </button>
              </form>
            </div>

            {trackSearched && (
              <div className="pt-4 border-t border-slate-800">
                {trackedOrder ? (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-400">
                        {trackedOrder.tokenNumber}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          trackedOrder.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : trackedOrder.status === 'processing'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {trackedOrder.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="font-bold text-white">{trackedOrder.serviceName}</div>
                      <div className="text-slate-400 text-[11px]">Applicant: {trackedOrder.customerName}</div>
                      {trackedOrder.vleCenterName && (
                        <div className="text-slate-400 text-[11px]">Center: {trackedOrder.vleCenterName}</div>
                      )}
                      {trackedOrder.notes && (
                        <div className="text-amber-300/80 text-[11px] pt-1">Update: {trackedOrder.notes}</div>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                      <span className="text-emerald-400">1. Submitted</span>
                      <span className={trackedOrder.status !== 'pending' ? 'text-emerald-400' : 'text-slate-600'}>
                        2. Verified
                      </span>
                      <span className={trackedOrder.status === 'completed' ? 'text-emerald-400' : 'text-slate-600'}>
                        3. Ready
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-rose-400">
                    No active record found for "{trackQuery}". Please re-check token or mobile number.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> Direct VLE Form Filing Assistance
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-2">Need Help with Government Online Forms?</h3>
              <p className="text-xs text-slate-500">
                Submit your request directly to 999tools CSC VLE partner network. An authorized operator will process your application.
              </p>
            </div>

            {reqSuccessToken && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">Application Registered Successfully!</div>
                  <span>Your Token ID is <strong className="font-mono">{reqSuccessToken}</strong>. Keep this saved for tracking.</span>
                </div>
              </div>
            )}

            <form onSubmit={handlePublicRequestSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">1. Select Service Required:</label>
                <select
                  value={reqServiceId}
                  onChange={(e) => setReqServiceId(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
                >
                  {services
                    .filter((s) => s.enabled && s.category !== 'photo_tools')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Estimated Fee: ₹{s.userPrice})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700">2. Applicant Name:</label>
                  <input
                    type="text"
                    required
                    value={reqCustomerName}
                    onChange={(e) => setReqCustomerName(e.target.value)}
                    placeholder="Full legal name as on Aadhaar"
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">3. Contact Mobile Number:</label>
                  <input
                    type="text"
                    required
                    value={reqMobile}
                    onChange={(e) => setReqMobile(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">4. Details / Remarks:</label>
                <textarea
                  rows={2}
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="e.g. Need urgent PAN card correction, father name update, DOB change"
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" /> Submit Application Request
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 🎯 SECOND NATIVE BANNER — Government Portals section ke pehle */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdsterraBanner slot="native_banner" />
      </section>

      {/* GOVERNMENT OFFICIAL PORTAL DIRECTORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Official Central & State Government Portals
            </h2>
            <p className="text-xs text-slate-500">
              Direct official links to UIDAI, NSDL, Parivahan, PM Kisan, NVSP, and Sarkari Result.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(importantLinks || []).filter((l) => l.active !== false).map((link) => (
            <a
              key={link.id || link.title}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                    {link.badge}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{link.title}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{link.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition">
                Open Official Portal <ArrowRight className="w-3 h-3" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-bold text-slate-800">{siteConfig.siteName}</span> • {siteConfig.tagline}
        </div>
        <div className="flex items-center gap-4">
          <span>Toll-Free Helpline: {siteConfig.supportPhone}</span>
          <span>•</span>
          <span>WhatsApp: {siteConfig.supportWhatsApp}</span>
        </div>
      </footer>
    </div>
  );
};
