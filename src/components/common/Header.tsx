import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { 
  Crown, 
  Store, 
  User, 
  PhoneCall, 
  Lock,
  ChevronDown,
  Sparkles,
  LogIn,
  LogOut,
  CreditCard,
  Settings,
  UserCircle,
  Zap,
  LifeBuoy
} from 'lucide-react';
import { VleRegistrationModal } from '../vle/VleRegistrationModal';
import { UserAuthModal } from '../user/UserAuthModal';
import { PricingModal } from '../user/PricingModal';
import { UpgradePaymentModal } from '../user/UpgradePaymentModal';
import { SupportCenter } from './SupportCenter';

export const Header: React.FC = () => {
  const { 
    role, 
    setRole, 
    siteConfig, 
    setActiveTool,
    showNotification,
    currentUser,
    setCurrentUser,
    isUserPremium,
    activeVle,
    vleLoggedIn,
    vleLogout
  } = useApp();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<'premium' | 'vle'>('premium');
  const [upgradeCycle, setUpgradeCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleRoleSelect = (targetRole: UserRole) => {
    setRole(targetRole);
    setShowRoleMenu(false);
    if (targetRole === 'owner') {
      showNotification('👑 Accessing Master Owner Command Center');
    } else if (targetRole === 'vle') {
      showNotification('🏪 Switched to CSC VLE / Cyber Cafe Portal');
    } else {
      showNotification('👤 Switched to Public User Panel');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      localStorage.removeItem('999tools_current_user_id_v1');
      await vleLogout();
      setRole('user');
      setShowUserMenu(false);
      setShowRoleMenu(false);
      showNotification('✅ Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Logout failed');
    }
  };

  const openLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
    setShowUserMenu(false);
  };

  const openSignup = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
    setShowUserMenu(false);
  };

  const openPricing = () => {
    if (!currentUser) {
      showNotification('Please signup or login first');
      openSignup();
      return;
    }
    setShowPricingModal(true);
    setShowUserMenu(false);
  };

  const handleSelectPlan = (plan: 'premium' | 'vle', cycle: 'monthly' | 'yearly') => {
    setUpgradePlan(plan);
    setUpgradeCycle(cycle);
    setShowPricingModal(false);
    setShowUpgradeModal(true);
  };

  const getPlanBadge = () => {
    if (!currentUser && !activeVle) return null;
    
    if (currentUser?.plan === 'vle' || activeVle) {
      return { 
        label: 'VLE', 
        color: 'bg-blue-500', 
        textColor: 'text-white',
        icon: Store,
      };
    }
    
    if (currentUser?.plan === 'premium' && isUserPremium()) {
      return { 
        label: 'PREMIUM', 
        color: 'bg-amber-500', 
        textColor: 'text-slate-950',
        icon: Crown,
      };
    }
    
    return { 
      label: 'FREE', 
      color: 'bg-slate-600', 
      textColor: 'text-white',
      icon: User,
    };
  };

  const planBadge = getPlanBadge();
  const userPremium = isUserPremium();
  const isVle = currentUser?.plan === 'vle' || !!activeVle;

  const getUpgradeAmount = () => {
    if (upgradePlan === 'premium') {
      return upgradeCycle === 'monthly' 
        ? (siteConfig.premiumMonthlyPrice || 49) 
        : (siteConfig.premiumYearlyPrice || 399);
    }
    return upgradeCycle === 'monthly' 
      ? (siteConfig.vleMonthlyPrice || 199) 
      : (siteConfig.vleYearlyPrice || 1499);
  };

  const displayName = currentUser?.name || activeVle?.operatorName || 'User';
  const displayEmail = currentUser?.email || activeVle?.email || '';

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
        {/* Top Mini Info Bar */}
        <div className="bg-slate-950 px-4 py-1 text-[11px] flex flex-wrap items-center justify-between text-slate-400 border-b border-slate-900">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              🇮🇳 National Digital Services & VLE Utility Hub
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline">Govt Exam Form Assist & Cyber Cafe Suite</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-300">
              <PhoneCall className="w-3 h-3 text-emerald-400" />
              Helpdesk: {siteConfig.supportPhone}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-300 font-mono">UPI: {siteConfig.upiId}</span>
          </div>
        </div>

        {/* Main Header Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setRole('user')}
              className="cursor-pointer flex items-center gap-2.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 flex items-center justify-center font-black text-slate-950 text-xl tracking-tighter shadow-md group-hover:scale-105 transition">
                999
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
                    {siteConfig.siteName}
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase bg-amber-500 text-slate-950 rounded tracking-wider">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">
                  CSC VLE • Cyber Cafe • User Utility
                </p>
              </div>
            </div>
          </div>

          {/* Quick Tools */}
          <div className="hidden lg:flex items-center gap-1.5">
            <button onClick={() => setActiveTool('passport')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition">
              📷 Photo Sheet
            </button>
            <button onClick={() => setActiveTool('resizer')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition">
              📐 Exam Resizer
            </button>
            <button onClick={() => setActiveTool('aadhaar')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition">
              💳 CR80 Smart Card
            </button>
            <button onClick={() => setActiveTool('resume')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition">
              📄 Bio-Data
            </button>
            <button onClick={() => setActiveTool('age')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition">
              📅 Age Calc
            </button>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2.5">
            
            {/* 🆕 Support Button */}
            <button
              onClick={() => setShowSupportModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition"
              title="Help & Support"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">Support</span>
            </button>

            {/* Upgrade Button */}
            {currentUser && !isVle && (
              <button
                onClick={openPricing}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-md transition animate-pulse"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Upgrade</span>
              </button>
            )}

            {/* User Auth Section */}
            {(currentUser || activeVle) ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white text-xs font-semibold transition"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-slate-950 font-black text-xs ${
                    isVle 
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-500' 
                      : 'bg-gradient-to-br from-amber-500 to-orange-500'
                  }`}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-[11px] font-bold truncate max-w-[80px]">{displayName}</div>
                  </div>
                  {planBadge && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${planBadge.color} ${planBadge.textColor}`}>
                      {planBadge.label}
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-3 py-3 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 font-black text-base ${
                          isVle 
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-500' 
                            : 'bg-gradient-to-br from-amber-500 to-orange-500'
                        }`}>
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-white truncate">{displayName}</div>
                          <div className="text-[10px] text-slate-400 truncate">{displayEmail}</div>
                        </div>
                      </div>
                      
                      {planBadge && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${planBadge.color} ${planBadge.textColor}`}>
                            {planBadge.label} PLAN
                          </span>
                          {currentUser?.subscriptionEnd && (userPremium || isVle) && (
                            <span className="text-[9px] text-slate-400">
                              Valid till {new Date(currentUser.subscriptionEnd).toLocaleDateString('en-IN')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-1 space-y-1">
                      
                      {/* VLE Dashboard Shortcut */}
                      {isVle && (
                        <button
                          onClick={() => {
                            setRole('vle');
                            setShowUserMenu(false);
                            showNotification('🏪 Opening VLE Portal');
                          }}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 border border-blue-500/40 text-blue-200 font-bold transition"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                            <Store className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold">Open VLE Portal</div>
                            <div className="text-[10px] opacity-80">
                              Khatabook + Billing + Tools
                            </div>
                          </div>
                        </button>
                      )}

                      {/* Upgrade */}
                      {!userPremium && !isVle && (
                        <button
                          onClick={openPricing}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-200 font-bold transition"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold">Upgrade Plan</div>
                            <div className="text-[10px] opacity-80">
                              From ₹{siteConfig.premiumMonthlyPrice}/mo
                            </div>
                          </div>
                        </button>
                      )}

                      {/* 🆕 Support */}
                      <button
                        onClick={() => {
                          setShowSupportModal(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs bg-gradient-to-r from-indigo-500/20 to-blue-500/20 hover:from-indigo-500/30 hover:to-blue-500/30 border border-indigo-500/40 text-indigo-200 font-bold transition"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                          <LifeBuoy className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold">Help & Support</div>
                          <div className="text-[10px] opacity-80">
                            FAQ, Tickets, Contact
                          </div>
                        </div>
                      </button>

                      {/* My Subscription */}
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          showNotification('Subscription page coming soon!');
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs text-slate-300 hover:bg-slate-800 transition"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold">My Subscription</div>
                          <div className="text-[10px] text-slate-400">Plan & payment history</div>
                        </div>
                      </button>

                      {/* Account Settings */}
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          showNotification('Settings page coming soon!');
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs text-slate-300 hover:bg-slate-800 transition"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-700/50 text-slate-300 flex items-center justify-center shrink-0">
                          <Settings className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold">Account Settings</div>
                          <div className="text-[10px] text-slate-400">Profile, mobile, password</div>
                        </div>
                      </button>

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs text-rose-300 hover:bg-rose-500/10 transition"
                      >
                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold">Logout</div>
                          <div className="text-[10px] text-rose-400/70">Sign out from account</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={openLogin}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
                <button
                  onClick={openSignup}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-xs font-bold shadow-md transition"
                >
                  <UserCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Signup Free</span>
                  <span className="sm:hidden">Signup</span>
                </button>
              </div>
            )}

            {/* VLE Registration CTA */}
            {!isVle && (
              <button
                onClick={() => setShowRegisterModal(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>VLE Registration</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-950 text-amber-400 text-[10px] font-mono font-black">
                  ₹{siteConfig.vleMonthlyPrice || 199}/mo
                </span>
              </button>
            )}

            {/* Owner Badge */}
            {role === 'owner' && (
              <div className="hidden md:flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl text-xs text-amber-300 font-semibold">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Owner</span>
              </div>
            )}

            {/* Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition shadow-sm ${
                  role === 'owner'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400'
                    : role === 'vle'
                    ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500'
                    : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'
                }`}
              >
                {role === 'owner' && <Crown className="w-4 h-4" />}
                {role === 'vle' && <Store className="w-4 h-4" />}
                {role === 'user' && <User className="w-4 h-4" />}
                <span className="hidden sm:inline capitalize">
                  {role === 'owner' ? 'Owner' : role === 'vle' ? 'VLE Portal' : 'User Panel'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {showRoleMenu && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Switch Portal View
                  </div>

                  <div className="p-1 space-y-1">
                    <button
                      onClick={() => handleRoleSelect('user')}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs transition ${
                        role === 'user' ? 'bg-slate-800 text-white font-bold' : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold">User Panel</div>
                        <div className="text-[10px] text-slate-400">Public services & free tools</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleRoleSelect('vle')}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs transition ${
                        role === 'vle' ? 'bg-blue-900/60 border border-blue-500/40 text-white font-bold' : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold">CSC VLE / Cyber Cafe</div>
                        <div className="text-[10px] text-slate-400">Khatabook + Billing</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleRoleSelect('owner')}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs transition ${
                        role === 'owner' ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <Crown className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold flex items-center gap-1.5">
                          Owner Command Center <Lock className="w-3 h-3 text-amber-400" />
                        </div>
                        <div className="text-[10px] text-slate-400">Full website control</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <VleRegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />

      <UserAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onSelectPlan={handleSelectPlan}
      />

      <UpgradePaymentModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onBack={() => {
          setShowUpgradeModal(false);
          setShowPricingModal(true);
        }}
        plan={upgradePlan}
        billingCycle={upgradeCycle}
        amount={getUpgradeAmount()}
        onSuccess={() => {
          setShowUpgradeModal(false);
          showNotification('✅ Payment request submitted!');
        }}
      />

      {/* 🆕 Support Center Modal */}
      <SupportCenter
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </>
  );
};
