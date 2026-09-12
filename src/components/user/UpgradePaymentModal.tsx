import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  AlertCircle, 
  Loader2, 
  Crown, 
  Store,
  QrCode,
  Smartphone,
  ShieldCheck,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { validateUTR } from '../../services/paymentService';

interface UpgradePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void; // 🆕 Back to plans
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
  const { siteConfig, currentUser, submitPaymentRequest, showNotification } = useApp();
  
  const [utr, setUtr] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const planName = plan === 'premium' ? 'Premium' : 'VLE / Cyber Cafe';
  const cycleLabel = billingCycle === 'monthly' ? 'Monthly' : 'Yearly';

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(siteConfig.upiId);
    setCopied(true);
    showNotification('UPI ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setErrorMsg('Pehle login karo ya signup karo');
      return;
    }

    const validation = validateUTR(utr);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Invalid UTR');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const result = await submitPaymentRequest({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        userMobile: currentUser.mobile,
        plan,
        billingCycle,
        amount,
        utr: utr.trim(),
      });

      if (result) {
        setSuccess(true);
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg('Payment request submit nahi hua. Try again.');
      }
    } catch (error) {
      setErrorMsg('Kuch galat ho gaya. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setUtr('');
    setErrorMsg('');
    setSuccess(false);
    onClose();
  };

  const handleBack = () => {
    if (loading) return;
    setUtr('');
    setErrorMsg('');
    if (onBack) {
      onBack();
    } else {
      onClose();
    }
  };

  // ============================================
  // SUCCESS STATE
  // ============================================
  if (success) {
    return (
      <div className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl text-center border border-slate-200">
          <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-5">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            Payment Submitted! 🎉
          </h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Aapka payment request submit ho gaya hai. Owner 24 hours mein verify karke aapka <strong>{planName}</strong> plan activate kar dega.
          </p>

          <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Plan:</span>
              <span className="font-bold text-slate-900">{planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Billing:</span>
              <span className="font-bold text-slate-900">{cycleLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount:</span>
              <span className="font-bold text-emerald-700">₹{amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">UTR:</span>
              <span className="font-mono font-bold text-slate-900">{utr}</span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-left">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-900 leading-relaxed">
                <strong>Verification Time:</strong> 2-24 hours. Aapko notification milega jab plan activate ho jayega. Support: {siteConfig.supportPhone}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition"
          >
            Got It
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN PAYMENT UI
  // ============================================
  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 relative my-8 flex flex-col max-h-[90vh]">
        
        {/* ============================================ */}
        {/* STICKY HEADER — Always visible with Back + Close */}
        {/* ============================================ */}
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
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================ */}
        {/* SCROLLABLE CONTENT */}
        {/* ============================================ */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          
          {/* Header Info */}
          <div className="mb-6">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3 ${
              plan === 'premium' 
                ? 'bg-amber-100 text-amber-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {plan === 'premium' ? <Crown className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
              {planName} Upgrade
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">
              Complete Payment
            </h2>
            <p className="text-xs text-slate-500">
              UPI se ₹{amount} pay karo aur UTR submit karke verify karwao.
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

          {/* STEP 1: UPI QR + ID */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 mb-5 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                1
              </div>
              <span className="text-xs font-black text-blue-900 uppercase tracking-wider">
                Scan & Pay ₹{amount} via UPI
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="bg-white p-3 rounded-2xl shadow-md border-2 border-blue-300">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${siteConfig.upiId}&pn=${encodeURIComponent(siteConfig.siteName)}&am=${amount}&cu=INR`}
                  alt="UPI QR Code"
                  className="w-40 h-40"
                />
              </div>
              <div className="flex-1 space-y-3 w-full">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                    UPI ID:
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-xl p-2.5 border border-slate-200">
                    <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                    <code className="text-xs font-mono font-bold text-slate-900 flex-1 truncate">
                      {siteConfig.upiId}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyUPI}
                      className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition"
                      title="Copy UPI ID"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-blue-800 leading-relaxed">
                  Pay using <strong>Google Pay, PhonePe, Paytm, BHIM</strong> ya koi bhi UPI app. Amount: <strong>₹{amount}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* STEP 2: UTR Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                2
              </div>
              <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                Submit Payment UTR / Reference Number
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                UTR / Transaction ID *
              </label>
              <input
                type="text"
                value={utr}
                onChange={(e) => {
                  setUtr(e.target.value);
                  setErrorMsg('');
                }}
                disabled={loading}
                placeholder="e.g. 4123456789012"
                className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50"
              />
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                💡 UPI app ke <strong>transaction details</strong> se UTR/Ref number copy karo. Yeh 12-digit ka number hoga.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 font-semibold">{errorMsg}</p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  <strong>Manual Verification:</strong> Owner 2-24 hours mein aapka UTR verify karega. Uske baad plan automatically activate ho jayega.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !utr.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit Payment Request</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              Submit karke aap agree karte ho ki UTR sahi hai. Fake UTR se account ban ho sakta hai.
            </p>
          </form>
        </div>

        {/* ============================================ */}
        {/* STICKY FOOTER — Back to Plans */}
        {/* ============================================ */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
          <button
            onClick={handleBack}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Plans</span>
          </button>
        </div>
      </div>
    </div>
  );
};
