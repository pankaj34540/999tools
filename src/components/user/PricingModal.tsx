import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Crown, 
  Store, 
  User, 
  Zap,
  Sparkles,
  Shield,
  TrendingUp
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: 'premium' | 'vle', billingCycle: 'monthly' | 'yearly') => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectPlan 
}) => {
  const { siteConfig, currentUser } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  if (!isOpen) return null;

  const plans = [
    {
      id: 'free' as const,
      name: 'Free',
      icon: User,
      color: 'slate',
      price: 0,
      priceYearly: 0,
      tagline: 'Start free, upgrade anytime',
      features: [
        '700+ tools unlimited',
        '299 premium tools (3 uses/day)',
        'Basic customer support',
        'Client-side processing',
        'No signup required for basic',
      ],
      cta: currentUser?.plan === 'free' ? 'Current Plan' : 'Get Started Free',
      disabled: currentUser?.plan === 'free',
    },
    {
      id: 'premium' as const,
      name: 'Premium',
      icon: Crown,
      color: 'amber',
      price: siteConfig.premiumMonthlyPrice || 49,
      priceYearly: siteConfig.premiumYearlyPrice || 399,
      tagline: 'For power users & students',
      features: [
        '999 tools unlimited',
        'All premium tools unlimited',
        'No advertisements',
        'Priority support',
        'Early access to new tools',
        'Advanced AI tools',
        'Batch processing',
      ],
      cta: currentUser?.plan === 'premium' ? 'Current Plan' : 'Upgrade Now',
      disabled: currentUser?.plan === 'premium',
      popular: true,
    },
    {
      id: 'vle' as const,
      name: 'VLE / Cyber Cafe',
      icon: Store,
      color: 'blue',
      price: siteConfig.vleMonthlyPrice || 199,
      priceYearly: siteConfig.vleYearlyPrice || 1499,
      tagline: 'For CSC operators & shops',
      features: [
        '999 tools unlimited',
        'Khatabook customer ledger',
        'Payment reminders (WhatsApp)',
        'Shop branding & watermark',
        'Customer job queue',
        'Batch processing',
        'Priority support',
        'Print-ready outputs',
      ],
      cta: currentUser?.plan === 'vle' ? 'Current Plan' : 'Upgrade to VLE',
      disabled: currentUser?.plan === 'vle',
    },
  ];

  const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' | 'badge') => {
    const map: Record<string, Record<string, string>> = {
      slate: {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        badge: 'bg-slate-600 text-white',
      },
      amber: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-300',
        badge: 'bg-amber-500 text-slate-950',
      },
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-300',
        badge: 'bg-blue-600 text-white',
      },
    };
    return map[color]?.[variant] || '';
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Choose Your Plan
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
            Unlock the Full Power of 999tools
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto">
            Upgrade to remove ads, unlock 299+ premium tools, and access unlimited usage.
            Cancel anytime. Pay via UPI.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-100 p-1 rounded-2xl inline-flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Yearly
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-700">
                SAVE 32%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = billingCycle === 'monthly' ? plan.price : plan.priceYearly;
            const isFree = plan.id === 'free';

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl border-2 p-6 flex flex-col ${
                  plan.popular
                    ? 'border-amber-400 bg-gradient-to-b from-amber-50/50 to-white shadow-xl scale-[1.02]'
                    : `${getColorClasses(plan.color, 'border')} bg-white`
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md">
                      ⭐ Most Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-xl ${getColorClasses(plan.color, 'bg')} ${getColorClasses(plan.color, 'text')} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                    <p className="text-[11px] text-slate-500">{plan.tagline}</p>
                  </div>
                </div>

                <div className="mb-5 pb-5 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">
                      ₹{price}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      {isFree ? 'forever' : billingCycle === 'monthly' ? '/month' : '/year'}
                    </span>
                  </div>
                  {!isFree && billingCycle === 'yearly' && (
                    <p className="text-[11px] text-emerald-600 font-bold mt-1">
                      Only ₹{Math.round(price / 12)}/month billed annually
                    </p>
                  )}
                  {isFree && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      No credit card required
                    </p>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${plan.popular ? 'text-amber-600' : 'text-emerald-600'}`} />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.disabled ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed"
                  >
                    ✓ {plan.cta}
                  </button>
                ) : isFree ? (
                  <button
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <button
                    onClick={() => onSelectPlan(plan.id as 'premium' | 'vle', billingCycle)}
                    className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 ${
                      plan.id === 'premium'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white'
                    }`}
                  >
                    {plan.id === 'premium' ? <Zap className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                    {plan.cta}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Manual UPI Verification</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-amber-600" />
            <span>Instant Activation After Approval</span>
          </div>
        </div>
      </div>
    </div>
  );
};
