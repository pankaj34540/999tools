import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Smartphone, Tv, Zap, Check, X, Loader2, ArrowRight, ArrowLeft,
  Upload, Copy, QrCode, Receipt, CheckCircle2, AlertCircle,
  IndianRupee, FileText, MessageCircle,
} from 'lucide-react';
import {
  RechargeType,
  RechargeOrder,
  MobileOperator,
  DthOperator,
  UtilityType,
} from '../../types';
import {
  createRechargeOrder,
  updateRechargeOrder,
  MOBILE_OPERATORS,
  DTH_OPERATORS,
  UTILITY_TYPES,
  getRechargeWhatsAppLink,
  getRechargeStatusMessage,
} from '../../services/rechargeService';

// ============================================
// TYPES
// ============================================
interface RechargeOrderFormProps {
  vle?: {
    id: string;
    vleId: string;
    centerName: string;
    operatorName: string;
    mobile: string;
  };
  isUserMode?: boolean;      // true = user panel (no commission)
  onClose?: () => void;
  onSuccess?: (order: RechargeOrder) => void;
}

type Step = 'form' | 'payment' | 'success';

// ============================================
// MAIN COMPONENT
// ============================================
export const RechargeOrderForm: React.FC<RechargeOrderFormProps> = ({
  vle,
  isUserMode = false,
  onClose,
  onSuccess,
}) => {
  const { siteConfig, currentUser, showNotification } = useApp();

  // ── Step state ──
  const [step, setStep] = useState<Step>('form');

  // ── Form state ──
  const [type, setType] = useState<RechargeType>('mobile');
  const [operator, setOperator] = useState('Airtel');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [circle, setCircle] = useState('');
  const [utilityType, setUtilityType] = useState<UtilityType>('electricity');
  const [notes, setNotes] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');

  // ── Payment state ──
  const [createdOrder, setCreatedOrder] = useState<RechargeOrder | null>(null);
  const [utr, setUtr] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // ── Loading ──
  const [submitting, setSubmitting] = useState(false);

  // ============================================
  // COMMISSION CALC
  // ============================================
  const commission = useMemo(() => {
    if (isUserMode || !vle) return 0;
    // VLE commission: mobile 2%, dth 3%, utility 1%
    const rate = type === 'mobile' ? 0.02 : type === 'dth' ? 0.03 : 0.01;
    return Math.round(amount * rate * 100) / 100;
  }, [amount, type, isUserMode, vle]);

  // ============================================
  // QUICK AMOUNTS
  // ============================================
  const QUICK_AMOUNTS = [10, 20, 50, 100, 199, 299, 499, 999];

  // ============================================
  // VALIDATION
  // ============================================
  const isFormValid = useMemo(() => {
    if (amount < 10) return false;
    if (!accountNumber.trim()) return false;
    if (type === 'mobile' && accountNumber.replace(/\D/g, '').length < 10) return false;
    return true;
  }, [amount, accountNumber, type]);

  // ============================================
  // STEP 1: CREATE ORDER
  // ============================================
  const handleCreateOrder = async () => {
    if (!isFormValid) {
      showNotification('⚠️ Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const order = await createRechargeOrder({
        placedBy: isUserMode ? 'user' : 'vle',
        userId: isUserMode ? currentUser?.id : undefined,
        vleId: vle?.vleId,
        vleCenterName: vle?.centerName,
        vleMobile: vle?.mobile,
        type,
        operator,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim() || undefined,
        amount,
        commission,
        utilityType: type === 'utility' ? utilityType : undefined,
        circle: circle.trim() || undefined,
        notes: notes.trim() || undefined,
        paymentMode: 'upi',
      });

      if (!order) {
        showNotification('❌ Failed to create order');
        return;
      }

      setCreatedOrder(order);
      setStep('payment');
      showNotification(`✅ Order ${order.tokenNumber} created`);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // STEP 2: SUBMIT UTR
  // ============================================
  const handleSubmitPayment = async () => {
    if (!createdOrder) return;
    if (!utr.trim() || utr.trim().length < 6) {
      showNotification('⚠️ Please enter valid UTR number');
      return;
    }

    setSubmitting(true);
    try {
      // For now, skip actual file upload — just save UTR
      // (Firebase Storage integration later)
      const success = await updateRechargeOrder(createdOrder.id, {
        utr: utr.trim(),
        status: 'payment_submitted',
        paidAmount: createdOrder.amount,
      });

      if (!success) {
        showNotification('❌ Failed to submit payment');
        return;
      }

      const updated = { ...createdOrder, utr: utr.trim(), status: 'payment_submitted' as const };
      setCreatedOrder(updated);
      setStep('success');
      showNotification('✅ Payment submitted!');

      if (onSuccess) onSuccess(updated);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // COPY UTR / WHATSAPP
  // ============================================
  const copyToken = () => {
    if (!createdOrder) return;
    navigator.clipboard.writeText(createdOrder.tokenNumber);
    showNotification('📋 Token copied!');
  };

  const openWhatsApp = () => {
    if (!createdOrder) return;
    const shopName = vle?.centerName || siteConfig.siteName;
    const msg = getRechargeStatusMessage(createdOrder, shopName);
    const targetMobile = vle?.mobile || siteConfig.supportWhatsApp || '';
    if (!targetMobile) return;
    window.open(getRechargeWhatsAppLink(targetMobile, msg), '_blank');
  };

  // ============================================
  // RESET
  // ============================================
  const resetForm = () => {
    setStep('form');
    setType('mobile');
    setOperator('Airtel');
    setAccountNumber('');
    setAccountName('');
    setAmount(0);
    setCircle('');
    setNotes('');
    setCustomerMobile('');
    setCreatedOrder(null);
    setUtr('');
    setScreenshotFile(null);
  };

  // ============================================
  // UPI LINK
  // ============================================
  const upiLink = useMemo(() => {
    if (!createdOrder) return '';
    const upiId = siteConfig.upiId || '9124231432@mairtel';
    const payeeName = encodeURIComponent(siteConfig.siteName || '999tools');
    return `upi://pay?pa=${upiId}&pn=${payeeName}&am=${createdOrder.amount}&cu=INR&tn=${createdOrder.tokenNumber}`;
  }, [createdOrder, siteConfig]);

  const qrUrl = useMemo(() => {
    if (!createdOrder) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;
  }, [upiLink, createdOrder]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* ═══ HEADER ═══ */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 sm:p-6 text-white">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                Recharge Order
              </h2>
              <p className="text-xs text-blue-100">
                Mobile • DTH • Utility Bill Payment
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress steps */}
        <div className="mt-5 flex items-center gap-2">
          {(['form', 'payment', 'success'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                  step === s
                    ? 'bg-white text-blue-600'
                    : (['form', 'payment', 'success'].indexOf(step) > i)
                    ? 'bg-emerald-400 text-white'
                    : 'bg-white/20 text-white/60'
                }`}
              >
                {(['form', 'payment', 'success'].indexOf(step) > i) ? '✓' : i + 1}
              </div>
              {i < 2 && (
                <div className={`flex-1 h-0.5 ${(['form', 'payment', 'success'].indexOf(step) > i) ? 'bg-emerald-400' : 'bg-white/20'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between text-[10px] font-bold text-blue-100 mt-1">
          <span>Details</span>
          <span>Payment</span>
          <span>Confirm</span>
        </div>
      </div>

      {/* ═══ STEP 1: FORM ═══ */}
      {step === 'form' && (
        <div className="p-5 sm:p-6 space-y-5">
          {/* Type selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-2">
              Recharge Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'mobile' as RechargeType, label: '📱 Mobile', icon: Smartphone },
                { id: 'dth' as RechargeType, label: '📺 DTH', icon: Tv },
                { id: 'utility' as RechargeType, label: '💡 Utility', icon: Zap },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setType(t.id);
                    setOperator(t.id === 'mobile' ? 'Airtel' : t.id === 'dth' ? 'Tata Play' : 'Electricity Board');
                  }}
                  className={`py-3 rounded-xl text-xs font-bold transition border-2 ${
                    type === t.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Utility sub-type */}
          {type === 'utility' && (
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-2">
                Utility Type
              </label>
              <div className="flex flex-wrap gap-2">
                {UTILITY_TYPES.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setUtilityType(u.id as UtilityType)}
                    className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition ${
                      utilityType === u.id
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    {u.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Operator */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-2">
              {type === 'mobile' ? 'Mobile Operator' : type === 'dth' ? 'DTH Operator' : 'Utility Provider'}
            </label>
            <div className="flex flex-wrap gap-2">
              {(type === 'mobile' ? MOBILE_OPERATORS : type === 'dth' ? DTH_OPERATORS : [{ id: 'other', name: 'Electricity / Water / Gas' }]).map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setOperator(op.name)}
                  className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition ${
                    operator === op.name
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  {op.name}
                </button>
              ))}
            </div>
          </div>

          {/* Account number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                {type === 'mobile' ? 'Mobile Number' : type === 'dth' ? 'DTH ID / Subscriber ID' : 'Consumer Number / Account No.'}
                <span className="text-rose-500"> *</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 20))}
                placeholder={type === 'mobile' ? '10-digit number' : 'Enter ID number'}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Customer Name (optional)
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Ramesh Chandra"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Circle (mobile only) */}
          {type === 'mobile' && (
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Circle (optional)
              </label>
              <input
                type="text"
                value={circle}
                onChange={(e) => setCircle(e.target.value)}
                placeholder="e.g. UP East, Maharashtra"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-2">
              Amount <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {QUICK_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(a)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    amount === a
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  ₹{a}
                </button>
              ))}
            </div>
            <div className="relative">
              <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Custom amount (min ₹10)"
                min={10}
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Notes (optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Commission info (VLE only) */}
          {!isUserMode && vle && amount > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">
                  💰 Your Commission
                </span>
                <span className="text-lg font-black text-emerald-700 font-mono">
                  +₹{commission.toFixed(2)}
                </span>
              </div>
              <p className="text-[10px] text-emerald-700 mt-1">
                You will receive this commission after successful recharge.
              </p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="button"
            onClick={handleCreateOrder}
            disabled={!isFormValid || submitting}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating order...
              </>
            ) : (
              <>
                Continue to Payment
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* ═══ STEP 2: PAYMENT ═══ */}
      {step === 'payment' && createdOrder && (
        <div className="p-5 sm:p-6 space-y-5">
          {/* Order summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Order Token
                </p>
                <p className="text-sm font-black text-slate-900 font-mono">
                  {createdOrder.tokenNumber}
                </p>
              </div>
              <button
                onClick={copyToken}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Type:</span>{' '}
                <span className="font-bold text-slate-900 capitalize">{type}</span>
              </div>
              <div>
                <span className="text-slate-500">Operator:</span>{' '}
                <span className="font-bold text-slate-900">{operator}</span>
              </div>
              <div>
                <span className="text-slate-500">Number:</span>{' '}
                <span className="font-bold text-slate-900 font-mono">{accountNumber}</span>
              </div>
              <div>
                <span className="text-slate-500">Amount:</span>{' '}
                <span className="font-black text-emerald-600">₹{amount}</span>
              </div>
            </div>
          </div>

          {/* UPI QR */}
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800 mb-1">
              Scan QR to Pay ₹{amount}
            </p>
            <p className="text-[11px] text-slate-500 mb-4">
              Google Pay • PhonePe • Paytm • BHIM
            </p>

            <div className="inline-block bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="UPI QR"
                  className="w-56 h-56 rounded-lg"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                  <QrCode className="w-16 h-16" />
                </div>
              )}
            </div>

            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase">UPI ID</p>
              <p className="text-xs font-mono font-bold text-slate-900">
                {siteConfig.upiId || '9124231432@mairtel'}
              </p>
            </div>
          </div>

          {/* UTR input */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-900">
                  Payment ke baad UTR number yahan daalein
                </p>
                <p className="text-[10px] text-amber-700 mt-0.5">
                  UTR = 12-digit transaction ID from your UPI app
                </p>
              </div>
            </div>
            <input
              type="text"
              value={utr}
              onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
              placeholder="Enter 12-digit UTR number"
              className="w-full px-3 py-3 border-2 border-amber-300 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep('form')}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmitPayment}
              disabled={submitting || utr.length < 6}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Submit Payment
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 3: SUCCESS ═══ */}
      {step === 'success' && createdOrder && (
        <div className="p-6 text-center space-y-5">
          <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-3xl flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-900">Payment Submitted! 🎉</h3>
            <p className="text-xs text-slate-500 mt-1">
              Verification ke baad recharge process hoga
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500">Token:</span>
              <span className="text-xs font-mono font-bold text-slate-900">{createdOrder.tokenNumber}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500">Amount:</span>
              <span className="text-xs font-black text-emerald-600">₹{createdOrder.amount}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500">UTR:</span>
              <span className="text-xs font-mono font-bold text-slate-900">{createdOrder.utr}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Status:</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                Pending Verification
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-[11px] text-blue-900 leading-relaxed">
              ⏱️ <strong>Aapka recharge 5-10 minute mein complete hoga.</strong> Owner verify karega aur aapko WhatsApp pe update milega.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={openWhatsApp}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Send Details on WhatsApp
            </button>
            <button
              onClick={resetForm}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition"
            >
              New Recharge
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="w-full py-2 text-slate-500 hover:text-slate-700 text-xs font-semibold transition"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
