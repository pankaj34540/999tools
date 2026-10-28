import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck, CreditCard, AlertCircle,
  Sparkles, ArrowLeft, Loader2,
  Gift, Zap, Eye, EyeOff,
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../../config/firebase';
import { saveUserAccount } from '../../services/subscriptionService';

interface VleRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RegType = 'trial' | 'esuvidha';

export const VleRegistrationModal: React.FC<VleRegistrationModalProps> = ({ isOpen, onClose }) => {
  const { siteConfig, showNotification } = useApp();

  const [regType, setRegType] = useState<RegType>('trial');

  const [formData, setFormData] = useState({
    centerName: '',
    operatorName: '',
    mobile: '',
    email: '',
    password: '', // 🆕 New Password Field
    state: 'Uttar Pradesh',
    district: '',
    address: '',
    cscId: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const trialDays = siteConfig.defaultVleTrialDays || 14;
  const esuvidhaFee = 139;

  const handleBack = () => {
    if (loading) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.centerName || !formData.operatorName || !formData.mobile || !formData.email || !formData.password) {
      setErrorMsg('Please fill all mandatory fields');
      return;
    }
    if (formData.mobile.length !== 10) {
      setErrorMsg('Mobile number 10-digit hona chahiye');
      return;
    }
    if (formData.password.length < 6) {
      setErrorMsg('Password kam se kam 6 characters ka hona chahiye');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const emailClean = formData.email.trim().toLowerCase();
      const applicationId = 'vleapp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
      const now = new Date();
      const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
      const tempVleId = 'VLE-999-' + Math.floor(1000 + Math.random() * 9000);

      const isTrial = regType === 'trial';
      const paymentAmount = isTrial ? 0 : esuvidhaFee;
      const paymentMethod = isTrial ? 'trial' : 'cashfree';

      // 1. Create Firebase Auth Account with User's Password
      let firebaseUser = null;
      try {
        const userCred = await createUserWithEmailAndPassword(auth, emailClean, formData.password);
        firebaseUser = userCred.user;
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          throw new Error('Ye email already registered hai. Please login karein.');
        } else {
          throw authErr;
        }
      }

      if (!firebaseUser) throw new Error('Failed to create user account');

      // 2. Save VLE Application
      await setDoc(doc(db, 'vleApplications', applicationId), {
        id: applicationId,
        operatorName: formData.operatorName.trim(),
        centerName: formData.centerName.trim(),
        mobile: formData.mobile.trim(),
        email: emailClean,
        state: formData.state,
        district: formData.district.trim() || 'Main Center',
        address: formData.address.trim() || 'Shop address',
        cscId: formData.cscId.trim() || '',
        paymentAmount: paymentAmount,
        paymentMethod: paymentMethod,
        paymentStatus: 'paid',
        status: 'approved',
        appliedDate: now.toISOString(),
        isTrial: isTrial,
        trialStartedAt: isTrial ? now.toISOString() : '',
        trialEndsAt: isTrial ? trialEnd.toISOString() : '',
        cashfreeOrderId: '',
        cashfreePaymentId: '',
        generatedVleId: tempVleId,
        approvedDate: now.toLocaleString('en-IN'),
        eSuvidhaAccess: !isTrial,
        userId: firebaseUser.uid,
      });

      // 3. Save User Account
      await saveUserAccount({
        id: firebaseUser.uid,
        email: emailClean,
        name: formData.operatorName.trim(),
        mobile: formData.mobile.trim(),
        plan: 'vle',
        subscriptionStatus: 'active',
        subscriptionStart: now.toISOString(),
        subscriptionEnd: isTrial ? trialEnd.toISOString() : '',
        createdAt: now.toISOString(),
        isTrial: isTrial,
        eSuvidhaAccess: !isTrial,
        eSuvidhaPaidAt: !isTrial ? now.toISOString() : '',
        vleData: {
          vleId: tempVleId,
          centerName: formData.centerName.trim(),
          operatorName: formData.operatorName.trim(),
          mobile: formData.mobile.trim(),
          state: formData.state,
          district: formData.district.trim() || 'Main Center',
          address: formData.address.trim() || 'Shop address',
          cscId: formData.cscId.trim() || '',
          status: 'active',
          kycVerified: true,
          joinedDate: now.toISOString(),
          totalOrdersCompleted: 0,
        },
      });

      // 4. Success & Redirect
      if (isTrial) {
        showNotification(`🎉 ${trialDays} din ka FREE trial activate ho gaya!`);
        setLoading(false);
        onClose();
        window.location.href = '/';
      } else {
        showNotification(`✅ Registration Successful! Ab login karein.`);
        setLoading(false);
        onClose();
        window.location.href = '/e-suvidha';
      }

    } catch (err: any) {
      console.error('VLE registration error:', err);
      setErrorMsg(err.message || 'Failed to register. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 my-8 max-h-[92vh] flex flex-col">

        <div className="flex items-center justify-between pb-4 border-b border-slate-100 px-6 pt-6 sticky top-0 bg-white rounded-t-3xl z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={handleBack} disabled={loading} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition disabled:opacity-50 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full mb-0.5">
                <Sparkles className="w-3 h-3 text-blue-500" />
                {regType === 'trial' ? 'Free Trial Registration' : 'E SUVIDHA Registration'}
              </div>
              <h3 className="font-black text-slate-900 text-lg sm:text-xl truncate">
                CSC VLE & Cyber Cafe Registration
              </h3>
            </div>
          </div>
          <button onClick={handleBack} disabled={loading} className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold disabled:opacity-50 shrink-0">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 text-xs overflow-y-auto flex-1">

          {/* TOGGLE */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button type="button" onClick={() => setRegType('trial')} disabled={loading} className={`py-2.5 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 ${regType === 'trial' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
              <Gift className="w-4 h-4" />
              <span>{trialDays} Days Free Trial</span>
            </button>
            <button type="button" onClick={() => setRegType('esuvidha')} disabled={loading} className={`py-2.5 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 ${regType === 'esuvidha' ? 'bg-white shadow-sm text-purple-700' : 'text-slate-500 hover:text-slate-700'}`}>
              <Zap className="w-4 h-4" />
              <span>E SUVIDHA (₹139)</span>
            </button>
          </div>

          {/* BANNER */}
          {regType === 'trial' ? (
            <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
              <div className="relative flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <Gift className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/90">🎁 LIMITED TIME OFFER</div>
                  <div className="text-2xl font-black leading-tight">{trialDays} Din Ka FREE Trial</div>
                  <div className="text-xs text-white/90 mt-0.5">Poori VLE access — koi payment nahi!</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
              <div className="relative flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-100">⚡ ONE-TIME REGISTRATION</div>
                  <div className="text-2xl font-black leading-tight">E SUVIDHA Portal</div>
                  <div className="text-xs text-blue-100 mt-0.5">Lifetime Access — ₹{esuvidhaFee} One-Time</div>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Center / Cyber Cafe Name *</label>
              <input type="text" required disabled={loading} value={formData.centerName} onChange={(e) => setFormData({ ...formData, centerName: e.target.value })} placeholder="e.g. Sharma Digital Seva Kendra" className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-900 disabled:bg-slate-50" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Operator Full Name *</label>
              <input type="text" required disabled={loading} value={formData.operatorName} onChange={(e) => setFormData({ ...formData, operatorName: e.target.value })} placeholder="e.g. Rajesh Sharma" className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-900 disabled:bg-slate-50" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">WhatsApp Mobile Number *</label>
              <input type="tel" required maxLength={10} disabled={loading} value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })} placeholder="10-digit mobile number" className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-slate-900 disabled:bg-slate-50" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
              <input type="email" required disabled={loading} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="operator@gmail.com" className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 disabled:bg-slate-50" />
            </div>
          </div>

          {/* 🆕 Password Field */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Create Password * (Min 6 chars)</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={loading}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter a secure password"
                className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-900 disabled:bg-slate-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">State *</label>
              <select disabled={loading} value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium disabled:bg-slate-50">
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
              <input type="text" disabled={loading} value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} placeholder="e.g. Varanasi" className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">CSC ID (Optional)</label>
              <input type="text" disabled={loading} value={formData.cscId} onChange={(e) => setFormData({ ...formData, cscId: e.target.value })} placeholder="e.g. CSC-12345" className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono disabled:bg-slate-50" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Center / Shop Address</label>
            <input type="text" disabled={loading} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Shop No., Near Landmark, Market Area" className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50" />
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
            className={`w-full py-4 text-white font-black text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${
              regType === 'trial'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'
            }`}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
            ) : regType === 'trial' ? (
              <><Gift className="w-4 h-4" /> Start {trialDays} Days FREE Trial</>
            ) : (
              <><CreditCard className="w-4 h-4" /> Pay ₹{esuvidhaFee} & Register</>
            )}
          </button>

          <div className="flex items-start gap-2 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-600 leading-relaxed">
              {regType === 'trial'
                ? 'No credit card required. Trial ke baad koi auto-charge nahi.'
                : `One-time fee. Lifetime access to E SUVIDHA dashboard.`}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={handleBack} disabled={loading} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold disabled:opacity-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VleRegistrationModal;
