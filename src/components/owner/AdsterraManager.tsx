import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Megaphone, 
  Check, 
  ToggleLeft, 
  ToggleRight, 
  ExternalLink, 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle,
  Github,
  Clock,
  Monitor
} from 'lucide-react';
import { AdsterraConfig } from '../../types';

export const AdsterraManager: React.FC = () => {
  const { siteConfig, updateSiteConfig, showNotification } = useApp();

  const [form, setForm] = useState<AdsterraConfig>(() => {
    return (
      siteConfig.adsterra || {
        enabled: true,
        headerBannerActive: true,
        toolBannerActive: true,
        sidebarAdActive: false,
        nativeBannerActive: true,
        socialBarActive: false,
        directLinkActive: false,
        directLinkUrl: '',
        directLinkFrequency: 2,
        testMode: true,
        toolSidebarActive: true,
        downloadPopupActive: true,
      }
    );
  });

  const [activeTab, setActiveTab] = useState<'banners' | 'direct_link' | 'social_bar' | 'guide'>('banners');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteConfig({ adsterra: form });
    showNotification('✅ Ad settings saved!');
  };

  const handleToggle = (key: keyof AdsterraConfig) => {
    setForm((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-amber-200 animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight">Adsterra Monetization Hub</h2>
            <span className="bg-white/20 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Owner Controlled
            </span>
          </div>
          <p className="text-xs text-amber-100 mt-1 max-w-xl">
            Sirf ads ON/OFF karo. Ad codes GitHub mein <code className="bg-black/30 px-1.5 py-0.5 rounded">src/data/adSlots.ts</code> file mein hain.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-black/25 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
          <span className="text-xs font-bold text-white">Master Ad Status:</span>
          <button
            type="button"
            onClick={() => handleToggle('enabled')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition ${
              form.enabled ? 'bg-emerald-400 text-slate-950' : 'bg-slate-700 text-white'
            }`}
          >
            {form.enabled ? (
              <>
                <ToggleRight className="w-4 h-4 text-slate-950" />
                <span>ADS ACTIVE</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-slate-400" />
                <span>ALL ADS PAUSED</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* GitHub Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Github className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900">
          <div className="font-bold mb-1">📝 Ad Codes GitHub Mein Hain</div>
          <div className="text-blue-700 leading-relaxed">
            Adsterra ke saare ad codes ab <code className="bg-blue-100 px-1.5 py-0.5 rounded font-bold">src/data/adSlots.ts</code> file mein hain.
            Yahan se sirf <strong>ON/OFF</strong> karo. Code change karne ke liye GitHub file edit karke commit karo.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('banners')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'banners'
              ? 'border-amber-600 text-amber-800 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Display Banners & Popups</span>
        </button>

        <button
          onClick={() => setActiveTab('direct_link')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'direct_link'
              ? 'border-amber-600 text-amber-800 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ExternalLink className="w-4 h-4" />
          <span>Popunder / Direct Link</span>
        </button>

        <button
          onClick={() => setActiveTab('social_bar')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'social_bar'
              ? 'border-amber-600 text-amber-800 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Social Bar</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'guide'
              ? 'border-amber-600 text-amber-800 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Setup Guide</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: Banners */}
        {activeTab === 'banners' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Master Info Box */}
            <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
              <Monitor className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700">
                <div className="font-bold mb-0.5">🎯 Har Ad Ka ON/OFF Alag</div>
                <div className="text-slate-600">
                  Niche har slot ka toggle hai. Sirf toggle karke <strong>Save</strong> karo.
                </div>
              </div>
            </div>

            {/* Header Banner */}
            <AdToggleCard
              title="Header Leaderboard Banner"
              subtitle="Size: 728x90 — Top of page"
              githubKey="header"
              isActive={form.headerBannerActive}
              onToggle={() => handleToggle('headerBannerActive')}
            />

            {/* Tool In-Content Banner */}
            <AdToggleCard
              title="Tool Workspace Banner"
              subtitle="Size: 300x250 — Inside tool"
              githubKey="tool_banner"
              isActive={form.toolBannerActive}
              onToggle={() => handleToggle('toolBannerActive')}
            />

            {/* Native Banner */}
            <AdToggleCard
              title="Native Banner"
              subtitle="Native — In-content blend ad"
              githubKey="native_banner"
              isActive={form.nativeBannerActive}
              onToggle={() => handleToggle('nativeBannerActive')}
            />

            {/* Sidebar Banner */}
            <AdToggleCard
              title="Sidebar Banner"
              subtitle="Size: 160x600 — Global sidebar"
              githubKey="sidebar"
              isActive={form.sidebarAdActive}
              onToggle={() => handleToggle('sidebarAdActive')}
            />

            {/* 🆕 Tool Sidebar Ads (Left + Right) */}
            <AdToggleCard
              title="Tool Modal Sidebar Ads (Left + Right)"
              subtitle="Size: 160x600 — Desktop only"
              githubKey="tool_sidebar_left & tool_sidebar_right"
              isActive={form.toolSidebarActive}
              onToggle={() => handleToggle('toolSidebarActive')}
              isNew
            />

            {/* 🆕 Download Popup Ad */}
            <AdToggleCard
              title="Download Popup Ad"
              subtitle="Shown when free user clicks Download (5s wait)"
              githubKey="download_popup"
              isActive={form.downloadPopupActive}
              onToggle={() => handleToggle('downloadPopupActive')}
              isNew
              icon={Clock}
            />

          </div>
        )}

        {/* TAB 2: Direct Link (Optional) */}
        {activeTab === 'direct_link' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Adsterra Direct Link / Popunder (Optional)</h3>
                <p className="text-xs text-slate-500">
                  Yeh optional hai. Agar aggressive monetization nahi chahte toh skip karo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('directLinkActive')}
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  form.directLinkActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {form.directLinkActive ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Direct Link URL:
                </label>
                <input
                  type="url"
                  value={form.directLinkUrl}
                  onChange={(e) => setForm({ ...form, directLinkUrl: e.target.value })}
                  placeholder="https://www.profitablecpmrate.com/..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  ⚠️ Ye URL GitHub mein <code className="bg-slate-100 px-1 rounded">adSlots.ts</code> mein bhi daal sakte ho, ya yahan rakh sakte ho — dono kaam karega.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Trigger Frequency:
                </label>
                <select
                  value={form.directLinkFrequency}
                  onChange={(e) => setForm({ ...form, directLinkFrequency: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value={1}>Every Action</option>
                  <option value={2}>Every 2nd Action (Recommended)</option>
                  <option value={3}>Every 3rd Action</option>
                  <option value={5}>Every 5th Action</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Social Bar */}
        {activeTab === 'social_bar' && (
          <div className="space-y-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Adsterra Social Bar</h3>
                  <p className="text-xs text-slate-500">
                    Interactive notification badge — high CTR.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('socialBarActive')}
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    form.socialBarActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {form.socialBarActive ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                <strong>📌 Note:</strong> Social Bar ka script GitHub mein{' '}
                <code className="bg-blue-100 px-1.5 py-0.5 rounded">adSlots.ts</code> →{' '}
                <code className="bg-blue-100 px-1.5 py-0.5 rounded">social_bar.html</code> mein daalo.
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Setup Guide */}
        {activeTab === 'guide' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Adsterra Setup Guide — New System</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <h4 className="font-bold text-slate-900">GitHub File Open Karo</h4>
                <p className="text-slate-600 leading-relaxed">
                  GitHub repo → <code className="bg-white px-1 rounded">src/data/adSlots.ts</code> → Edit
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
                  2
                </span>
                <h4 className="font-bold text-slate-900">Adsterra Code Paste Karo</h4>
                <p className="text-slate-600 leading-relaxed">
                  Har slot ke <code className="bg-white px-1 rounded">html</code> field mein Adsterra ka code daalo
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
                  3
                </span>
                <h4 className="font-bold text-slate-900">Commit + Push</h4>
                <p className="text-slate-600 leading-relaxed">
                  Vercel auto-deploy karega (2-3 min). Code live ho jayega.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                  4
                </span>
                <h4 className="font-bold text-slate-900">Yahan Se Toggle Karo</h4>
                <p className="text-slate-600 leading-relaxed">
                  Is panel mein har ad slot ka ON/OFF karo. Save karo. Done!
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 mt-2">
              <div className="font-bold mb-1">✅ Kyun Ye Better Hai?</div>
              <ul className="space-y-1 text-emerald-800 list-disc list-inside">
                <li>Logout/login pe code gayab nahi hoga (Firestore bug fix)</li>
                <li>Version control — GitHub mein history rahegi</li>
                <li>Owner Panel simple — sirf ON/OFF</li>
                <li>Fast — Firestore read nahi karna padta</li>
              </ul>
            </div>
          </div>
        )}

        {/* Test Mode Toggle & Save Button */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.testMode}
              onChange={(e) => setForm({ ...form, testMode: e.target.checked })}
              className="w-4 h-4 text-amber-600 rounded-sm"
            />
            <span>Show placeholder if ad code empty (dev mode)</span>
          </label>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition"
          >
            <Check className="w-4 h-4" />
            <span>Save Ad Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

// ═══════════════════════════════════════════
// Helper: Reusable toggle card for ad slots
// ═══════════════════════════════════════════
interface AdToggleCardProps {
  title: string;
  subtitle: string;
  githubKey: string;
  isActive: boolean;
  onToggle: () => void;
  isNew?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

const AdToggleCard: React.FC<AdToggleCardProps> = ({
  title,
  subtitle,
  githubKey,
  isActive,
  onToggle,
  isNew,
  icon: Icon,
}) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {Icon && <Icon className="w-4 h-4 text-slate-500" />}
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            {isNew && (
              <span className="text-[9px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded">
                NEW
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
            isActive
              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          {isActive ? (
            <>
              <ToggleRight className="w-4 h-4" />
              <span>ON</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-4 h-4" />
              <span>OFF</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] text-slate-600">
        <div className="font-bold text-slate-500 uppercase tracking-wider mb-0.5">
          Code Location
        </div>
        <code className="text-slate-800 font-mono">adSlots.ts → {githubKey}</code>
      </div>
    </div>
  );
};
