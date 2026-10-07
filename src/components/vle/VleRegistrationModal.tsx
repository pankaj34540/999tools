import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Store, CheckCircle2, ShieldCheck, CreditCard, AlertCircle,
  ArrowRight, Sparkles, Calendar, RefreshCw, ArrowLeft, Loader2,
  Gift, Check,
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

  // 🆕 Auto trial days from siteConfig (default 14)
  const trialDays = siteConfig.defaultVleTrialDays || 14;

  const handleBack = () => {
    if (loading) return;
    onClose();
  };

  // 🆕 Direct trial activation — no coupon needed
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
      const applicationId = 'vleapp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
      const now = new Date();
      const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
      const tempVleId = 'VLE-999-' + Math.floor(1000 + Math.random() * 9000);

      // ⚡ AUTO TRIAL FLOW — No payment
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
        paymentAmount: 0,
        paymentMethod: 'trial',
        paymentStatus: 'paid',
        status: 'approved',
        appliedDate: now.toISOString(),
        // 🆕 Trial fields
        isTrial: true,
        trialDays: trialDays,
        trialStartedAt: now.toISOString(),
        trialEndsAt: trialEnd.toISOString(),
        cashfreeOrderId: '',
        cashfreePaymentId: '',
        generatedVleId: tempVleId,
        approvedDate: now.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      });

      console.log('✅ VLE trial application saved:', applicationId);
      showNotification(`🎉 ${trialDays} din ka FREE trial activate ho gaya! Credentials WhatsApp pe aayenge.`);
      setLoading(false);
      onClose();
    } catch (err: any) {
      console.error('VLE registration error:', err);
      setErrorMsg('Failed to register. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 my-8 max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 px-6 pt-6 sticky top-0 bg-white rounded-t-3xl z-10">
          <div className="flex items-center gap-3 min-w-0">
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
                Free Trial Registration
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

          {/* 🆕 FREE TRIAL BANNER */}
          <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-white/90">
                  🎁 LIMITED TIME OFFER
                </div>
                <div className="text-2xl font-black leading-tight">
                  {trialDays} Din Ka FREE Trial
                </div>
                <div className="text-xs text-white/90 mt-0.5">
                  Poori VLE access — koi payment nahi!
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-3 gap-2 text-[10px]">
              <div>
                <div className="font-black text-base">✓</div>
                <div className="text-white/90">999 Tools</div>
              </div>
              <div>
                <div className="font-black text-base">📖</div>
                <div className="text-white/90">Khatabook</div>
              </div>
              <div>
                <div className="font-black text-base">∞</div>
                <div className="text-white/90">Unlimited</div>
              </div>
            </div>
          </div>

          {/* Plan Info */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-emerald-900 text-xs">
                Trial Details
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-white/60 rounded-lg p-2">
                <div className="text-slate-500 text-[10px]">Duration</div>
                <div className="font-bold text-emerald-800">{trialDays} days</div>
              </div>
              <div className="bg-white/60 rounded-lg p-2">
                <div className="text-slate-500 text-[10px]">Cost</div>
                <div className="font-bold text-emerald-800">₹0 Free</div>
              </div>
            </div>
            <p className="text-[10px] text-emerald-800 leading-relaxed">
              💡 Trial ke baad, ₹{siteConfig.vleMonthlyPrice || 199}/month pe continue kar sakte ho. Koi auto-charge nahi.
            </p>
          </div>

          {/* Basic Form Fields */}
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

          {/* Error message */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-rose-700 font-semibold">{errorMsg}</p>
            </div>
          )}

          {/* 🆕 ACTIVATE TRIAL BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Activating Trial...</span>
              </>
            ) : (
              <>
                <Gift className="w-4 h-4" />
                <span>Start {trialDays} Days FREE Trial</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Trust badges */}
          <div className="flex items-start gap-2 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-600 leading-relaxed">
              <strong className="text-emerald-700">No credit card required.</strong> Trial ke baad koi auto-charge nahi. Credentials WhatsApp & Email pe {trialDays} din tak valid.
            </p>
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
