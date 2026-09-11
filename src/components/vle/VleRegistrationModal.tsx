import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Store, 
  CheckCircle2, 
  ShieldCheck, 
  QrCode, 
  CreditCard, 
  Copy, 
  AlertCircle, 
  Phone, 
  Mail, 
  MapPin, 
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react';

interface VleRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VleRegistrationModal: React.FC<VleRegistrationModalProps> = ({ isOpen, onClose }) => {
  const { siteConfig, submitVleApplication, showNotification } = useApp();

  const [formData, setFormData] = useState({
    centerName: '',
    operatorName: '',
    mobile: '',
    email: '',
    state: 'Uttar Pradesh',
    district: '',
    address: '',
    cscId: '',
    paymentUtr: '',
  });

  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.centerName || !formData.operatorName || !formData.mobile || !formData.email || !formData.paymentUtr) {
      showNotification('Please fill all mandatory fields and enter payment UTR.');
      return;
    }

    const appId = submitVleApplication({
      centerName: formData.centerName,
      operatorName: formData.operatorName,
      mobile: formData.mobile,
      email: formData.email,
      state: formData.state,
      district: formData.district || 'Main Center',
      address: formData.address || 'Shop address',
      cscId: formData.cscId || undefined,
      paymentUtr: formData.paymentUtr.trim(),
      paymentAmount: siteConfig.vleOneTimeFee || 299,
    });

    setSubmittedAppId(appId);
  };

  const oneTimeFee = siteConfig.vleOneTimeFee || 299;
  const upiPayUrl = `upi://pay?pa=${siteConfig.upiId}&pn=999tools&am=${oneTimeFee}&cu=INR&tn=VLE_Registration_${encodeURIComponent(formData.mobile || 'New')}`;
  const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiPayUrl)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mb-0.5">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                One-Time Lifetime VIP Membership
              </div>
              <h3 className="font-black text-slate-900 text-lg sm:text-xl">
                CSC VLE & Cyber Cafe Registration
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {submittedAppId ? (
          /* SUCCESS CONFIRMATION VIEW */
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h4 className="text-xl font-black text-slate-900">Application Received!</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Thank you <strong className="text-slate-800">{formData.operatorName}</strong>. Your registration application for <strong className="text-slate-800">{formData.centerName}</strong> has been submitted to Admin.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-sm mx-auto text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Reference ID:</span>
                <span className="font-mono font-bold text-slate-900">{submittedAppId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted UTR:</span>
                <span className="font-mono font-bold text-emerald-700">{formData.paymentUtr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plan:</span>
                <span className="font-bold text-blue-600">Lifetime Unlimited (₹{oneTimeFee})</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-left text-xs text-blue-900 max-w-md mx-auto space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-blue-950">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                What happens next?
              </p>
              <p className="text-[11px] leading-relaxed text-blue-800">
                Our owner team will verify your UTR and generate your <strong>Operator ID & Password</strong>. It will be dispatched directly to your WhatsApp (<span className="font-bold text-blue-950">{formData.mobile}</span>) and Email (<span className="font-bold text-blue-950">{formData.email}</span>) within 15-30 minutes!
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition"
              >
                Back to Portal
              </button>
            </div>
          </div>
        ) : (
          /* REGISTRATION FORM VIEW */
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
            {/* Lifetime VIP Fee Highlight Banner */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-100">
                  No Monthly Wallet Deductions
                </span>
                <p className="text-sm font-black">
                  One-Time Registration Fee: ₹{oneTimeFee} (Lifetime Access)
                </p>
                <p className="text-[10px] text-amber-100 mt-0.5">
                  Full access to all 50+ cyber cafe tools, customer bill print & shop branding.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-white/20 text-white font-bold text-xs uppercase tracking-wider backdrop-blur-sm">
                  VIP Plan
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Center / Cyber Cafe Name *</label>
                <input
                  type="text"
                  required
                  value={formData.centerName}
                  onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                  placeholder="e.g. Sharma Digital Seva Kendra"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Operator Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.operatorName}
                  onChange={(e) => setFormData({ ...formData, operatorName: e.target.value })}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-900"
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
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                  placeholder="10-digit mobile number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-400">Credentials will be sent to this WhatsApp</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="operator@gmail.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                />
                <span className="text-[10px] text-slate-400">Backup credentials copy sent by email</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">State *</label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
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
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="e.g. Varanasi / Patna"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CSC / MPOnline ID (Optional)</label>
                <input
                  type="text"
                  value={formData.cscId}
                  onChange={(e) => setFormData({ ...formData, cscId: e.target.value })}
                  placeholder="e.g. CSC-12345"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Center / Shop Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Shop No., Near Landmark, Market Area"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* PAYMENT VERIFICATION QR & UTR BOX */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Pay ₹{oneTimeFee} Registration Fee via UPI QR
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{siteConfig.upiId}</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
                  <img
                    src={qrImgSrc}
                    alt="UPI Payment QR"
                    className="w-28 h-28 object-contain"
                  />
                  <span className="block text-[9px] text-center text-slate-400 font-bold mt-1">
                    Scan via PhonePe / GPay / Paytm
                  </span>
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Official UPI ID:</span>
                      <strong className="font-mono text-slate-900">{siteConfig.upiId}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount:</span>
                      <strong className="text-emerald-700 font-black">₹{oneTimeFee} (One-Time)</strong>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span>Enter 12-digit UTR / Ref No *</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">Required for fast approval</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.paymentUtr}
                      onChange={(e) => setFormData({ ...formData, paymentUtr: e.target.value })}
                      placeholder="e.g. 425109823412 or UPI Ref ID"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-emerald-800 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition flex items-center gap-1.5"
              >
                <span>Submit VLE Application</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
