import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Home } from 'lucide-react';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase'; // ⚠️ Path adjust karo agar alag hai

type Status = 'loading' | 'paid' | 'failed' | 'pending';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const [details, setDetails] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderSaved, setOrderSaved] = useState(false);

  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (!orderId) {
      setStatus('failed');
      setErrorMsg('No order ID in URL');
      return;
    }
    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const verifyPayment = async () => {
    try {
      const res = await fetch(`/api/cashfree-verify-order?order_id=${orderId}`);
      const data = await res.json();

      if (!res.ok) {
        setStatus('failed');
        setErrorMsg(data.error || 'Could not verify payment');
        return;
      }

      setDetails(data);

      if (data.status === 'PAID') {
        setStatus('paid');
        // Update Firestore document created by create-order API
        if (!orderSaved && orderId) {
          try {
            const orderRef = doc(db, 'serviceOrders', orderId);
            const snap = await getDoc(orderRef);

            if (snap.exists()) {
              const existing = snap.data();
              // Already paid by webhook? Skip
              if (existing?.paymentStatus === 'paid') {
                console.log('ℹ️ Already marked paid by webhook');
              } else {
                await updateDoc(orderRef, {
                  paymentStatus: 'paid',
                  paymentReference: orderId,
                  cashfreePaymentId: data.orderId || '',
                  ownerNotes: `Cashfree verified via success page. Payment ID: ${data.orderId}`,
                  updatedAt: new Date().toISOString(),
                });
                console.log('✅ Firestore order updated via success page');
              }
            } else {
              // Not found — create it
              await updateDoc(doc(db, 'serviceOrders', orderId), {}).catch(() => {});
              console.warn('⚠️ Order doc not found:', orderId);
            }
            setOrderSaved(true);
          } catch (err: any) {
            console.error('Failed to update Firestore order:', err);
          }
        }
      } else if (data.status === 'ACTIVE') {
        setStatus('pending');
      } else {
        setStatus('failed');
        setErrorMsg(`Payment status: ${data.status}`);
      }
    } catch (err: any) {
      setStatus('failed');
      setErrorMsg(err.message || 'Verification failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-8 text-center space-y-5">
          {status === 'loading' && (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-indigo-500/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              </div>
              <h1 className="text-xl font-bold text-white">Verifying Payment...</h1>
              <p className="text-sm text-slate-400">Please wait, don't close this page.</p>
            </>
          )}

          {status === 'paid' && (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-black text-white">Payment Successful! 🎉</h1>
              <p className="text-sm text-slate-400">
                Your order has been placed and is now being processed.
              </p>

              {details && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order ID:</span>
                    <span className="text-white font-mono text-[10px]">{details.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Service:</span>
                    <span className="text-white font-bold">{details.serviceName || details.note}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount Paid:</span>
                    <span className="text-emerald-400 font-bold">₹{details.amount}</span>
                  </div>
                </div>
              )}

              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-200 text-left">
                📧 A confirmation will be sent shortly. Keep your order ID saved for tracking.
              </div>

              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition"
              >
                <Home className="w-4 h-4" /> Back to Home
              </button>
            </>
          )}

          {status === 'pending' && (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-amber-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Payment Pending</h1>
              <p className="text-sm text-slate-400">
                Your payment is still being processed. Please check again in a few minutes.
              </p>
              <button
                onClick={verifyPayment}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition"
              >
                Check Again <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-rose-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Payment Not Completed</h1>
              <p className="text-sm text-slate-400">{errorMsg || 'Something went wrong.'}</p>
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition"
              >
                <Home className="w-4 h-4" /> Back to Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
