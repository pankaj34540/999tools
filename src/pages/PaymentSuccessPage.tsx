import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Home, ArrowRight, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order_id') || '';
  
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 🔥 Page load hote hi verify karo
  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderId) {
        setErrorMsg('Order ID not found in URL');
        setVerifying(false);
        return;
      }

      try {
        const res = await fetch('/api/cashfree-verify-esuvidha-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });

        const data = await res.json();

        if (data.success && data.status === 'paid') {
          setVerified(true);
        } else if (data.success && data.status !== 'paid') {
          setErrorMsg(`Payment status: ${data.status}. Please wait or contact support.`);
        } else {
          setErrorMsg(data.error || 'Verification failed');
        }
      } catch (err: any) {
        setErrorMsg('Failed to verify payment. Contact support.');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl max-w-md w-full p-8 text-center space-y-6">
        
        {/* Loading State */}
        {verifying && (
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center border-4 border-blue-500/30">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white mb-2">Verifying Payment...</h1>
              <p className="text-slate-400 text-sm">Please wait while we confirm your payment.</p>
            </div>
          </>
        )}

        {/* Success State */}
        {!verifying && verified && (
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center border-4 border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white mb-2">Payment Successful! 🎉</h1>
              <p className="text-slate-400 text-sm">Your E SUVIDHA account is ready.</p>
            </div>

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

            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-200 flex gap-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                Aapka account ready hai. Ab E SUVIDHA Login page pe jaakar apne Email aur Password se login karein.
              </div>
            </div>

            <button
              onClick={() => navigate('/e-suvidha')}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              Go to E SUVIDHA Login
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Error State */}
        {!verifying && !verified && (
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-rose-500/20 flex items-center justify-center border-4 border-rose-500/30">
              <AlertCircle className="w-10 h-10 text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white mb-2">Verification Issue</h1>
              <p className="text-slate-400 text-sm">{errorMsg}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
            >
              Retry Verification
            </button>
          </>
        )}

        {/* Home Button (Always Available) */}
        {!verifying && (
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
