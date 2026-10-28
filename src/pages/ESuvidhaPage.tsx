import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ESuvidhaPortal from '../components/esuvidha/ESuvidhaPortal';
import { Lock, Mail, KeyRound, Loader2, ArrowRight, ShieldCheck, CreditCard, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

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

      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        // 3. Set Current User in Context
        setCurrentUser({
          id: user.uid,
          email: user.email || '',
          name: userData.name || '',
          mobile: userData.mobile || '',
          plan: userData.plan || 'free',
          subscriptionStatus: userData.subscriptionStatus || 'active',
          eSuvidhaAccess: userData.eSuvidhaAccess || false,
          vleData: userData.vleData,
          createdAt: userData.createdAt || new Date().toISOString(),
          ...userData
        });

        showNotification('✅ Login Successful!');
      } else {
        setErrorMsg('❌ User data not found in database.');
      }
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

  // 2. Payment Page
  if (!currentUser.eSuvidhaAccess) {
    const handlePayment = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await updateDoc(doc(db, 'userAccounts', currentUser.id), {
          eSuvidhaAccess: true,
          eSuvidhaPaidAt: new Date().toISOString()
        });
        setCurrentUser({ ...currentUser, eSuvidhaAccess: true });
        showNotification('✅ Payment successful! Welcome to E SUVIDHA.');
      } catch (err) {
        showNotification('❌ Payment failed. Try again.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-center text-white">
             <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
               <ShieldCheck className="w-8 h-8 text-white" />
             </div>
             <h1 className="text-3xl font-black mb-2">E SUVIDHA</h1>
             <p className="text-blue-100 font-semibold">One-Time Registration Portal</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="text-center">
              <div className="text-5xl font-black text-slate-900 mb-2">₹139</div>
              <p className="text-sm text-slate-500 font-medium">One-Time Fee (Lifetime Access)</p>
            </div>
            <ul className="space-y-3 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <li className="flex gap-2"><span className="text-emerald-500 font-bold">✔</span> Lifetime Access</li>
              <li className="flex gap-2"><span className="text-emerald-500 font-bold">✔</span> All Government Services</li>
              <li className="flex gap-2"><span className="text-emerald-500 font-bold">✔</span> Paid Tools & Free Tools</li>
              <li className="flex gap-2"><span className="text-emerald-500 font-bold">✔</span> Wallet System</li>
            </ul>
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-lg rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
              {loading ? 'Processing...' : 'Pay ₹139 & Activate'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Dashboard
  return <ESuvidhaPortal />;
};

export default ESuvidhaPage;
