import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Home, ArrowRight, ShieldCheck, Loader2, AlertCircle, Wallet } from 'lucide-react';
import { doc, updateDoc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order_id') || '';
  
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [paymentType, setPaymentType] = useState<'esuvidha' | 'wallet' | 'unknown'>('unknown');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderId) {
        setErrorMsg('Order ID not found in URL');
        setVerifying(false);
        return;
      }

      try {
        // 1. Cashfree se status check karo
        const res = await fetch('/api/cashfree-verify-esuvidha-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });

        const data = await res.json();

        if (!data.success || data.status !== 'paid') {
          setErrorMsg(data.error || `Payment status: ${data.status}. Please wait.`);
          setVerifying(false);
          return;
        }

        // 2. Determine Payment Type
        if (orderId.startsWith('ESUVIDHA_')) {
          // E SUVIDHA Registration
          setPaymentType('esuvidha');
          
          const appsSnap = await db
            .collection('vleApplications')
            .where('cashfreeOrderId', '==', orderId)
            .limit(1)
            .get();

          if (!appsSnap.empty) {
            const appDoc = appsSnap.docs[0];
            const appData = appDoc.data();

            await appDoc.ref.update({
              paymentStatus: 'paid',
              status: 'approved',
              webhookReceivedAt: new Date().toISOString(),
            });

            if (appData.userId) {
              await updateDoc(doc(db, 'userAccounts', appData.userId), {
                eSuvidhaAccess: true,
                eSuvidhaPaidAt: new Date().toISOString(),
                subscriptionStatus: 'active',
              });
            }
          }
        } else if (orderId.startsWith('WALLET_')) {
          // Wallet Recharge
          setPaymentType('wallet');

          // Find wallet order
          const walletOrderRef = doc(db, 'walletOrders', orderId);
          const walletSnap = await getDoc(walletOrderRef);
          
          if (walletSnap.exists()) {
            const walletData = walletSnap.data();
            const userId = walletData.userId;
            const amount = walletData.amount;

            // Check if already processed (idempotency)
            if (walletData.status === 'completed') {
              setVerified(true);
              setVerifying(false);
              return;
            }

            // Update User Wallet Balance
            const userRef = doc(db, 'userAccounts', userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              const currentBalance = userSnap.data().walletBalance || 0;
              const newBalance = currentBalance + amount;
              
              await updateDoc(userRef, { walletBalance: newBalance });

              // Add Transaction Record
              await addDoc(collection(db, 'walletTransactions'), {
                userId,
                type: 'credit',
                amount,
                description: `Wallet Recharge (${orderId})`,
                createdAt: new Date().toISOString(),
              });
            }

            // Mark order as completed
            await updateDoc(walletOrderRef, { status: 'completed' });
          }
        }

        setVerified(true);
      } catch (err: any) {
        console.error('Verification error:', err);
        setErrorMsg('Verification failed. Contact support.');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [orderId]);

  const handleContinue = () => {
    if (paymentType === 'wallet') {
      // Wallet ka case hai, toh wapas E SUVIDHA pe bhejo (wallet tab)
      navigate('/e-suvidha');
    } else {
      // E SUVIDHA ka case hai, toh login pe bhejo
      navigate('/e-suvidha');
    }
  };

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
              {paymentType === 'wallet' ? (
                <Wallet className="w-10 h-10 text-emerald-400" />
              ) : (
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black text-white mb-2">
                {paymentType === 'wallet' ? 'Money Added! 💰' : 'Payment Successful! 🎉'}
              </h1>
              <p className="text-slate-400 text-sm">
                {paymentType === 'wallet' 
                  ? 'Wallet recharge successful. Balance updated.' 
                  : 'Your E SUVIDHA account is ready.'}
              </p>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-left space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Order ID</span>
                <span className="text-xs font-mono font-bold text-white truncate ml-2">{orderId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Status</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">PAID</span>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              {paymentType === 'wallet' ? 'Go to Wallet' : 'Go to E SUVIDHA Login'}
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

        {/* Home Button */}
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
