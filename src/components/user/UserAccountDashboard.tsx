import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  CreditCard, 
  Settings as SettingsIcon, 
  Crown, 
  Store, 
  Zap, 
  Check,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  FileText,
  RefreshCw,
  IndianRupee,
  Copy,
  ExternalLink
} from 'lucide-react';
import { 
  updateProfile, 
  updatePassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential 
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useApp } from '../../context/AppContext';
import { PaymentRequest } from '../../types';

interface UserAccountDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'subscription' | 'settings' | 'payments';
  onUpgradeClick?: () => void;
}

export const UserAccountDashboard: React.FC<UserAccountDashboardProps> = ({ 
  isOpen, 
  onClose, 
  initialTab = 'subscription',
  onUpgradeClick 
}) => {
  const { 
    currentUser, 
    setCurrentUser, 
    isUserPremium, 
    siteConfig, 
    showNotification,
    activeVle,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'subscription' | 'settings' | 'payments'>(initialTab);

  // Settings state
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Payments state
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Initialize form with current user
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditMobile(currentUser.mobile || '');
    }
  }, [currentUser]);

  // Load payment history
  useEffect(() => {
    if (!isOpen || !currentUser?.id || activeTab !== 'payments') return;

    const loadPayments = async () => {
      setLoadingPayments(true);
      try {
        const { getUserPayments } = await import('../../services/paymentService');
        const result = await getUserPayments(currentUser.id);
        setPayments(result);
      } catch (error) {
        console.error('Error loading payments:', error);
      } finally {
        setLoadingPayments(false);
      }
    };

    loadPayments();
  }, [isOpen, currentUser?.id, activeTab]);

  if (!isOpen || !currentUser) return null;

  const isPremium = isUserPremium();
  const isVle = currentUser.plan === 'vle' || !!activeVle;
  const isFree = currentUser.plan === 'free';

  const getPlanInfo = () => {
    if (isVle) return {
      name: 'VLE / Cyber Cafe',
      icon: Store,
      color: 'blue',
      colorClass: 'bg-blue-500',
      price: siteConfig.vleMonthlyPrice || 199,
      features: [
        '999 tools unlimited',
        'Khatabook customer ledger',
        'Billing software with GST',
        'Shop branding & watermark',
        'Priority support',
        'No advertisements',
      ],
    };
    if (isPremium) return {
      name: 'Premium',
      icon: Crown,
      color: 'amber',
      colorClass: 'bg-amber-500',
      price: siteConfig.premiumMonthlyPrice || 49,
      features: [
        '999 tools unlimited',
        'All premium tools unlimited',
        'No advertisements',
        'Priority support',
        'Early access to new tools',
      ],
    };
    return {
      name: 'Free',
      icon: User,
      color: 'slate',
      colorClass: 'bg-slate-500',
      price: 0,
      features: [
        '700+ tools unlimited',
        '299 premium tools (3 uses/day)',
        'Basic customer support',
        'Client-side processing',
      ],
    };
  };

  const planInfo = getPlanInfo();
  const PlanIcon = planInfo.icon;

  // ============================================
  // SAVE PROFILE
  // ============================================
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editName.trim()) {
      showNotification('Name cannot be empty');
      return;
    }

    setSavingProfile(true);
    try {
      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: editName.trim() });
      }

      // Update Firestore user account
      const { saveUserAccount } = await import('../../services/subscriptionService');
      const updatedUser = {
        ...currentUser,
        name: editName.trim(),
        mobile: editMobile.trim() || undefined,
      };
      
      await saveUserAccount(updatedUser);
      setCurrentUser(updatedUser);
      showNotification('✅ Profile updated successfully!');
    } catch (error: any) {
      console.error('Profile update error:', error);
      showNotification('❌ Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // ============================================
  // CHANGE PASSWORD
  // ============================================
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification('Please fill all password fields');
      return;
    }
    if (newPassword.length < 6) {
      showNotification('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('New passwords do not match');
      return;
    }
    if (currentPassword === newPassword) {
      showNotification('New password must be different from current');
      return;
    }

    setChangingPassword(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('No user');

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      showNotification('✅ Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password change error:', error.code);
      let msg = 'Failed to change password';
      switch (error.code) {
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          msg = 'Current password is incorrect';
          break;
        case 'auth/weak-password':
          msg = 'New password is too weak';
          break;
        case 'auth/requires-recent-login':
          msg = 'Please logout and login again first';
          break;
        default:
          msg = error.message || 'Failed to change password';
      }
      showNotification('❌ ' + msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    if (!currentUser.subscriptionEnd) return null;
    const end = new Date(currentUser.subscriptionEnd);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="fixed inset-0 z-[85] bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 my-8 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
          
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl ${planInfo.colorClass} flex items-center justify-center text-white shadow-lg`}>
                <PlanIcon className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">{currentUser.name}</h2>
                <p className="text-xs text-blue-200 mt-0.5">{currentUser.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${planInfo.colorClass} text-white`}>
                    {planInfo.name}
                  </span>
                  {!isFree && daysRemaining !== null && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      daysRemaining > 7 ? 'bg-emerald-500/20 text-emerald-200' :
                      daysRemaining > 0 ? 'bg-amber-500/20 text-amber-200' :
                      'bg-rose-500/20 text-rose-200'
                    }`}>
                      {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-2 relative z-10">
            {[
              { id: 'subscription', label: 'My Subscription', icon: Crown },
              { id: 'settings', label: 'Account Settings', icon: SettingsIcon },
              { id: 'payments', label: `Payment History`, icon: CreditCard },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-white text-blue-950 shadow-md'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">

          {/* ============================================ */}
          {/* TAB 1: SUBSCRIPTION */}
          {/* ============================================ */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              
              {/* Current Plan Card */}
              <div className={`rounded-3xl p-6 border-2 ${
                isVle ? 'bg-blue-50 border-blue-300' :
                isPremium ? 'bg-amber-50 border-amber-300' :
                'bg-slate-50 border-slate-300'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl ${planInfo.colorClass} flex items-center justify-center text-white`}>
                      <PlanIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Current Plan
                      </div>
                      <div className="text-xl font-black text-slate-900">
                        {planInfo.name}
                      </div>
                    </div>
                  </div>

                  {!isFree && (
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        ₹{planInfo.price}/month
                      </div>
                      {daysRemaining !== null && (
                        <div className={`text-xs font-bold ${
                          daysRemaining > 7 ? 'text-emerald-600' :
                          daysRemaining > 0 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Expired'}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!isFree && currentUser.subscriptionStart && currentUser.subscriptionEnd && (
                  <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-slate-200">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Started On</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {formatDate(currentUser.subscriptionStart)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Valid Until</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {formatDate(currentUser.subscriptionEnd)}
                      </div>
                    </div>
                  </div>
                )}

                {isFree && (
                  <div className="mt-5 pt-5 border-t border-slate-200">
                    <button
                      onClick={() => {
                        onClose();
                        if (onUpgradeClick) onUpgradeClick();
                      }}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-md transition flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Upgrade to Premium / VLE
                    </button>
                  </div>
                )}
              </div>

              {/* Plan Features */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Plan Features
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {planInfo.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                        isVle ? 'text-blue-600' :
                        isPremium ? 'text-amber-600' : 'text-emerald-600'
                      }`} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Renewal / Cancel Info */}
              {!isFree && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold text-amber-900 mb-1">Renewal Information</div>
                    <p className="text-amber-800 leading-relaxed">
                      Your plan will expire on <strong>{formatDate(currentUser.subscriptionEnd)}</strong>. 
                      To renew, contact Owner at {siteConfig.supportPhone} or pay via UPI at <strong>{siteConfig.upiId}</strong>.
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ============================================ */}
          {/* TAB 2: ACCOUNT SETTINGS */}
          {/* ============================================ */}
          {activeTab === 'settings' && (
            <div className="space-y-6">

              {/* Profile Info */}
              <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Profile Information</h3>
                    <p className="text-[11px] text-slate-500">Update your name and mobile number</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={savingProfile}
                        placeholder="Your name"
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="tel"
                        value={editMobile}
                        onChange={(e) => setEditMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        disabled={savingProfile}
                        placeholder="10-digit mobile"
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address (Cannot be changed)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      value={currentUser.email}
                      disabled
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Contact support to change your email
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </form>

              {/* Change Password */}
              <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Change Password</h3>
                    <p className="text-[11px] text-slate-500">Keep your account secure</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Current Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={changingPassword}
                      placeholder="Current password"
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      New Password *
                    </label>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={changingPassword}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={changingPassword}
                      placeholder="Repeat new password"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                    />
                  </div>
                </div>

                {newPassword && (
                  <div className={`text-[11px] font-bold flex items-center gap-1.5 ${
                    newPassword.length >= 6 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {newPassword.length >= 6 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{newPassword.length >= 6 ? 'Password looks good' : 'At least 6 characters required'}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Changing...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Change Password</span>
                    </>
                  )}
                </button>
              </form>

            </div>
          )}

          {/* ============================================ */}
          {/* TAB 3: PAYMENT HISTORY */}
          {/* ============================================ */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Payment History</h3>
                  <p className="text-xs text-slate-500">All your subscription payments and their status</p>
                </div>
                <button
                  onClick={() => {
                    const loadPayments = async () => {
                      if (!currentUser?.id) return;
                      setLoadingPayments(true);
                      try {
                        const { getUserPayments } = await import('../../services/paymentService');
                        const result = await getUserPayments(currentUser.id);
                        setPayments(result);
                      } finally {
                        setLoadingPayments(false);
                      }
                    };
                    loadPayments();
                  }}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {loadingPayments ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Loading payments...</p>
                </div>
              ) : payments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-800">No Payments Yet</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    You haven't made any subscription payments yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-blue-300 transition"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Icon */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          payment.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          payment.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {payment.status === 'approved' ? <CheckCircle2 className="w-5 h-5" /> :
                           payment.status === 'rejected' ? <XCircle className="w-5 h-5" /> :
                           <Clock className="w-5 h-5" />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              payment.plan === 'premium' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {payment.plan}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                              {payment.billingCycle}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              payment.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                              payment.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800 animate-pulse'
                            }`}>
                              {payment.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            <span className="font-mono font-bold text-slate-700">
                              UTR: {payment.utr}
                            </span>
                            <span>•</span>
                            <span>{new Date(payment.requestedAt).toLocaleString('en-IN')}</span>
                          </div>

                          {payment.rejectionReason && (
                            <div className="mt-2 text-[11px] text-rose-700 bg-rose-50 rounded-lg px-2 py-1.5">
                              <strong>Reason:</strong> {payment.rejectionReason}
                            </div>
                          )}
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <div className="text-lg font-black text-slate-900 font-mono">
                            ₹{payment.amount}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase font-bold">
                            via UPI
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
