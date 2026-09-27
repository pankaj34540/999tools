import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentRequest } from '../../types';
import {
  CheckCircle2, XCircle, Clock, Crown, Store, Search,
  CreditCard, DollarSign, Calendar, Mail, Phone, User,
  ExternalLink, ShieldCheck, Eye,
} from 'lucide-react';

export const PaymentApprovalsManager: React.FC = () => {
  const { paymentRequests } = useApp();

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPayments = useMemo(() => {
    return paymentRequests.filter((p) => {
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        p.userName?.toLowerCase().includes(q) ||
        p.userEmail?.toLowerCase().includes(q) ||
        (p as any).cashfreeOrderId?.toLowerCase().includes(q) ||
        (p as any).cashfreePaymentId?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [paymentRequests, filterStatus, searchQuery]);

  const pendingCount = paymentRequests.filter((p) => p.status === 'pending').length;
  const approvedCount = paymentRequests.filter((p) => p.status === 'approved').length;
  const totalRevenue = paymentRequests
    .filter((p) => p.status === 'approved')
    .reduce((sum, p) => sum + p.amount, 0);

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="space-y-6">

      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 text-white flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-bold">Auto-Verified Payments (Cashfree)</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Ye page ab read-only hai. Cashfree webhook automatically payments verify karta hai aur plans activate karta hai — koi manual approval nahi chahiye.
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pending</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock className="w-4 h-4" /></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{pendingCount}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Awaiting payment</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Approved</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-4 h-4" /></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{approvedCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Active plans</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Revenue</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><DollarSign className="w-4 h-4" /></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">From approved payments</div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-600" />
            Subscription Payment History
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Read-only view — Cashfree handles verification automatically
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, email, order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white outline-none w-60"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {(['all', 'pending', 'approved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg capitalize transition ${
                  filterStatus === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LIST */}
      {filteredPayments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No Payments Found</h4>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery ? 'Try different search keyword.' : 'No records for this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => {
            const cfo = (payment as any).cashfreeOrderId;
            const cfp = (payment as any).cashfreePaymentId;
            const verifiedVia = (payment as any).verifiedVia;
            const webhookAt = (payment as any).webhookReceivedAt;

            return (
              <div
                key={payment.id}
                className={`bg-white rounded-2xl border-2 p-5 ${
                  payment.status === 'pending'
                    ? 'border-amber-200'
                    : payment.status === 'approved'
                    ? 'border-emerald-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-4">

                  <div className="flex-1 space-y-3">
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

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        payment.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : payment.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {payment.status}
                      </span>

                      {verifiedVia && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          {verifiedVia === 'cashfree_webhook' ? 'Webhook Verified' : 'Verified'}
                        </span>
                      )}

                      <span className="text-[10px] text-slate-400 ml-auto">
                        {formatDate(payment.requestedAt)}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-700 font-mono">
                        ₹{payment.amount}
                      </span>
                      <span className="text-xs text-slate-500">via Cashfree</span>
                    </div>

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

                    {(cfo || cfp) && (
                      <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[11px]">
                        {cfo && (
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="w-3 h-3 text-blue-600" />
                            <span className="text-slate-500">Order:</span>
                            <code className="font-mono font-bold text-slate-700">{cfo}</code>
                          </div>
                        )}
                        {cfp && (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span className="text-slate-500">PayID:</span>
                            <code className="font-mono font-bold text-emerald-700">{cfp}</code>
                          </div>
                        )}
                      </div>
                    )}

                    {payment.status === 'approved' && (payment as any).validUntil && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs">
                        <div className="flex items-center gap-2 text-emerald-800">
                          <CheckCircle2 className="w-4 h-4" />
                          <strong>Activated</strong>
                          {payment.verifiedAt && (
                            <span className="text-emerald-600">{formatDate(payment.verifiedAt)}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Valid until: {new Date((payment as any).validUntil).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                        </div>
                        {webhookAt && (
                          <div className="text-[10px] text-emerald-600 mt-1">
                            Webhook received: {formatDate(webhookAt)}
                          </div>
                        )}
                      </div>
                    )}

                    {payment.status === 'pending' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                        <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          Waiting for Cashfree payment confirmation. Ye automatically update hoga jab user pay karega.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PaymentApprovalsManager;
