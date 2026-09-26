import React, { useState } from 'react';
import {
  ArrowLeft, Check, ExternalLink, FileText, X, AlertCircle, CreditCard,
} from 'lucide-react';
import { ServiceDefinition, ServiceSettings } from '../../types';

interface ServiceOrderFlowProps {
  service: ServiceDefinition;
  settings: ServiceSettings;
  onClose: () => void;
  onBack: () => void;
}

type Step = 'form' | 'payment';

const ServiceOrderFlow: React.FC<ServiceOrderFlowProps> = ({
  service,
  settings,
  onClose,
  onBack,
}) => {
  const [step, setStep] = useState<Step>('form');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isPayingOnline, setIsPayingOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFormUrl = () => {
    const formUrl = service.googleFormUrl?.trim() || settings.googleFormUrl;
    const fieldId = service.serviceFieldId?.trim() || settings.serviceFieldId;

    if (!formUrl || formUrl.includes('YOUR_FORM_ID')) return formUrl;

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

  const handleFormOpened = () => {
    setStep('payment');
  };

  // ── Cashfree Online Payment ──
  const handleOnlinePayment = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Please fill name and phone first');
      return;
    }

    setIsPayingOnline(true);
    setError(null);

    try {
      const response = await fetch('/api/cashfree-create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: service.price,
          serviceId: service.id,
          serviceName: service.name,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
        }),
      });

      const data = await response.json();

      if (data.success && data.paymentSessionId) {
        // Dynamic import Cashfree SDK
        const { load } = await import('@cashfreepayments/cashfree-js');
        const cashfree = await load({
          mode: data.environment === 'production' ? 'production' : 'sandbox',
        });

        const checkoutResult = await cashfree.checkout({
          paymentSessionId: data.paymentSessionId,
          redirectTarget: '_self',
        });

        if (checkoutResult.error) {
          setError(checkoutResult.error.message || 'Payment failed');
          setIsPayingOnline(false);
        }
        // On success, page redirects to /payment-success — no need to reset state
      } else {
        setError(data.error || 'Payment failed. Please try again.');
        setIsPayingOnline(false);
      }
    } catch (err: any) {
      console.error('Cashfree error:', err);
      setError('Failed to connect. Please try again.');
      setIsPayingOnline(false);
    }
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
              {['form', 'payment'].map((s, i) => {
                const stepIndex = ['form', 'payment'].indexOf(step);
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
                    {i < 1 && (
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
                    <CreditCard className="w-4 h-4 text-indigo-400" />
                    Payment Details
                  </h3>

                  {/* Customer Details */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Your Details
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
                  </div>

                  {/* CASHFREE PAY ONLINE */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
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
                        Card / NetBanking / UPI / Wallet — Powered by Cashfree
                      </p>
                    </button>

                    {(!customerName.trim() || !customerPhone.trim()) && (
                      <p className="text-[10px] text-amber-400 text-center">
                        ⚠️ Name aur mobile upar bharein
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-3 text-xs">
                      ⚠️ {error}
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-200 space-y-1">
                    <p className="font-bold mb-1">How it works:</p>
                    <p>1. Fill your details above</p>
                    <p>2. Click <strong>"Pay Online"</strong> button</p>
                    <p>3. Complete payment on Cashfree secure page</p>
                    <p>4. You'll be redirected back — order confirmed automatically ✅</p>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceOrderFlow;
