import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Megaphone, 
  Check, 
  ToggleLeft, 
  ToggleRight, 
  ExternalLink, 
  Code, 
  Layers, 
  Sparkles, 
  Eye, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { AdsterraConfig } from '../../types';

export const AdsterraManager: React.FC = () => {
  const { siteConfig, updateSiteConfig, showNotification } = useApp();

  const [form, setForm] = useState<AdsterraConfig>(() => {
    return (
      siteConfig.adsterra || {
        enabled: true,
        headerBannerActive: true,
        headerBannerCode: '',
        toolBannerActive: true,
        toolBannerCode: '',
        sidebarAdActive: false,
        sidebarAdCode: '',
        directLinkActive: false,
        directLinkUrl: '',
        directLinkFrequency: 2,
        socialBarActive: false,
        socialBarCode: '',
        testMode: true,
      }
    );
  });

  const [activeTab, setActiveTab] = useState<'banners' | 'direct_link' | 'social_bar' | 'guide'>('banners');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteConfig({ adsterra: form });
    showNotification('Adsterra Ads Configuration successfully saved!');
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
            Control all advertising placements, banners, direct-link popunders, and social bars across 999tools. Turn ads ON or OFF with a single click.
          </p>
        </div>

        {/* Master Switch */}
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('banners')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'banners'
              ? 'border-amber-600 text-amber-800 bg-white shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Display Banners (Header & Tools)</span>
        </button>

        <button
          onClick={() => setActiveTab('direct_link')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'direct_link'
              ? 'border-amber-600 text-amber-800 bg-white shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ExternalLink className="w-4 h-4" />
          <span>Popunder / Direct Link (High RPM)</span>
        </button>

        <button
          onClick={() => setActiveTab('social_bar')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'social_bar'
              ? 'border-amber-600 text-amber-800 bg-white shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Social Bar / Push Notification Ad</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'guide'
              ? 'border-amber-600 text-amber-800 bg-white shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Adsterra Setup Guide</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: Banners */}
        {activeTab === 'banners' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Header Banner */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Header Leaderboard Banner</h3>
                  <p className="text-[11px] text-slate-500">Recommended size: 728x90 px or Responsive Banner</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('headerBannerActive')}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    form.headerBannerActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {form.headerBannerActive ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Adsterra Script / Iframe / HTML Code:
                </label>
                <textarea
                  rows={4}
                  value={form.headerBannerCode}
                  onChange={(e) => setForm({ ...form, headerBannerCode: e.target.value })}
                  placeholder={`<script type="text/javascript">
  atOptions = {
    'key' : 'your_adsterra_key',
    'format' : 'iframe',
    'height' : 90,
    'width' : 728,
    'params' : {}
  };
</script>
<script type="text/javascript" src="//www.topcreativeformat.com/your_adsterra_key/invoke.js"></script>`}
                  className="w-full font-mono text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                <span>Appears at the very top of the tools directory on all desktop & mobile screens.</span>
              </div>
            </div>

            {/* In-Tool Banner */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Inside Tool Workspace Banner</h3>
                  <p className="text-[11px] text-slate-500">Recommended size: 468x60 or 300x250 Medium Rectangle</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('toolBannerActive')}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    form.toolBannerActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {form.toolBannerActive ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Adsterra Script / HTML Code:
                </label>
                <textarea
                  rows={4}
                  value={form.toolBannerCode}
                  onChange={(e) => setForm({ ...form, toolBannerCode: e.target.value })}
                  placeholder={`<!-- Adsterra 300x250 or Native Banner Code -->
<script type="text/javascript">
  atOptions = {
    'key' : 'tool_banner_key',
    'format' : 'iframe',
    'height' : 250,
    'width' : 300
  };
</script>`}
                  className="w-full font-mono text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                <span>Displayed right below the main action / download buttons in tool modals.</span>
              </div>
            </div>

            {/* Sidebar Banner */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Sidebar / Sticky Banner Slot</h3>
                  <p className="text-[11px] text-slate-500">Recommended size: 160x600 or 300x250 Skyscraper</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('sidebarAdActive')}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    form.sidebarAdActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {form.sidebarAdActive ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Adsterra Script / HTML Code:
                </label>
                <textarea
                  rows={3}
                  value={form.sidebarAdCode}
                  onChange={(e) => setForm({ ...form, sidebarAdCode: e.target.value })}
                  placeholder="Paste sidebar Adsterra script here..."
                  className="w-full font-mono text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Direct Link / Popunder */}
        {activeTab === 'direct_link' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Adsterra Direct Link (Smartlink) / Popunder</h3>
                <p className="text-xs text-slate-500">
                  Adsterra Direct Link gives the highest CPM/RPM. It triggers in a new background tab when user downloads a photo sheet or calculates results.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('directLinkActive')}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                  form.directLinkActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {form.directLinkActive ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Your Adsterra Direct Link URL:
                </label>
                <input
                  type="url"
                  value={form.directLinkUrl}
                  onChange={(e) => setForm({ ...form, directLinkUrl: e.target.value })}
                  placeholder="https://www.profitablecpmrate.com/abcdefgh?key=123456"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Copy your direct link URL from Adsterra Publisher Dashboard → Direct Links → Get Link.
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
                  <option value={1}>Every Action / Download (100% Aggressive)</option>
                  <option value={2}>Every 2nd Download (Recommended Balanced)</option>
                  <option value={3}>Every 3rd Download (Friendly)</option>
                  <option value={5}>Every 5th Download (Ultra Low)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Prevents browser pop-up blocking while maximizing earnings.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Social Bar */}
        {activeTab === 'social_bar' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Adsterra Social Bar / In-Page Push</h3>
                <p className="text-xs text-slate-500">
                  Custom interactive notification badge that yields 20x to 30x higher CTR than traditional display banners.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('socialBarActive')}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                  form.socialBarActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {form.socialBarActive ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Social Bar Integration Script:
              </label>
              <textarea
                rows={5}
                value={form.socialBarCode}
                onChange={(e) => setForm({ ...form, socialBarCode: e.target.value })}
                placeholder={`<script type='text/javascript' src='//pl20000000.profitablecpmrate.com/socialbar.js'></script>`}
                className="w-full font-mono text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* TAB 4: Setup Guide */}
        {activeTab === 'guide' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>How to connect your Adsterra Publisher Account with 999tools</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <h4 className="font-bold text-slate-900">Add 999tools domain</h4>
                <p className="text-slate-600">
                  Log into your Adsterra publisher panel at <code>publishers.adsterra.com</code>. Click <strong>"Add Website"</strong> and enter your domain.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
                  2
                </span>
                <h4 className="font-bold text-slate-900">Generate Ad Units</h4>
                <p className="text-slate-600">
                  Create: <strong>728x90 Banner</strong>, <strong>300x250 Banner</strong>, <strong>Direct Link</strong>, and <strong>Social Bar</strong>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
                  3
                </span>
                <h4 className="font-bold text-slate-900">Paste & Save Here</h4>
                <p className="text-slate-600">
                  Paste the generated codes into the respective tabs above and click <strong>"Save All Ad Configurations"</strong>. Ads will go live instantly without redeployment!
                </p>
              </div>
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
            <span>Show Ad Preview Placeholders when actual Adsterra script is empty</span>
          </label>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition"
          >
            <Check className="w-4 h-4" />
            <span>Save All Ad Configurations</span>
          </button>
        </div>
      </form>
    </div>
  );
};
