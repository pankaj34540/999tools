import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ESuvidhaPortal from '../components/esuvidha/ESuvidhaPortal';
import { Lock, Mail, KeyRound, Loader2, ArrowRight, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const MAX_ATTEMPTS = 3;
const LOCK_TIME = 15 * 60 * 1000; // 15 mins in ms
const STORAGE_KEY = 'esuvidha_login_attempts';

const ESuvidhaPage: React.FC = () => {
  const { currentUser, setCurrentUser, showNotification } = useApp();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const getAttempts = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return { count: 0, lastAttempt: 0 };
    return JSON.parse(data);
  };

  const setAttempts = (count: number) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ count, lastAttempt: Date.now() }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { count, lastAttempt } = getAttempts();
    
    // 🔥 CHECK LOCK
    if (count >= MAX_ATTEMPTS && Date.now() - lastAttempt < LOCK_TIME) {
      const remaining = Math.ceil((LOCK_TIME - (Date.now() - lastAttempt)) / 60000);
      setErrorMsg(`🔒 Account locked. Try again in ${remaining} minutes.`);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    
    try {
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      const user = userCred.user;

      const userRef = doc(db, 'userAccounts', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setCurrentUser({
          id: user.uid,
          email: user.email || '',
          ...userData
        });
        // Reset attempts on success
        localStorage.removeItem(STORAGE_KEY);
        showNotification('✅ Login Successful!');
      } else {
        setErrorMsg('❌ User data not found.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Increment attempts
      setAttempts(count + 1);

      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setErrorMsg(`❌ Galat Email ya Password. Attempts left: ${MAX_ATTEMPTS - count - 1}`);
      } else if (err.code === 'auth/user-not-found') {
        setErrorMsg('❌ Ye email registered nahi hai. Pehle register karein.');
      } else {
        setErrorMsg('❌ Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMsg('❌ Pehle apna email daalein.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
      showNotification('✅ Password reset link aapke email pe bheja gaya hai.');
    } catch (err: any) {
      console.error('Reset error:', err);
      setErrorMsg(err.message || '❌ Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Login Page
  if (!currentUser) {
    const { count, lastAttempt } = getAttempts();
    const isLocked = count >= MAX_ATTEMPTS && Date.now() - lastAttempt < LOCK_TIME;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">E SUVIDHA Login</h1>
            <p className="text-sm text-slate-500">Enter your credentials</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  disabled={isLocked}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  disabled={isLocked}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-lg border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {resetSent && (
              <div className="bg-emerald-50 text-emerald-700 text-xs p-3 rounded-lg border border-emerald-200">
                ✅ Reset link sent! Check your email.
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? 'Logging in...' : 'Login to E SUVIDHA'}
            </button>
          </form>

          <div className="flex items-center justify-between mt-6 text-xs">
            <button onClick={handleForgotPassword} className="text-blue-600 font-bold hover:underline">
              Forgot Password?
            </button>
            <span className="text-slate-500">
              Don't have an account? <a href="/" className="text-blue-600 font-bold hover:underline">Register</a>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Payment Pending
  if (!currentUser.eSuvidhaAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Payment Pending</h1>
          <p className="text-slate-500 mb-6">Aapka registration complete nahi hua hai. Kripya payment complete karein.</p>
          <a href="/" className="block w-full py-3 bg-blue-600 text-white font-bold rounded-xl">
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  // 3. Dashboard
  return <ESuvidhaPortal />;
};

export default ESuvidhaPage;
