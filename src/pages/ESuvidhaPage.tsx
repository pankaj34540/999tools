import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ESuvidhaPortal from '../components/esuvidha/ESuvidhaPortal';
import { Lock, Mail, KeyRound, Loader2, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const ESuvidhaPage: React.FC = () => {
  const { currentUser, showNotification } = useApp();
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Payment State
  const [payLoading, setPayLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showNotification('✅ Login Successful!');
      // Page reload hoga aur dashboard dikhega
      window.location.reload();
    } catch (err: any) {
      setErrorMsg('Invalid email or password. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!currentUser) return;
    setPayLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await updateDoc(doc(db, 'userAccounts', currentUser.id), {
        eSuvidhaAccess: true,
        eSuvidhaPaidAt: new Date().toISOString()
      });
      showNotification('✅ Payment successful! Welcome to E SUVIDHA.');
      window.location.reload();
    } catch (err) {
      console.error(err);
      showNotification('❌ Payment failed. Try again.');
    } finally {
      setPayLoading(false);
    }
  };

  // 1. Agar User Login Hai (currentUser exists)
  if (currentUser) {
    // Agar payment nahi kiya (eSuvidhaAccess false)
    if (!currentUser.eSuvidhaAccess) {
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
                <li className="flex gap-2"><span className="text-emerald-500 font-bold">✔</span> Lifetime Access to E SUVIDHA Dashboard</li>
                <li className="flex gap-2"><span className="text-emerald-500 font-bold">✔</span> All Government Services</li>
                <li className="flex gap-2"><span className="text-emerald-500 font-bold">✔</span> Paid Tools & Free Tools</li>
                <li className="flex gap-2"><span className="text-emerald-500 font-bold">✔</span> Wallet System</li>
              </ul>
              <button
                onClick={handlePayment}
                disabled={payLoading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-lg rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {payLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                {payLoading ? 'Processing...' : 'Pay ₹139 via Cashfree'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Agar payment ho gaya hai, toh Dashboard dikhao
    return <ESuvidhaPortal />;
  }

  // 2. Agar Login Nahi Hai (Login Page)
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
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
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

        <div className="mt-6 text-center text-xs text-slate-500">
          Don't have an account? <a href="/" className="text-blue-600 font-bold hover:underline">Register Now</a>
        </div>
      </div>
    </div>
  );
};

export default ESuvidhaPage;
