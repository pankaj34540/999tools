import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { MarqueeNotice } from '../components/common/MarqueeNotice';
import { UserPortal } from '../components/user/UserPortal';
import { VlePortal } from '../components/vle/VlePortal';
import { AdsterraBanner, SocialBarInjector } from '../components/common/AdsterraBanner';
import { User, Store } from 'lucide-react';

export const PublicPage: React.FC = () => {
  const { role, setRole, showNotification } = useApp();

  useEffect(() => {
    if (role === 'owner') setRole('user');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      <SocialBarInjector />
      <Header />
      <MarqueeNotice />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <AdsterraBanner slot="header" />
      </div>

      <main className="flex-1">
        {role === 'vle' ? <VlePortal /> : <UserPortal />}
      </main>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5 sm:gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 hidden sm:inline">
          Portals:
        </span>

        <button
          onClick={() => {
            setRole('user');
            showNotification('Switched to Public User Panel');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
            role === 'user' || role !== 'vle'
              ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>User Panel</span>
        </button>

        <button
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
      </div>
    </div>
  );
};
