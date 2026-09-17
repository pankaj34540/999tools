import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { OwnerPortal } from '../components/owner/OwnerPortal';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export const OwnerPage: React.FC = () => {
  const { setRole, ownerAuthenticated } = useApp();

  useEffect(() => {
    setRole('owner');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 px-4 py-3 border-b border-amber-500/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                🔒 Secure Owner Route
              </div>
              <div className="text-xs text-slate-300 font-mono">
                tools999.store/owner
              </div>
            </div>
          </div>

          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public Site</span>
          </Link>
        </div>
      </div>

      <main className="pb-8">
        <OwnerPortal />
      </main>

      {ownerAuthenticated && (
        <div className="fixed bottom-4 right-4 bg-slate-950/95 backdrop-blur-md border border-amber-500/30 px-3 py-2 rounded-full shadow-2xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
            Owner Session Active
          </span>
        </div>
      )}
    </div>
  );
};
