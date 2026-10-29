import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Home, ArrowRight, ShieldCheck } from 'lucide-react';

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order_id') || 'N/A';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl max-w-md w-full p-8 text-center space-y-6">
        
        {/* Success Icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center border-4 border-emerald-500/30">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Payment Successful! 🎉</h1>
          <p className="text-slate-400 text-sm">Your E SUVIDHA account is ready.</p>
        </div>

        {/* Order Details */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-left space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Order ID</span>
            <span className="text-xs font-mono font-bold text-white">{orderId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Amount Paid</span>
            <span className="text-sm font-black text-emerald-400">₹139</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Status</span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">PAID</span>
          </div>
        </div>

        {/* Info Note */}
        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-200 flex gap-2">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="text-left">
            Aapka account ready hai. Ab E SUVIDHA Login page pe jaakar apne Email aur Password se login karein.
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={() => navigate('/e-suvidha')}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
        >
          Go to E SUVIDHA Login
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Home Button */}
        <button
          onClick={() => navigate('/')}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </button>

      </div>
    </div>
  );
};

export default PaymentSuccessPage;
