import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useApp } from '../../context/AppContext';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login' 
}) => {
  const { createOrUpdateUserAccount, showNotification } = useApp();
  
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setMobile('');
    setErrorMsg('');
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Email aur Password daalo');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Firebase login
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;

      // Save user account in Firestore
      await createOrUpdateUserAccount({
        id: user.uid,
        email: user.email || email,
        name: user.displayName || email.split('@')[0],
        mobile: user.phoneNumber || undefined,
      });

      setSuccess(true);
      showNotification('✅ Login successful!');
      
      setTimeout(() => {
        handleClose();
      }, 1000);

    } catch (error: any) {
      console.error('Login error:', error.code);
      
      let msg = 'Login failed';
      switch (error.code) {
        case 'auth/user-not-found':
          msg = 'Yeh email registered nahi hai. Pehle signup karo.';
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          msg = 'Password galat hai!';
          break;
        case 'auth/too-many-requests':
          msg = 'Bahut zyada attempts! Thodi der baad try karo.';
          break;
        case 'auth/invalid-email':
          msg = 'Invalid email format';
          break;
        case 'auth/network-request-failed':
          msg = 'Internet connection check karo';
          break;
        default:
          msg = error.message || 'Kuch galat ho gaya';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) { setErrorMsg('Naam daalo'); return; }
    if (!email.trim()) { setErrorMsg('Email daalo'); return; }
    if (password.length < 6) { setErrorMsg('Password kam se kam 6 characters ka hona chahiye'); return; }

    setLoading(true);
    setErrorMsg('');

    try {
      // Check if trying to signup with owner email
      if (email.trim().toLowerCase() === 'pdas966846@gmail.com') {
        setErrorMsg('Yeh email Owner account ka hai. Owner Panel se login karo.');
        setLoading(false);
        return;
      }

      // Firebase signup
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;

      // Update display name
      await updateProfile(user, { displayName: name.trim() });

      // Save user account in Firestore
      await createOrUpdateUserAccount({
        id: user.uid,
        email: user.email || email,
        name: name.trim(),
        mobile: mobile.trim() || undefined,
        plan: 'free',
        subscriptionStatus: 'active',
      });

      setSuccess(true);
      showNotification('🎉 Account ban gaya! Welcome to 999tools!');
      
      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (error: any) {
      console.error('Signup error:', error.code);
      
      let msg = 'Signup failed';
      switch (error.code) {
        case 'auth/email-already-in-use':
          msg = 'Yeh email already registered hai. Login karo.';
          break;
        case 'auth/invalid-email':
          msg = 'Invalid email format';
          break;
        case 'auth/weak-password':
          msg = 'Password kamzor hai (min 6 characters)';
          break;
        case 'auth/network-request-failed':
          msg = 'Internet connection check karo';
          break;
        default:
          msg = error.message || 'Kuch galat ho gaya';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <User className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {mode === 'login' ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login' 
              ? '999tools account mein login karo' 
              : 'Free account banao — 700+ tools unlock karo'}
          </p>
        </div>

        {/* Success State */}
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {mode === 'login' ? 'Login Successful!' : 'Account Created!'}
            </h3>
            <p className="text-xs text-slate-500">
              {mode === 'login' ? 'Redirecting...' : 'Welcome to 999tools!'}
            </p>
          </div>
        ) : (
          <>
            {/* Mode Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                  mode === 'login' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                  mode === 'signup' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600'
                }`}
              >
                Signup (Free)
              </button>
            </div>

            {/* Form */}
            <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-3">
              
              {/* Name Field (Signup only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setErrorMsg(''); }}
                      disabled={loading}
                      placeholder="Aapka naam"
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-50"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                    disabled={loading}
                    placeholder="your@email.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Mobile (Signup only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => { setMobile(e.target.value); setErrorMsg(''); }}
                      disabled={loading}
                      placeholder="10-digit mobile"
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-50"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                    disabled={loading}
                    placeholder={mode === 'signup' ? 'Min 6 characters' : 'Password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-50"
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

              {/* Error */}
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-700 font-semibold">{errorMsg}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{mode === 'login' ? 'Logging in...' : 'Creating account...'}</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Login' : 'Create Free Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Benefits (Signup only) */}
            {mode === 'signup' && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-start gap-2 text-[11px] text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-slate-800">100% Free account.</strong> 700+ tools unlimited + 299 premium tools (3 uses/day). Upgrade anytime for unlimited access.
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-500">
                {mode === 'login' ? (
                  <>
                    Account nahi hai?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setErrorMsg(''); }}
                      className="font-bold text-amber-600 hover:underline"
                    >
                      Signup karo
                    </button>
                  </>
                ) : (
                  <>
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setErrorMsg(''); }}
                      className="font-bold text-amber-600 hover:underline"
                    >
                      Login karo
                    </button>
                  </>
                )}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
