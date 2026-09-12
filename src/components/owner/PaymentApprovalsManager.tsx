import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentRequest } from '../../types';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Crown, 
  Store, 
  Search, 
  CreditCard, 
  AlertCircle, 
  Copy,
  ExternalLink,
  TrendingUp,
  DollarSign,
  Filter,
  Loader2,
  Calendar,
  Mail,
  Phone,
  User
} from 'lucide-react';

export const PaymentApprovalsManager: React.FC = () => {
  const { 
    paymentRequests, 
    approvePaymentRequest, 
    rejectPaymentRequest,
    showNotification 
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<PaymentRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ============================================
  // FILTER PAYMENTS
  // ============================================
  const filteredPayments = useMemo(() => {
    return paymentRequests.filter((p) => {
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        !searchQuery ||
        p.userName.toLowerCase().includes(q) ||
        p.userEmail.toLowerCase().includes(q) ||
        p.utr.toLowerCase().includes(q) ||
        (p.userMobile && p.userMobile.includes(q));
      return matchStatus && matchSearch;
    });
  }, [paymentRequests, filterStatus, searchQuery]);

  // ============================================
  // STATS
  // ============================================
  const pendingCount = paymentRequests.filter((p) => p.status === 'pending').length;
  const approvedCount = paymentRequests.filter((p) => p.status === 'approved').length;
  const rejectedCount = paymentRequests.filter((p) => p.status === 'rejected').length;
  
  const totalRevenue = paymentRequests
    .filter((p) => p.status === 'approved')
    .reduce((sum, p) => sum + p.amount, 0);

  // ============================================
  // HANDLE APPROVE
  // ============================================
  const handleApprove = async (payment: PaymentRequest) => {
    if (!confirm(`Approve payment of ₹${payment.amount} from ${payment.userName}?\n\nPlan: ${payment.plan.toUpperCase()} (${payment.billingCycle})\nUTR: ${payment.utr}\n\nYe user ka plan ${payment.billingCycle === 'monthly' ? '30 days' : '365 days'} ke liye activate ho jayega.`)) {
      return;
    }

    setApprovingId(payment.id);
    try {
      // Calculate valid until date
      const validUntil = new Date();
      const days = payment.billingCycle === 'monthly' ? 30 : 365;
      validUntil.setDate(validUntil.getDate() + days);

      const success = await approvePaymentRequest(payment.id, validUntil);
      
      if (success) {
        showNotification(`✅ ${payment.userName} ka ${payment.plan} plan activate ho gaya!`);
      } else {
        showNotification('❌ Approval failed. Try again.');
      }
    } catch (error) {
      console.error(error);
      showNotification('❌ Error during approval');
    } finally {
      setApprovingId(null);
    }
  };

  // ============================================
  // HANDLE REJECT
  // ============================================
  const handleReject = async () => {
    if (!rejectingPayment) return;
    if (!rejectReason.trim()) {
      showNotification('Rejection reason daalo');
      return;
    }

    const success = await rejectPaymentRequest(rejectingPayment.id, rejectReason.trim());
    if (success) {
      showNotification('Payment request rejected');
      setRejectingPayment(null);
      setRejectReason('');
    }
  };

  // ============================================
  // COPY UTR
  // ============================================
  const handleCopyUTR = (utr: string, id: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedId(id);
    showNotification('UTR copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ============================================
  // FORMAT DATE
  // ============================================
  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="space-y-6">
      
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pending Approvals</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{pendingCount}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            Awaiting UTR verification
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Approved Payments</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{approvedCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Active subscriptions
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Revenue</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            From approved payments
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Rejected</span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{rejectedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Invalid UTRs or cancelled
          </div>
        </div>
      </div>

      {/* HEADER + FILTERS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>Payment Requests & Subscription Approvals</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            User ne UPI se pay kiya hai — UTR verify karo aur plan activate karo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, email, UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
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

      {/* PAYMENTS LIST */}
      {filteredPayments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">
            {filterStatus === 'pending' ? 'Koi Pending Payment Nahi' : 'No Payments Found'}
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery 
              ? 'Try different search keyword.' 
              : filterStatus === 'pending'
              ? 'Jab user payment karega, yahan aa jayega.'
              : 'No records for this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className={`bg-white rounded-2xl border-2 p-5 transition ${
                payment.status === 'pending'
                  ? 'border-amber-300 shadow-md ring-1 ring-amber-100'
                  : payment.status === 'approved'
                  ? 'border-emerald-200 shadow-sm'
                  : 'border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex flex-col lg:flex-row gap-5">
                
                {/* LEFT: User Info + Details */}
                <div className="flex-1 space-y-3">
                  
                  {/* Header Row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      payment.plan === 'premium'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}>
                      {payment.plan === 'premium' ? <Crown className="w-3 h-3 inline mr-1" /> : <Store className="w-3 h-3 inline mr-1" />}
                      {payment.plan.toUpperCase()}
                    </span>
                    
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                      {payment.billingCycle}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      payment.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : payment.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800 animate-pulse'
                    }`}>
                      {payment.status}
                    </span>

                    <span className="text-[11px] text-slate-400 ml-auto">
                      {formatDate(payment.requestedAt)}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-700 font-mono">
                      ₹{payment.amount}
                    </span>
                    <span className="text-xs text-slate-500">
                      via UPI
                    </span>
                  </div>

                  {/* User Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-500">Name:</span>
                      <strong className="text-slate-800 truncate">{payment.userName}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-500">Email:</span>
                      <strong className="text-slate-800 truncate">{payment.userEmail}</strong>
                    </div>
                    {payment.userMobile && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-500">Mobile:</span>
                        <strong className="text-slate-800">{payment.userMobile}</strong>
                      </div>
                    )}
                  </div>

                  {/* UTR Section */}
                  <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs text-slate-500 font-semibold">UTR:</span>
                    </div>
                    <code className="font-mono font-bold text-sm text-emerald-700 bg-white px-3 py-1 rounded border border-emerald-200">
                      {payment.utr}
                    </code>
                    <button
                      onClick={() => handleCopyUTR(payment.utr, payment.id)}
                      className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                      title="Copy UTR"
                    >
                      {copiedId === payment.id ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={`https://www.google.com/search?q=${payment.utr}+UTR+verification`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      Search <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Approved / Rejected Info */}
                  {payment.status === 'approved' && payment.verifiedAt && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs">
                      <div className="flex items-center gap-2 text-emerald-800">
                        <CheckCircle2 className="w-4 h-4" />
                        <strong>Approved</strong>
                        <span className="text-emerald-600">
                          {formatDate(payment.verifiedAt)}
                        </span>
                      </div>
                      {payment.validUntil && (
                        <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Valid until: {new Date(payment.validUntil).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                        </div>
                      )}
                    </div>
                  )}

                  {payment.status === 'rejected' && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs">
                      <div className="flex items-center gap-2 text-rose-800">
                        <XCircle className="w-4 h-4" />
                        <strong>Rejected</strong>
                      </div>
                      {payment.rejectionReason && (
                        <div className="text-[11px] text-rose-700 mt-1">
                          Reason: {payment.rejectionReason}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* RIGHT: Actions */}
                {payment.status === 'pending' && (
                  <div className="lg:w-52 flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(payment)}
                      disabled={approvingId === payment.id}
                      className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {approvingId === payment.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Approving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve & Activate</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setRejectingPayment(payment)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold transition flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <div className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100 leading-relaxed">
                      ⚠️ Approve karne se user ka {payment.billingCycle === 'monthly' ? '30-day' : '1-year'} plan turant activate ho jayega.
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Reject Payment Request</h3>
                <p className="text-xs text-slate-500">
                  {rejectingPayment.userName} — ₹{rejectingPayment.amount}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">UTR:</span>
                <span className="font-mono font-bold">{rejectingPayment.utr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plan:</span>
                <span className="font-bold uppercase">{rejectingPayment.plan}</span>
              </div>
            </div>

            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Rejection Reason *
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. UTR invalid — bank se verify kiya, transaction nahi mila..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => {
                  setRejectingPayment(null);
                  setRejectReason('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
