import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { AdminLogin } from '../components/admin/AdminLogin';
import { AdminPortal } from '../components/admin/AdminPortal';
import { Staff } from '../types';
import { subscribeToStaffAuth } from '../services/staffService';

export const AdminPage: React.FC = () => {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔄 Listen to Firebase Auth state
    const unsub = subscribeToStaffAuth((s) => {
      setStaff(s);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-bold">Verifying access...</p>
        </div>
      </div>
    );
  }

  // ── Not logged in — show login ──
  if (!staff) {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              🔒 Admin Access Route
            </div>
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
        <AdminLogin onLoginSuccess={(s) => setStaff(s)} />
      </div>
    );
  }

  // ── Logged in — show portal ──
  return (
    <AdminPortal
      staff={staff}
      onLogout={() => setStaff(null)}
    />
  );
};
