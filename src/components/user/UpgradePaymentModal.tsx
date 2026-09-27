import React, { useState } from 'react';
import {
  X, AlertCircle, Loader2, Crown, Store,
  ShieldCheck, Clock, ArrowLeft, CreditCard, Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface UpgradePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  plan: 'premium' | 'vle';
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  onSuccess?: () => void;
}

export const UpgradePaymentModal: React.FC<UpgradePaymentModalProps> = ({
  isOpen,
  onClose,
  onBack,
  plan,
  billingCycle,
  amount,
  onSuccess,
}) => {
  const { currentUser, showNotification } = useApp();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const planName = plan === 'premium' ? 'Premium' : 'VLE / Cyber Cafe';
  const cycleLabel = billingCycle === 'monthly' ? 'Monthly' : 'Yearly';

  const handleCashfreePayment = async () => {
    if (!currentUser) {
      setErrorMsg('Please login or signup first');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/cashfree-create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          plan,
          billingCycle,
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          userMobile: currentUser.mobile || '',
        }),
      });

      const data = await res.json();

      if (data.success && data.paymentSessionId) {
        const { load } = await import('@cashfreepayments/cashfree-js');
        const cashfree = await load({
          mode: data.environment === 'production' ? 'production' : 'sandbox',
        });

        const result = await cashfree.checkout({
          paymentSessionId: data.paymentSessionId,
          redirectTarget: '_self',
        });

        if (result.error) {
          setErrorMsg(result.error.message || 'Payment failed');
          setLoading(false);
        }
        // Success → redirects to /payment-success?type=subscription
      } else {
        setErrorMsg(data.error || 'Payment failed. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Cashfree error:', err);
      setErrorMsg('Failed to connect. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setErrorMsg('');
    onClose();
  };

  const handleBack = () => {
    if (loading) return;
    setErrorMsg('');
    if (onBack) onBack();
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 relative my-8 flex flex-col max-h-[90vh]">

        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
          <button
            onClick={handleBack}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Plans</span>
          </button>

          <button
            onClick={handleClose}
            disabled={loading}
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold disabled:opacity-50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">

          <div className="mb-6">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3 ${
              plan === 'premium' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {plan === 'premium' ? <Crown className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
              {planName} Upgrade
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">
              Complete Payment
            </h2>
            <p className="text-xs text-slate-500">
              Pay securely via Cashfree — instant activation.
            </p>
          </div>

          {/* Plan Summary */}
          <div className="bg-slate-50 rounded-2xl p-4 mb-5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Plan:</span>
              <span className="font-bold text-slate-900">{planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Billing Cycle:</span>
              <span className="font-bold text-slate-900">{cycleLabel}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-700 font-bold">Total Amount:</span>
              <span className="text-lg font-black text-emerald-700">₹{amount}</span>
            </div>
          </div>

          {/* Cashfree Button */}
          <button
            onClick={handleCashfreePayment}
            disabled={loading || !currentUser}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed text-white rounded-2xl transition shadow-lg mb-4"
          >
            <div className="flex items-center justify-center gap-2 text-base font-bold">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay Online (Instant)
                </>
              )}
            </div>
            <p className="text-[10px] text-indigo-100 mt-0.5">
              UPI / Card / NetBanking / Wallet — Powered by Cashfree
            </p>
          </button>

          {!currentUser && (
            <p className="text-[11px] text-amber-600 text-center mb-3">
              ⚠️ Please login or signup first to continue
            </p>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 font-semibold">{errorMsg}</p>
            </div>
          )}

          {/* Info Boxes */}
          <div className="space-y-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                <strong>Instant Activation:</strong> Cashfree payment confirm hone ke baad tumhara plan turant activate ho jayega — koi manual verification nahi.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-900 leading-relaxed">
                <strong>100% Secure:</strong> Cashfree PCI-DSS certified gateway hai. Cards, UPI, wallets — sab supported.
              </p>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            By paying, you agree to our <a href="/terms" className="text-indigo-600 underline">Terms</a> &amp; <a href="/refund" className="text-indigo-600 underline">Refund Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradePaymentModal;
