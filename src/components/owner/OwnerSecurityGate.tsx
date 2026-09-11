import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Lock, Key, AlertTriangle, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';

export const OwnerSecurityGate: React.FC = () => {
  const { verifyOwnerAuth, ownerLockedUntil, siteConfig, showNotification } = useApp();
  const [inputVal, setInputVal] = useState('');
  const [showText, setShowText] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isLocked = ownerLockedUntil ? Date.now() < ownerLockedUntil : false;
  const remainingSecs = isLocked ? Math.ceil((ownerLockedUntil! - Date.now()) / 1000) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) {
      setErrorMsg('Please enter your Master PIN or Password');
      return;
    }

    if (isLocked) {
      setErrorMsg(`Security lockout in effect! Wait ${remainingSecs} seconds.`);
      return;
    }

    const success = verifyOwnerAuth(inputVal.trim());
    if (!success) {
      setErrorMsg('Invalid Master Security PIN or Password.');
      setInputVal('');
    } else {
      setErrorMsg('');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 sm:p-10 relative overflow-hidden">
        {/* Top Gold Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

        {/* Shield Icon Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600 mb-4 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            Master Admin Security Gate
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Owner Portal Authentication
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Enter your Master Security PIN or Master Password to access financial controls, ad codes & VLE credential dispatch.
          </p>
        </div>

        {/* Lockout Notification if Brute Forced */}
        {isLocked ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start gap-3 mb-6 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Security Lockout Active!</p>
              <p className="mt-0.5 text-rose-700">
                Too many incorrect attempts. For security protection, please wait{' '}
                <span className="font-black text-rose-900">{remainingSecs} seconds</span> before trying again.
              </p>
            </div>
          </div>
        ) : null}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Master Security PIN / Password</span>
              <span className="text-[10px] text-slate-400 font-normal">Default: 9999</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showText ? 'text' : 'password'}
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setErrorMsg('');
                }}
                disabled={isLocked}
                placeholder="Enter PIN (9999) or Password"
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
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
            <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={isLocked}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-sm font-bold shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span>Unlock Master Control Panel</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>
        </form>

        {/* Quick Demo Credentials Reminder Box */}
        <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50 -mx-8 -mb-8 p-6 rounded-b-3xl">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
            <span className="font-bold text-slate-800">Master Demo Key</span>
            <button
              type="button"
              onClick={() => {
                setInputVal('9999');
                setErrorMsg('');
              }}
              className="text-amber-600 hover:text-amber-700 font-bold hover:underline"
            >
              Auto-fill 9999
            </button>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Master PIN is set to <strong className="text-slate-800">9999</strong> (or password <strong className="text-slate-800">admin@999tools</strong>). You can change this to any custom private PIN inside the <strong className="text-slate-800">Settings</strong> tab after logging in.
          </p>
        </div>
      </div>
    </div>
  );
};
