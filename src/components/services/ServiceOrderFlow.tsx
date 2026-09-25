import React, { useState } from 'react';
import {
  ArrowLeft, Check, Copy, MessageCircle, ExternalLink,
  FileText, QrCode, X, AlertCircle, Smartphone, CreditCard,
} from 'lucide-react';
import { ServiceDefinition, ServiceSettings } from '../../types';
import { createServiceOrder } from '../../services/serviceCatalogService';

interface ServiceOrderFlowProps {
  service: ServiceDefinition;
  settings: ServiceSettings;
  onClose: () => void;
  onBack: () => void;
}

type Step = 'form' | 'payment' | 'done';

// 🚦 Toggle: KYC approve hone ke baad `true` kar dena
const INSTAMOJO_ENABLED = false;

const ServiceOrderFlow: React.FC<ServiceOrderFlowProps> = ({
  service,
  settings,
  onClose,
  onBack,
}) => {
  const [step, setStep] = useState<Step>('form');
  const [copied, setCopied] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPayingOnline, setIsPayingOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Get form URL (per-service takes priority) ──
  const getFormUrl = () => {
    const formUrl = service.googleFormUrl?.trim() || settings.googleFormUrl;
    const fieldId = service.serviceFieldId?.trim() || settings.serviceFieldId;

    if (!formUrl || formUrl.includes('YOUR_FORM_ID')) {
      return formUrl;
    }

    try {
      const url = new URL(formUrl);
      url.searchParams.set('usp', 'pp_url');
      if (fieldId && fieldId !== 'entry.0000000000') {
        url.searchParams.set(fieldId, service.name);
      }
      return url.toString();
    } catch {
      return formUrl;
    }
  };

  // ── Generate UPI QR data ──
  const getUpiQrData = () => {
    const upiId = settings.ownerUpiId;
    const name = '999tools';
    const amount = service.price;
    const note = service.name;
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  const getQrUrl = () => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getUpiQrData())}`;
  };

  const copyUpi = () => {
    navigator.clipboard.writeText(settings.ownerUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormOpened = () => {
    setStep('payment');
  };

  // ── Online Payment via Instamojo ──
  const handleOnlinePayment = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Please fill name and phone first');
      return;
    }

    setIsPayingOnline(true);
    setError(null);

    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: service.price,
          purpose: `${service.name} — 999tools`,
          buyerName: customerName.trim(),
          email: customerEmail.trim(),
          phone: customerPhone.trim(),
          serviceId: service.id,
        }),
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setError(data.error || 'Payment failed. Please try UPI QR instead.');
      }
    } catch (err) {
      setError('Failed to connect. Please try UPI QR instead.');
    } finally {
      setIsPayingOnline(false);
    }
  };

  // ── Manual UPI Submit ──
  const handlePaymentSubmit = async () => {
    if (!paymentRef.trim()) return;
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Please fill name and phone number');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createServiceOrder({
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,

        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        customerAddress: '',
        aadhaarNumber: '',
        panNumber: '',
        dateOfBirth: '',
        fatherName: '',
        motherName: '',
        gender: '',
        category: '',
        additionalData: {},

        documentLinks: [],

        paymentMethod: 'upi',
        paymentStatus: 'pending',
        paymentReference: paymentRef.trim(),
        paymentAmount: service.price,

        orderStatus: 'pending',
        ownerNotes: '',

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setStep('done');
    } catch (err) {
      setError('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hi, I placed an order:\n\n` +
      `Service: ${service.name}\n` +
      `Name: ${customerName}\n` +
      `Phone: ${customerPhone}\n` +
      `Amount: ₹${service.price}\n` +
      `UPI Ref: ${paymentRef}`
    );
    window.open(`https://wa.me/${settings.ownerWhatsapp}?text=${msg}`, '_blank');
  };

  const hasOwnForm = !!service.googleFormUrl?.trim();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
      <div className="min-h-screen py-6 px-4">
        <div className="max-w-2xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base font-bold text-white">{service.name}</h2>
                <p className="text-[10px] text-slate-400">
                  {step === 'form' && 'Step 1: Fill the form'}
                  {step === 'payment' && 'Step 2: Complete payment'}
                  {step === 'done' && 'Order placed!'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="px-5 pt-4">
            <div className="flex items-center gap-2">
              {['form', 'payment', 'done'].map((s, i) => {
                const stepIndex = ['form', 'payment', 'done'].indexOf(step);
                const isDone = i < stepIndex;
                const isActive = i === stepIndex;
                return (
                  <React.Fragment key={s}>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        isDone
                          ? 'bg-emerald-500 text-white'
                          : isActive
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    {i < 2 && (
                      <div
                        className={`flex-1 h-0.5 ${
                          i < stepIndex ? 'bg-emerald-500' : 'bg-slate-800'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="p-5 space-y-5">

            {/* STEP 1: FORM */}
            {step === 'form' && (
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Fill the Form
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Click the button below to open the form. Fill in your details and upload required documents.
                  After submitting, come back to this tab to complete payment.
                </p>

                {!hasOwnForm && (
                  <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-200 flex gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      Using <strong>default form</strong>. Owner can set a dedicated form for this service.
                    </div>
                  </div>
                )}

                <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-3 text-xs text-amber-200 flex gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Note:</strong> After submitting the form, come back to this tab and click "I've submitted the form".
                  </div>
                </div>

                <a
                  href={getFormUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Form (New Tab)
                </a>

                <button
                  onClick={handleFormOpened}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition"
                >
                  <Check className="w-4 h-4" />
                  I've submitted the form → Next
                </button>
              </div>
            )}

            {/* STEP 2: PAYMENT */}
            {step === 'payment' && (
              <>
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-5 text-center">
                  <p className="text-xs text-emerald-100 uppercase tracking-wider mb-1">Amount to Pay</p>
                  <p className="text-4xl font-black text-white">₹{service.price}</p>
                  <p className="text-[11px] text-emerald-100 mt-2">for {service.name}</p>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-indigo-400" />
                    Payment Details
                  </h3>

                  {/* 🆕 PAY ONLINE BUTTON — Instamojo */}
                  <button
                    onClick={handleOnlinePayment}
                    disabled={isPayingOnline || !customerName.trim() || !customerPhone.trim()}
                    className="w-full flex flex-col items-center justify-center gap-1 px-4 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition shadow-lg"
                  >
                    <div className="flex items-center gap-2 text-base font-bold">
                      {isPayingOnline ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          Pay Online (Instant)
                        </>
                      )}
                    </div>
                    <p className="text-[10px] text-indigo-100">
                      Card / NetBanking / UPI / Wallet — Powered by Instamojo
                    </p>
                  </button>

                  {(!customerName.trim() || !customerPhone.trim()) && (
                    <p className="text-[10px] text-amber-400 text-center">
                      ⚠️ Name aur mobile pehle bharein (neeche form mein)
                    </p>
                  )}

                  {/* OR Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-800"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">OR Pay via UPI QR</span>
                    <div className="flex-1 h-px bg-slate-800"></div>
                  </div>

                  {/* QR Code */}
                  <div className="bg-white rounded-xl p-4 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      <Smartphone className="w-3 h-3" />
                      Scan QR to Pay ₹{service.price}
                    </div>

                    <img
                      src={getQrUrl()}
                      alt="UPI QR Code"
                      className="w-48 h-48 rounded-lg border-4 border-slate-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://quickchart.io/qr?text=${encodeURIComponent(
                          getUpiQrData()
                        )}&size=250`;
                      }}
                    />

                    <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                      Open <strong>GPay / PhonePe / Paytm</strong> app<br />
                      Scan this QR → Amount auto-fills → Pay
                    </p>
                  </div>

                  {/* Manual UPI ID */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">
                      Pay manually to UPI ID:
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm font-mono break-all">
                        {settings.ownerUpiId}
                      </div>
                      <button
                        onClick={copyUpi}
                        className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition flex-shrink-0"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-200 space-y-1">
                    <p className="font-bold mb-1">How to pay via UPI QR:</p>
                    <p>1. Open any UPI app (GPay, PhonePe, Paytm)</p>
                    <p>2. <strong>Scan QR</strong> or send <strong>₹{service.price}</strong> to the UPI ID above</p>
                    <p>3. Copy the transaction ID from your UPI app</p>
                    <p>4. Fill your details below</p>
                  </div>

                  {/* Customer Details */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Confirm Order Details
                    </p>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Your Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Mobile Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="10-digit mobile"
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Email (optional)
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        UPI Transaction ID <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="e.g. 1234567890123 (only for UPI QR payment)"
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-3 text-xs">
                      ⚠️ {error}
                    </div>
                  )}

                  <button
                    onClick={handlePaymentSubmit}
                    disabled={!paymentRef.trim() || !customerName.trim() || !customerPhone.trim() || isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition"
                  >
                    {isSubmitting ? (
                      <>Submitting...</>
                    ) : (
                      <><Check className="w-4 h-4" /> Submit UPI Order</>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* STEP 3: DONE */}
            {step === 'done' && (
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-5 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Order Placed! 🎉</h3>
                  <p className="text-sm text-slate-400">
                    Your order for <strong className="text-white">{service.name}</strong> has been submitted.
                  </p>
                </div>

                <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Service:</span>
                    <span className="text-white font-bold">{service.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount:</span>
                    <span className="text-emerald-400 font-bold">₹{service.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transaction ID:</span>
                    <span className="text-white font-mono text-[10px]">{paymentRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Processing:</span>
                    <span className="text-white">{service.processingDays} days</span>
                  </div>
                </div>

                <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-3 text-xs text-amber-200">
                  ⚠️ Send us the payment screenshot on WhatsApp so we can verify and start processing.
                </div>

                <button
                  onClick={sendWhatsApp}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  Send Confirmation on WhatsApp
                </button>

                <button
                  onClick={onClose}
                  className="text-xs text-slate-400 hover:text-white transition"
                >
                  Close
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceOrderFlow;
