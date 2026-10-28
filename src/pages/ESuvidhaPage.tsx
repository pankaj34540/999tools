import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ESuvidhaPortal from '../components/esuvidha/ESuvidhaPortal';
import { Lock, Mail, KeyRound, Loader2, ArrowRight, ShieldCheck, CreditCard, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

const ESuvidhaPage: React.FC = () => {
  const { currentUser, setCurrentUser, showNotification } = useApp();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Firebase Auth Login
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      const user = userCred.user;

      // 2. Fetch User Data from Firestore
      const userRef = doc(db, 'userAccounts', user.uid);
      const userSnap = await getDoc(userRef);

      let userData = null;

      if (userSnap.exists()) {
        userData = userSnap.data();
      } else {
        // 🔥 CRITICAL FIX: Agar Firestore mein nahi hai, toh naya banao
        userData = {
          id: user.uid,
          email: user.email,
          name: user.email?.split('@')[0] || 'E Suvidha User',
          plan: 'vle',
          subscriptionStatus: 'active',
          eSuvidhaAccess: true, // Default access true
          createdAt: new Date().toISOString(),
          vleData: {
             vleId: 'VLE-999-' + Math.floor(1000 + Math.random() * 9000),
             centerName: user.email?.split('@')[0] + ' Center',
             operatorName: user.email?.split('@')[0],
             mobile: '0000000000',
             state: 'Uttar Pradesh',
             district: 'Main Center',
             status: 'active',
             kycVerified: true,
             joinedDate: new Date().toISOString(),
             totalOrdersCompleted: 0
          }
        };
        await setDoc(userRef, userData);
      }

      // 3. Set Current User in Context
      setCurrentUser({
        ...userData,
        id: user.uid,
        eSuvidhaAccess: true // Force true for testing
      });

      showNotification('✅ Login Successful!');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setErrorMsg('❌ Galat Email ya Password. Check karein.');
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
      showNotification('✅ Password reset link aapke email pe bheja gaya hai.');
    } catch (err: any) {
      setErrorMsg('❌ Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Login Page
  if (!currentUser) {
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
              <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-lg border border-rose-200">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm"
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

  // 2. Dashboard (Agar login hai)
  return <ESuvidhaPortal />;
};

export default ESuvidhaPage;
