import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Store, CheckCircle2, ShieldCheck, CreditCard, AlertCircle,
  ArrowRight, Sparkles, Calendar, RefreshCw, ArrowLeft, Loader2,
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface VleRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VleRegistrationModal: React.FC<VleRegistrationModalProps> = ({ isOpen, onClose }) => {
  const { siteConfig, showNotification } = useApp();

  const [formData, setFormData] = useState({
    centerName: '',
    operatorName: '',
    mobile: '',
    email: '',
    state: 'Uttar Pradesh',
    district: '',
    address: '',
    cscId: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const monthlyFee = siteConfig.vleMonthlyPrice || 199;
  const yearlyFee = siteConfig.vleYearlyPrice || 1499;

  const handleBack = () => {
    if (loading) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.centerName || !formData.operatorName || !formData.mobile || !formData.email) {
      setErrorMsg('Please fill all mandatory fields');
      return;
    }
    if (formData.mobile.length !== 10) {
      setErrorMsg('Mobile number 10-digit hona chahiye');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Step 1: Save VLE application to Firestore (pending payment)
      const applicationId = 'vleapp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);

      await setDoc(doc(db, 'vleApplications', applicationId), {
        id: applicationId,
        operatorName: formData.operatorName.trim(),
        centerName: formData.centerName.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim().toLowerCase(),
        state: formData.state,
        district: formData.district.trim() || 'Main Center',
        address: formData.address.trim() || 'Shop address',
        cscId: formData.cscId.trim() || '',
        paymentAmount: monthlyFee,
        paymentMethod: 'cashfree',
        paymentStatus: 'pending',
        status: 'pending',
        appliedDate: new Date().toISOString(),
        cashfreeOrderId: '',
        cashfreePaymentId: '',
      });
      console.log('✅ VLE application saved:', applicationId);

      // Step 2: Create Cashfree order
      const res = await fetch('/api/cashfree-create-vle-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: monthlyFee,
          applicationId,
          userName: formData.operatorName.trim(),
          userEmail: formData.email.trim(),
          userMobile: formData.mobile.trim(),
          centerName: formData.centerName.trim(),
        }),
      });

      const data = await res.json();

      if (data.success && data.paymentSessionId) {
        // Step 3: Redirect to Cashfree checkout
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
        // On success → page redirects to /payment-success
      } else {
        setErrorMsg(data.error || 'Payment failed. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('VLE registration error:', err);
      setErrorMsg('Failed to connect. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 my-8 max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 px-6 pt-6 sticky top-0 bg-white rounded-t-3xl z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* 🆕 BACK BUTTON */}
            <button
              onClick={handleBack}
              disabled={loading}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition disabled:opacity-50 shrink-0"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full mb-0.5">
                <Sparkles className="w-3 h-3 text-blue-500" />
                Monthly Subscription Plan
              </div>
              <h3 className="font-black text-slate-900 text-lg sm:text-xl truncate">
                CSC VLE & Cyber Cafe Registration
              </h3>
            </div>
          </div>

          <button
            onClick={handleBack}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold disabled:opacity-50 shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6 text-xs overflow-y-auto flex-1">

          {/* Plan Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-4 rounded-2xl shadow-md">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block text-blue-100 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Monthly Recurring Plan
                </span>
                <p className="text-lg font-black mt-1">
                  ₹{monthlyFee}<span className="text-sm font-normal text-blue-100">/month</span>
                </p>
                <p className="text-[10px] text-blue-100 mt-0.5 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Or ₹{yearlyFee}/year (Save ₹{monthlyFee * 12 - yearlyFee})
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-white/20 text-white font-bold text-xs uppercase tracking-wider backdrop-blur-sm">
                  VLE Plan
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-3 gap-2 text-[10px]">
              <div>
                <div className="font-black text-sm">999</div>
                <div className="text-blue-100">Tools Access</div>
              </div>
              <div>
                <div className="font-black text-sm">📖</div>
                <div className="text-blue-100">Khatabook</div>
              </div>
              <div>
                <div className="font-black text-sm">∞</div>
                <div className="text-blue-100">Unlimited Use</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Center / Cyber Cafe Name *</label>
              <input
                type="text"
                required
                disabled={loading}
                value={formData.centerName}
                onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                placeholder="e.g. Sharma Digital Seva Kendra"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-900 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Operator Full Name *</label>
              <input
                type="text"
                required
                disabled={loading}
                value={formData.operatorName}
                onChange={(e) => setFormData({ ...formData, operatorName: e.target.value })}
                placeholder="e.g. Rajesh Sharma"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-900 disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">WhatsApp Mobile Number *</label>
              <input
                type="tel"
                required
                maxLength={10}
                disabled={loading}
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                placeholder="10-digit mobile number"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-slate-900 disabled:bg-slate-50"
              />
              <span className="text-[10px] text-slate-400">Credentials will be sent to this WhatsApp</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                disabled={loading}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="operator@gmail.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 disabled:bg-slate-50"
              />
              <span className="text-[10px] text-slate-400">Backup credentials sent by email</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">State *</label>
              <select
                disabled={loading}
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium disabled:bg-slate-50"
              >
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Bihar">Bihar</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Haryana">Haryana</option>
                <option value="Delhi">Delhi NCR</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Jharkhand">Jharkhand</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Other">Other State</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">District / City</label>
              <input
                type="text"
                disabled={loading}
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="e.g. Varanasi"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">CSC ID (Optional)</label>
              <input
                type="text"
                disabled={loading}
                value={formData.cscId}
                onChange={(e) => setFormData({ ...formData, cscId: e.target.value })}
                placeholder="e.g. CSC-12345"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono disabled:bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Center / Shop Address</label>
            <input
              type="text"
              disabled={loading}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Shop No., Near Landmark, Market Area"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50"
            />
          </div>

          {/* Payment section - Cashfree only */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-indigo-900 text-xs">Pay ₹{monthlyFee} & Submit Application</span>
            </div>

            <p className="text-[11px] text-indigo-800 leading-relaxed">
              Click the button below to pay securely via Cashfree. After payment, your application will be submitted to our team for review.
            </p>

            <div className="bg-white/60 border border-blue-200 rounded-xl p-2.5 text-[10px] text-blue-900 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <strong className="text-emerald-700">₹{monthlyFee}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gateway:</span>
                <strong>Cashfree (UPI / Card / NetBanking)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Activation:</span>
                <strong className="text-emerald-700">Instant after verification</strong>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-rose-700 font-semibold">{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₹{monthlyFee} via Cashfree</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-start gap-2 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-600 leading-relaxed">
                100% secure payment via Cashfree. After payment success, credentials will be sent to your WhatsApp &amp; Email within 15-30 minutes.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VleRegistrationModal;
