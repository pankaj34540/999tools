import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { MarqueeNotice } from './components/common/MarqueeNotice';
import { UserPortal } from './components/user/UserPortal';
import { VlePortal } from './components/vle/VlePortal';
import { OwnerPortal } from './components/owner/OwnerPortal';
import { AdsterraBanner, SocialBarInjector } from './components/common/AdsterraBanner';
import { 
  User, 
  Store, 
  Crown, 
  CheckCircle2
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { role, setRole, notification, showNotification } = useApp();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* 🎯 Social Bar — Global injection (once per session) */}
      <SocialBarInjector />

      <Header />
      <MarqueeNotice />

      {/* 🎯 Header Banner Ad — 728x90 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <AdsterraBanner slot="header" />
      </div>

      <main className="flex-1">
        {role === 'user' && <UserPortal />}
        {role === 'vle' && <VlePortal />}
        {role === 'owner' && <OwnerPortal />}
      </main>

      {/* 🎯 Sidebar Banner Ad — 160x600 (footer placement for mobile-friendly) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdsterraBanner slot="sidebar" />
      </div>

      {/* Floating Bottom Portal Switcher */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5 sm:gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 hidden sm:inline">
          Portals:
        </span>

        <button
          id="dock-btn-user"
          onClick={() => {
            setRole('user');
            showNotification('Switched to Public User Panel');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
            role === 'user'
              ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>User Panel</span>
        </button>

        <button
          id="dock-btn-vle"
          onClick={() => {
            setRole('vle');
            showNotification('Switched to CSC VLE / Cyber Cafe Portal');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
            role === 'vle'
              ? 'bg-blue-600 text-white shadow-md scale-105'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>CSC VLE Portal</span>
        </button>

        <button
          id="dock-btn-owner"
          onClick={() => {
            setRole('owner');
            showNotification('👑 Switched to Master Owner Panel');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
            role === 'owner'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
              : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-amber-300" />
          <span>Owner Panel</span>
        </button>
      </div>

      {/* Global Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white border border-amber-500/40 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
