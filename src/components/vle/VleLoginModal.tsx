import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Lock, 
  Key, 
  Store, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface VleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
}

export const VleLoginModal: React.FC<VleLoginModalProps> = ({ isOpen, onClose, onOpenRegister }) => {
  const { vleLogin, vles, showNotification } = useApp();
  const [operatorId, setOperatorId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorId.trim()) {
      setErrorMsg('Please enter your Operator ID or Email');
      return;
    }

    const success = vleLogin(operatorId.trim(), password.trim() || undefined);
    if (success) {
      setErrorMsg('');
      onClose();
    } else {
      setErrorMsg('Invalid Operator ID or Password.');
    }
  };

  const handleDemoLogin = (vleId: string, pass: string) => {
    setOperatorId(vleId);
    setPassword(pass);
    const success = vleLogin(vleId, pass);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">VLE Operator Login</h3>
              <p className="text-xs text-slate-500">Sign in to your Cyber Cafe Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Operator ID / Email / Mobile *
            </label>
            <input
              type="text"
              required
              value={operatorId}
              onChange={(e) => {
                setOperatorId(e.target.value);
                setErrorMsg('');
              }}
              placeholder="e.g. VLE-999-1001 or registered email"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Password *</span>
              <span className="text-[10px] text-slate-400">Default: Cyber#1234 or pass123</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
          >
            <span>Login to VLE Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Register CTA */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Don't have a VLE ID yet?
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenRegister();
            }}
            className="mt-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline inline-flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Apply for One-Time Lifetime Registration (₹299)</span>
          </button>
        </div>

        {/* Quick Demo Switcher */}
        {vles.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-3xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
              Quick Test Operators:
            </span>
            <div className="space-y-1.5">
              {vles.slice(0, 2).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleDemoLogin(v.vleId, v.password || 'pass123')}
                  className="w-full text-left px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-[11px] flex items-center justify-between group transition"
                >
                  <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                    {v.centerName}
                  </span>
                  <span className="font-mono text-blue-600 font-bold group-hover:underline">
                    {v.vleId}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
