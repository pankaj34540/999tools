import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VleApplication } from '../../types';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Mail, 
  MessageSquare, 
  Copy, 
  Search, 
  Store, 
  ShieldCheck, 
  CreditCard,
  AlertCircle,
  Loader2
} from 'lucide-react';

export const VleApprovalsManager: React.FC = () => {
  const { 
    vleApplications, 
    approveVleApplication, 
    rejectVleApplication, 
    siteConfig, 
    showNotification 
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedApp, setSelectedApp] = useState<VleApplication | null>(null);
  const [customVleId, setCustomVleId] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [approving, setApproving] = useState(false);
  const [dispatchModalApp, setDispatchModalApp] = useState<{
    app: VleApplication;
    vleId: string;
    pass: string;
  } | null>(null);

  const [rejectApp, setRejectApp] = useState<VleApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filteredApps = vleApplications.filter((app) => {
    const matchesFilter = filterStatus === 'all' || app.status === filterStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      app.centerName.toLowerCase().includes(query) ||
      app.operatorName.toLowerCase().includes(query) ||
      app.mobile.includes(query) ||
      app.email.toLowerCase().includes(query) ||
      app.paymentUtr.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = vleApplications.filter((a) => a.status === 'pending').length;
  const approvedCount = vleApplications.filter((a) => a.status === 'approved').length;
  const totalOneTimeRevenue = approvedCount * (siteConfig.vleOneTimeFee || 299);

  const openApproveModal = (app: VleApplication) => {
    setSelectedApp(app);
    const randomId = `VLE-999-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomPass = 'Vle@' + Math.floor(100000 + Math.random() * 900000);
    setCustomVleId(randomId);
    setCustomPassword(randomPass);
  };

  const handleConfirmApproval = async () => {
    if (!selectedApp) return;
    
    setApproving(true);
    try {
      const result = await approveVleApplication(selectedApp.id, customVleId, customPassword);
      if (result) {
        setDispatchModalApp({
          app: selectedApp,
          vleId: result.vleId,
          pass: result.password,
        });
        setSelectedApp(null);
      } else {
        showNotification('❌ Approval failed. Check console for details.');
      }
    } catch (error) {
      console.error('Approval error:', error);
      showNotification('❌ Approval failed. Please try again.');
    } finally {
      setApproving(false);
    }
  };

  const handleConfirmReject = () => {
    if (!rejectApp) return;
    rejectVleApplication(rejectApp.id, rejectReason || 'Payment UTR verification failed or incomplete details.');
    setRejectApp(null);
    setRejectReason('');
  };

  const composeEmailLink = (app: VleApplication, vleId: string, pass: string) => {
    const subject = encodeURIComponent(`🎉 Congratulations! Your 999tools CSC VLE Operator ID & Password is Ready`);
    const portalUrl = window.location.origin;
    const body = encodeURIComponent(
      `Namaste ${app.operatorName} Ji,\n\n` +
      `Aapke Center "${app.centerName}" ke liye 999tools Lifetime Premium VLE Access approve kar diya gaya hai.\n\n` +
      `Yahan aapke Login Credentials hain:\n` +
      `-----------------------------------------\n` +
      `🌐 Portal Login Link: ${portalUrl}\n` +
      `📧 Login Email: ${app.email}\n` +
      `👤 Operator ID: ${vleId}\n` +
      `🔑 Password: ${pass}\n` +
      `⭐ Membership Plan: Lifetime VIP (Unlimited Tools Access - No Deductions!)\n` +
      `-----------------------------------------\n\n` +
      `Login karne ke liye:\n` +
      `1. Website kholo: ${portalUrl}\n` +
      `2. "CSC VLE Portal" button pe click karo\n` +
      `3. Apna email aur password daalo\n` +
      `4. Sabhi 50+ tools use karo!\n\n` +
      `Kisi bhi sahayata ke liye sampark karein: ${siteConfig.supportPhone} / ${siteConfig.supportWhatsApp}\n\n` +
      `Dhanyawad,\n` +
      `Team ${siteConfig.siteName}`
    );
    return `mailto:${app.email}?subject=${subject}&body=${body}`;
  };

  const composeWhatsAppLink = (app: VleApplication, vleId: string, pass: string) => {
    const cleanPhone = app.mobile.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone;
    const portalUrl = window.location.origin;
    const text = encodeURIComponent(
      `🎉 *Namaste ${app.operatorName} Ji!*\n\n` +
      `Aapka Center *${app.centerName}* ka 999tools CSC VLE Portal account approve ho gaya hai!\n\n` +
      `*Aapke Login Credentials:*\n` +
      `🌐 Portal: ${portalUrl}\n` +
      `📧 Email: ${app.email}\n` +
      `👤 *Operator ID:* ${vleId}\n` +
      `🔑 *Password:* ${pass}\n` +
      `⭐ *Plan:* Lifetime VIP (100% Unlimited)\n\n` +
      `*Login karne ke liye:*\n` +
      `1. Website kholo\n` +
      `2. "CSC VLE Portal" pe click karo\n` +
      `3. Email + Password daalo\n` +
      `4. Sabhi 50+ tools use karo!\n\n` +
      `Support: ${siteConfig.supportPhone}`
    );
    return `https://wa.me/${phoneWithCountry}?text=${text}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">
              Pending Approvals
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {pendingCount}
            </span>
            <span className="text-[11px] text-slate-500">Awaiting UTR payment verification</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
              Active Lifetime VLEs
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {approvedCount}
            </span>
            <span className="text-[11px] text-slate-500">One-time licensed cyber cafe operators</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
              One-Time Fees Collected
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              ₹{totalOneTimeRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-slate-500">₹{siteConfig.vleOneTimeFee} per lifetime registration</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-600" />
            <span>VLE Registration Applications & Account Issuance</span>
          </h3>
          <p className="text-xs text-slate-500">
            Review applicant details and payment UTR. Approve karte hi Firebase Auth account ban jayega.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, shop, UTR, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg capitalize transition ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st} {st === 'pending' && pendingCount > 0 && `(${pendingCount})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredApps.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No Applications Found</h4>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery ? 'Try matching a different keyword.' : 'New VLE operator applications will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className={`bg-white p-5 rounded-2xl border transition ${
                app.status === 'pending'
                  ? 'border-amber-300 shadow-md ring-1 ring-amber-100'
                  : 'border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-black text-slate-900">
                      {app.centerName}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        app.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}
                    >
                      {app.status}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Applied: {app.appliedDate}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400">Operator: </span>
                      <strong className="text-slate-800">{app.operatorName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Mobile/WhatsApp: </span>
                      <strong className="text-slate-800">{app.mobile}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Email: </span>
                      <strong className="text-slate-800">{app.email}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Location: </span>
                      <span className="text-slate-700">{app.district}, {app.state}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Address: </span>
                      <span className="text-slate-700 truncate">{app.address}</span>
                    </div>
                    {app.cscId && (
                      <div>
                        <span className="text-slate-400">CSC ID: </span>
                        <span className="font-mono text-blue-700">{app.cscId}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 inline-flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-slate-500">One-Time Fee:</span>
                      <strong className="text-slate-900">₹{app.paymentAmount || siteConfig.vleOneTimeFee}</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">UTR / Ref No:</span>
                      <strong className="font-mono text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                        {app.paymentUtr}
                      </strong>
                    </div>
                  </div>

                  {app.status === 'rejected' && app.rejectionReason && (
                    <p className="text-xs text-rose-600 mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Rejection Reason: {app.rejectionReason}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap lg:flex-col items-end gap-2 shrink-0">
                  {app.status === 'pending' && (
                    <>
                      <button
                        onClick={() => openApproveModal(app)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Create Firebase Account</span>
                      </button>

                      <button
                        onClick={() => setRejectApp(app)}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold transition flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {app.status === 'approved' && app.generatedVleId && (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-right space-y-1.5">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[11px] text-slate-500">VLE ID:</span>
                        <strong className="font-mono text-emerald-900 font-black">{app.generatedVleId}</strong>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[11px] text-slate-500">Password:</span>
                        <strong className="font-mono text-slate-800 font-bold">{app.generatedPassword}</strong>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <a
                          href={composeEmailLink(app, app.generatedVleId, app.generatedPassword || '')}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold flex items-center gap-1 transition"
                          title="Open Email app with pre-filled credentials"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Email</span>
                        </a>

                        <a
                          href={composeWhatsAppLink(app, app.generatedVleId, app.generatedPassword || '')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition"
                          title="Send credentials directly to WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: APPROVAL CONFIRMATION */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Approve VLE Application</h3>
                  <p className="text-xs text-slate-500">{selectedApp.centerName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                disabled={approving}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Operator:</span>
                  <strong className="text-slate-900">{selectedApp.operatorName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Login Email:</span>
                  <strong className="text-slate-900">{selectedApp.email}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobile / WhatsApp:</span>
                  <strong className="text-slate-900">{selectedApp.mobile}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment UTR:</span>
                  <strong className="font-mono text-emerald-700">{selectedApp.paymentUtr}</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Assigned VLE Operator ID:
                </label>
                <input
                  type="text"
                  value={customVleId}
                  onChange={(e) => setCustomVleId(e.target.value)}
                  disabled={approving}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Temporary Login Password:
                </label>
                <input
                  type="text"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  disabled={approving}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Minimum 6 characters. Firebase Auth requirements ke hisaab se.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                <p className="text-[11px] text-emerald-900 leading-relaxed flex items-start gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Confirm karte hi</strong> Firebase Auth mein VLE ka secure account ban jayega. 
                    Lifetime VIP access activate ho jayega. Koi balance deduction nahi hoga.
                  </span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  disabled={approving}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApproval}
                  disabled={approving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold shadow-md transition flex items-center gap-1.5 disabled:cursor-not-allowed"
                >
                  {approving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Create Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DISPATCH CREDENTIALS */}
      {dispatchModalApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">VLE Account Created! 🎉</h3>
              <p className="text-xs text-slate-500 mt-1">
                Firebase Auth account bhi ban gaya. Ab credentials send karo:
              </p>
              <p className="text-xs text-slate-700 mt-1 font-semibold">
                {dispatchModalApp.app.operatorName} ({dispatchModalApp.app.centerName})
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 mb-6">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Login Email:</span>
                <span className="font-mono font-bold text-slate-800 text-sm truncate max-w-[200px]">{dispatchModalApp.app.email}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Operator ID:</span>
                <span className="font-mono font-black text-blue-900 text-sm">{dispatchModalApp.vleId}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Password:</span>
                <span className="font-mono font-black text-slate-800 text-sm">{dispatchModalApp.pass}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
                <span className="text-slate-500">Membership:</span>
                <span className="text-emerald-700 font-bold">Lifetime VIP Active</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <a
                href={composeWhatsAppLink(dispatchModalApp.app, dispatchModalApp.vleId, dispatchModalApp.pass)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send on WhatsApp ({dispatchModalApp.app.mobile})</span>
              </a>

              <a
                href={composeEmailLink(dispatchModalApp.app, dispatchModalApp.vleId, dispatchModalApp.pass)}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>Send on Email ({dispatchModalApp.app.email})</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `999tools CSC VLE Credentials\nLogin Email: ${dispatchModalApp.app.email}\nOperator ID: ${dispatchModalApp.vleId}\nPassword: ${dispatchModalApp.pass}\nLogin Link: ${window.location.origin}`
                  );
                  showNotification('Credentials copied to clipboard!');
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Credentials to Clipboard</span>
              </button>

              <button
                type="button"
                onClick={() => setDispatchModalApp(null)}
                className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Close & Return to List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REJECT */}
      {rejectApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-2">Reject Application</h3>
            <p className="text-xs text-slate-500 mb-4">
              Rejecting application for <strong>{rejectApp.centerName}</strong>. Specify a reason for record keeping.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Payment UTR invalid or payment not received in UPI account."
              className="w-full h-24 p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectApp(null)}
                className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
