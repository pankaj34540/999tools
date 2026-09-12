import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Store, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles,
  ShieldCheck,
  Loader2
} from 'lucide-react';

interface VleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
}

export const VleLoginModal: React.FC<VleLoginModalProps> = ({ isOpen, onClose, onOpenRegister }) => {
  const { vleLogin, showNotification } = useApp();
  const [operatorId, setOperatorId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!operatorId.trim()) {
      setErrorMsg('Please enter your Operator ID or Email');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your Password');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const success = await vleLogin(operatorId.trim(), password.trim());
      if (success) {
        setErrorMsg('');
        setOperatorId('');
        setPassword('');
        onClose();
      } else {
        setErrorMsg('Login failed. Check your ID/Email and Password.');
      }
    } catch (error) {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Firebase Secured
              </p>
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
              Registered Email *
            </label>
            <input
              type="email"
              required
              value={operatorId}
              onChange={(e) => {
                setOperatorId(e.target.value);
                setErrorMsg('');
              }}
              disabled={loading}
              placeholder="e.g. yourname@gmail.com"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-900 disabled:bg-slate-50 disabled:opacity-60"
              autoComplete="email"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Jo email aapne registration mein diya tha
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                disabled={loading}
                placeholder="Enter your password"
                className="w-full px-3.5 py-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 disabled:bg-slate-50 disabled:opacity-60"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Password aapko Owner ne WhatsApp/Email pe bheja tha
            </p>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Login to VLE Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

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

        <div className="mt-5 pt-4 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-3xl">
          <div className="flex items-start gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-700">Firebase Protected Login.</strong> Aapka password Google Firebase ke servers pe encrypted save hai. Koi bhi hack ya bypass nahi kar sakta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
