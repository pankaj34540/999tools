import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ESuvidhaPortal from '../components/esuvidha/ESuvidhaPortal';
import { AlertCircle, Lock, ShieldCheck, CreditCard, Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const ESuvidhaPage: React.FC = () => {
  const { activeVle, vleLoggedIn, currentUser, showNotification } = useApp();
  const [loading, setLoading] = useState(false);

  // 1. Check Access
  const hasVleAccess = (activeVle && vleLoggedIn) || (currentUser?.plan === 'vle');
  const hasPaid = currentUser?.eSuvidhaAccess === true;

  if (!hasVleAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Login Required</h1>
          <p className="text-slate-500 mb-6">E SUVIDHA portal is only for registered VLE operators.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition"
          >
            Go to Home & Login
          </button>
        </div>
      </div>
    );
  }

  // 2. Payment Page (Agar eSuvidhaAccess false hai)
  if (!hasPaid) {
    const handlePayment = async () => {
      setLoading(true);
      try {
        // NOTE: Yahan Cashfree API call karni hai (Vercel Serverless Function).
        // Abhi ke liye hum direct success maan rahe hain testing ke liye.
        // Production mein, Cashfree se redirect karke webhook se update karenge.
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // Fake delay

        if (currentUser) {
          await updateDoc(doc(db, 'userAccounts', currentUser.id), {
            eSuvidhaAccess: true,
            eSuvidhaPaidAt: new Date().toISOString()
          });
          showNotification('✅ Payment successful! Welcome to E SUVIDHA.');
          window.location.reload(); // Reload to update state
        }
      } catch (err) {
        console.error(err);
        showNotification('❌ Payment failed. Try again.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-center text-white">
             <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
               <ShieldCheck className="w-8 h-8 text-white" />
             </div>
             <h1 className="text-3xl font-black mb-2">E SUVIDHA</h1>
             <p className="text-blue-100 font-semibold">One-Time Registration Portal</p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            <div className="text-center">
              <div className="text-5xl font-black text-slate-900 mb-2">₹139</div>
              <p className="text-sm text-slate-500 font-medium">One-Time Fee (Lifetime Access)</p>
            </div>

            <ul className="space-y-3 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <li className="flex gap-2"><span className="text-emerald-500 font-bold">✔</span> Lifetime Access to E SUVIDHA Dashboard</li>
              <li className="flex gap-2"><span className="text-emerald-500 font-bold">✔</span> All Government Services (PAN, Aadhaar, etc.)</li>
              <li className="flex gap-2"><span className="text-emerald-500 font-bold">✔</span> Paid Tools & Free Tools Access</li>
              <li className="flex gap-2"><span className="text-emerald-500 font-bold">✔</span> Wallet System for Transactions</li>
            </ul>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-lg rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
              {loading ? 'Processing...' : 'Pay ₹139 via Cashfree'}
            </button>
            
            <p className="text-center text-[10px] text-slate-400">
              100% Secure Payment. No hidden charges.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Main Dashboard
  return <ESuvidhaPortal />;
};

export default ESuvidhaPage;
