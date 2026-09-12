import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Lock, Key, AlertTriangle, Eye, EyeOff, ArrowRight, Mail } from 'lucide-react';
import { loginOwner, OWNER_EMAIL_CONST } from '../../services/firebaseAuth';

export const OwnerSecurityGate: React.FC = () => {
  const { showNotification } = useApp();
  const [email, setEmail] = useState(OWNER_EMAIL_CONST);
  const [password, setPassword] = useState('');
  const [showText, setShowText] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  const isLocked = lockedUntil ? Date.now() < lockedUntil : false;
  const remainingSecs = isLocked ? Math.ceil((lockedUntil! - Date.now()) / 1000) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Email aur Password dono daalo');
      return;
    }

    if (isLocked) {
      setErrorMsg(`Lockout active! Wait ${remainingSecs}s.`);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const result = await loginOwner(email.trim(), password);

    if (result.success) {
      showNotification('👑 Owner authenticated successfully!');
      setErrorMsg('');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setErrorMsg(result.error || 'Login failed');

      // 5 galat attempts = 60 sec lockout
      if (newAttempts >= 5) {
        setLockedUntil(Date.now() + 60 * 1000);
        setAttempts(0);
      }
    }

    setLoading(false);
    setPassword('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600 mb-4 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            🔒 Firebase Secure Login
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Owner Portal Authentication
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Google Firebase se protected. Sirf authorized Owner hi access kar sakta hai.
          </p>
        </div>

        {isLocked && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start gap-3 mb-6 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Security Lockout Active!</p>
              <p className="mt-0.5 text-rose-700">
                Bahut zyada galat attempts. Please wait{' '}
                <span className="font-black text-rose-900">{remainingSecs}s</span>.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Owner Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg('');
                }}
                disabled={isLocked || loading}
                placeholder="owner@example.com"
                className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Master Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showText ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                disabled={isLocked || loading}
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowText(!showText)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={isLocked || loading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-sm font-bold shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span>{loading ? 'Verifying...' : 'Unlock Master Control Panel'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50 -mx-8 -mb-8 p-6 rounded-b-3xl">
          <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-800">Firebase Protected</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Ye login Google Firebase se secure hai. Password Firebase ke servers pe encrypted save hota hai. 
            <strong className="text-slate-700"> Koi bhi F12 se bypass nahi kar sakta.</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
