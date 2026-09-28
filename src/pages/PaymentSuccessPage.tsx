import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Home } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useSEO } from '../hooks/useSEO';

type Status = 'loading' | 'paid' | 'failed' | 'pending';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const [details, setDetails] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [saved, setSaved] = useState(false);

  const orderId = searchParams.get('order_id');
  const urlType = searchParams.get('type') || 'service_order';

  // 🔒 SEO: Transactional page — never indexed by Google
  useSEO({
    title: 'Payment Complete — 999tools',
    description: 'Payment verification page.',
    noindex: true,
  });

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
      const orderTags = data.orderTags || {};
      const detectedType = orderTags.type || urlType;

      if (data.status === 'PAID') {
        setStatus('paid');
        if (!saved && orderId) {
          try {
            // ═══════════════════════════════════════
            // SUBSCRIPTION
            // ═══════════════════════════════════════
            if (detectedType === 'subscription') {
              const reqRef = doc(db, 'paymentRequests', orderId);
              const snap = await getDoc(reqRef);
              if (snap.exists()) {
                const existing = snap.data();
                if (existing?.status !== 'approved') {
                  await updateDoc(reqRef, {
                    status: 'approved',
                    verifiedAt: new Date().toISOString(),
                    verifiedVia: 'cashfree_success_page',
                    cashfreePaymentId: data.orderId || '',
                    validUntil: new Date(
                      Date.now() +
                        ((orderTags.billingCycle === 'monthly' ? 30 : 365) * 86400000)
                    ).toISOString(),
                  });
                }
              }
            }
            // ═══════════════════════════════════════
            // VLE REGISTRATION
            // ═══════════════════════════════════════
            else if (detectedType === 'vle_registration') {
              const appId = orderTags.applicationId;
              if (appId) {
                const appRef = doc(db, 'vleApplications', appId);
                const snap = await getDoc(appRef);
                if (snap.exists()) {
                  const existing = snap.data();
                  if (existing?.paymentStatus !== 'paid') {
                    await updateDoc(appRef, {
                      paymentStatus: 'paid',
                      cashfreePaymentId: data.orderId || '',
                      cashfreeOrderId: orderId,
                      verifiedAt: new Date().toISOString(),
                    });
                  }
                }
              }
            }
            // ═══════════════════════════════════════
            // SERVICE ORDER (default)
            // ═══════════════════════════════════════
            else {
              const orderRef = doc(db, 'serviceOrders', orderId);
              const snap = await getDoc(orderRef);
              if (snap.exists()) {
                const existing = snap.data();
                if (existing?.paymentStatus !== 'paid') {
                  await updateDoc(orderRef, {
                    paymentStatus: 'paid',
                    paymentReference: orderId,
                    cashfreePaymentId: data.orderId || '',
                    ownerNotes: `Verified via success page. Payment ID: ${data.orderId}`,
                    updatedAt: new Date().toISOString(),
                  });
                }
              }
            }
            setSaved(true);
          } catch (err: any) {
            console.error('Firestore update failed:', err);
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

  const getSuccessMessage = () => {
    if (details) {
      const tags = details.orderTags || {};
      const t = tags.type || urlType;
      if (t === 'subscription') return 'Your plan has been activated instantly.';
      if (t === 'vle_registration')
        return 'Your VLE application has been submitted. Credentials will be sent to your WhatsApp & Email within 15-30 minutes.';
    }
    return 'Your order has been placed and is now being processed.';
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
              <p className="text-sm text-slate-400">{getSuccessMessage()}</p>

              {details && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order ID:</span>
                    <span className="text-white font-mono text-[10px]">{details.orderId}</span>
                  </div>
                  {(details.serviceName || details.note) && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Details:</span>
                      <span className="text-white font-bold">
                        {details.serviceName || details.note}
                      </span>
                    </div>
                  )}
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
                Payment is still being processed. Please check again.
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
