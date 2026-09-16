import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp, TrendingDown, BarChart3, Users, Store, FileText,
  Smartphone, DollarSign, Calendar, Download, Activity,
  Award, Target, Wallet, CheckCircle2, XCircle, Clock,
  CreditCard, Layers, ArrowRight, MapPin,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
type DateRange = '7d' | '30d' | '90d' | 'all';

// ============================================
// HELPERS
// ============================================
const formatCurrency = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
};

const formatNumber = (n: number) => {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
};

const getDateRangeDays = (range: DateRange): number => {
  switch (range) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case 'all': return 9999;
  }
};

const isWithinRange = (dateStr: string | undefined, range: DateRange): boolean => {
  if (range === 'all') return true;
  if (!dateStr) return false;
  const days = getDateRangeDays(range);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return new Date(dateStr) >= cutoff;
};

// Get previous period for trend comparison
const isWithinPreviousRange = (dateStr: string | undefined, range: DateRange): boolean => {
  if (range === 'all' || !dateStr) return false;
  const days = getDateRangeDays(range);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - days);
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days * 2);
  startDate.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  return d >= startDate && d <= endDate;
};

// ============================================
// SVG BAR CHART
// ============================================
const BarChart: React.FC<{
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}> = ({ data, color = '#3b82f6', height = 180 }) => {
  if (data.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-slate-400 text-xs">
        No data
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;

  return (
    <div className="w-full">
      <svg viewBox="0 0 100 60" className="w-full" style={{ height }} preserveAspectRatio="none">
        {data.map((d, i) => {
          const barHeight = (d.value / maxValue) * 50;
          const x = i * barWidth + barWidth * 0.15;
          const y = 55 - barHeight;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth * 0.7}
                height={barHeight}
                fill={color}
                rx="0.5"
              />
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between mt-2 text-[9px] text-slate-500 font-semibold">
        {data.filter((_, i) => data.length <= 10 || i % Math.ceil(data.length / 7) === 0).map((d, i) => (
          <span key={i} className="truncate">{d.label}</span>
        ))}
      </div>
    </div>
  );
};

// ============================================
// SVG DONUT CHART
// ============================================
const DonutChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  size?: number;
}> = ({ data, size = 140 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-xs text-slate-400">No data</span>
      </div>
    );
  }

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
        {data.map((d, i) => {
          const dashLength = (d.value / total) * circumference;
          const dashOffset = -offset;
          offset += dashLength;
          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth="12"
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
            />
          );
        })}
      </svg>
      <div className="space-y-1.5 flex-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="font-bold text-slate-700 flex-1 truncate">{d.label}</span>
            <span className="font-mono font-bold text-slate-900">
              {total > 0 ? `${((d.value / total) * 100).toFixed(0)}%` : '0%'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// KPI CARD
// ============================================
const KPICard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  sublabel?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'indigo';
}> = ({ label, value, icon, trend, sublabel, color = 'blue' }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    rose: 'from-rose-500 to-pink-600',
    indigo: 'from-indigo-500 to-indigo-600',
  }[color];

  const trendUp = trend !== undefined && trend > 0;
  const trendDown = trend !== undefined && trend < 0;

  return (
    <div className={`bg-gradient-to-br ${colorClasses} p-5 rounded-2xl text-white shadow-md relative overflow-hidden`}>
      <div className="absolute -right-4 -top-4 opacity-10">
        <div className="w-24 h-24">{icon}</div>
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">{label}</span>
          <div className="opacity-80">{icon}</div>
        </div>
        <div className="text-2xl font-black font-mono">{value}</div>
        <div className="flex items-center gap-2 mt-2">
          {trend !== undefined && (
            <span className={`flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              trendUp ? 'bg-emerald-400/30 text-emerald-100' : trendDown ? 'bg-rose-400/30 text-rose-100' : 'bg-white/20'
            }`}>
              {trendUp ? <TrendingUp className="w-2.5 h-2.5" /> : trendDown ? <TrendingDown className="w-2.5 h-2.5" /> : null}
              {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
            </span>
          )}
          {sublabel && <span className="text-[10px] opacity-80 font-semibold">{sublabel}</span>}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export const OwnerAnalytics: React.FC = () => {
  const {
    orders,
    vles,
    rechargeOrders,
    paymentRequests,
    transactions,
    siteConfig,
  } = useApp();

  const [range, setRange] = useState<DateRange>('30d');

  // ============================================
  // FILTERED DATA
  // ============================================
  const filteredData = useMemo(() => {
    const filteredOrders = orders.filter((o) => isWithinRange(o.date, range));
    const filteredRecharges = rechargeOrders.filter((r) => isWithinRange(r.createdAt, range));
    const filteredPayments = paymentRequests.filter((p) => isWithinRange(p.requestedAt, range));

    const prevOrders = orders.filter((o) => isWithinPreviousRange(o.date, range));
    const prevRecharges = rechargeOrders.filter((r) => isWithinPreviousRange(r.createdAt, range));
    const prevPayments = paymentRequests.filter((p) => isWithinPreviousRange(p.requestedAt, range));

    return {
      orders: filteredOrders,
      recharges: filteredRecharges,
      payments: filteredPayments,
      prevOrders,
      prevRecharges,
      prevPayments,
    };
  }, [orders, rechargeOrders, paymentRequests, range]);

  // ============================================
  // KPIs
  // ============================================
  const kpis = useMemo(() => {
    // Revenue
    const currentRevenue =
      filteredData.orders.reduce((s, o) => s + o.amount, 0) +
      filteredData.recharges.filter((r) => r.status === 'completed').reduce((s, r) => s + r.amount, 0);
    const prevRevenue =
      filteredData.prevOrders.reduce((s, o) => s + o.amount, 0) +
      filteredData.prevRecharges.filter((r) => r.status === 'completed').reduce((s, r) => s + r.amount, 0);
    const revenueTrend = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    // Orders
    const currentOrders = filteredData.orders.length;
    const prevOrdersCount = filteredData.prevOrders.length;
    const ordersTrend = prevOrdersCount > 0 ? ((currentOrders - prevOrdersCount) / prevOrdersCount) * 100 : 0;

    // Recharges
    const currentRecharges = filteredData.recharges.length;
    const prevRechargesCount = filteredData.prevRecharges.length;
    const rechargesTrend = prevRechargesCount > 0 ? ((currentRecharges - prevRechargesCount) / prevRechargesCount) * 100 : 0;

    // VLEs
    const activeVles = vles.filter((v) => v.status === 'active').length;

    // Payments
    const totalPaymentRevenue = filteredData.payments
      .filter((p) => p.status === 'approved')
      .reduce((s, p) => s + p.amount, 0);

    return {
      currentRevenue,
      revenueTrend,
      currentOrders,
      ordersTrend,
      currentRecharges,
      rechargesTrend,
      activeVles,
      totalVles: vles.length,
      totalPaymentRevenue,
    };
  }, [filteredData, vles]);

  // ============================================
  // REVENUE TREND CHART DATA
  // ============================================
  const revenueChartData = useMemo(() => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 30;
    const buckets: Record<string, number> = {};

    // Initialize buckets
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = range === '90d' ? `${d.getFullYear()}-W${Math.ceil((d.getDate() + d.getMonth() * 30) / 7)}` : d.toISOString().split('T')[0];
      buckets[key] = 0;
    }

    // Fill order revenue
    filteredData.orders.forEach((o) => {
      if (!o.date) return;
      const d = new Date(o.date);
      const key = range === '90d' ? `${d.getFullYear()}-W${Math.ceil((d.getDate() + d.getMonth() * 30) / 7)}` : o.date;
      if (key in buckets) buckets[key] += o.amount;
    });

    // Fill recharge revenue
    filteredData.recharges.forEach((r) => {
      if (r.status !== 'completed' || !r.createdAt) return;
      const d = new Date(r.createdAt);
      const key = range === '90d' ? `${d.getFullYear()}-W${Math.ceil((d.getDate() + d.getMonth() * 30) / 7)}` : d.toISOString().split('T')[0];
      if (key in buckets) buckets[key] += r.amount;
    });

    const entries = Object.entries(buckets);
    const step = Math.max(1, Math.floor(entries.length / 12));
    return entries
      .filter((_, i) => i % step === 0 || i === entries.length - 1)
      .map(([key, value]) => ({
        label: range === '90d'
          ? key.split('-')[1] || key
          : new Date(key).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        value: Math.round(value),
      }));
  }, [filteredData, range]);

  // ============================================
  // ORDER TYPE DISTRIBUTION
  // ============================================
  const orderDistribution = useMemo(() => {
    const photoOrders = filteredData.orders.filter((o) =>
      o.serviceName?.toLowerCase().includes('photo') ||
      o.serviceName?.toLowerCase().includes('passport') ||
      o.serviceName?.toLowerCase().includes('sign')
    ).length;
    const rechargeCount = filteredData.recharges.length;
    const serviceOrders = filteredData.orders.length - photoOrders;

    return [
      { label: 'Service Orders', value: serviceOrders, color: '#3b82f6' },
      { label: 'Photo Tasks', value: photoOrders, color: '#8b5cf6' },
      { label: 'Recharge', value: rechargeCount, color: '#10b981' },
    ].filter((d) => d.value > 0);
  }, [filteredData]);

  // ============================================
  // TOP VLEs
  // ============================================
  const topVles = useMemo(() => {
    return [...vles]
      .map((v) => {
        const vleOrders = filteredData.orders.filter((o) => o.vleId === v.vleId);
        const vleRecharges = filteredData.recharges.filter((r) => r.vleId === v.vleId && r.status === 'completed');
        const revenue =
          vleOrders.reduce((s, o) => s + o.amount, 0) +
          vleRecharges.reduce((s, r) => s + r.amount, 0);
        return {
          ...v,
          revenue,
          orders: vleOrders.length + vleRecharges.length,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [vles, filteredData]);

  // ============================================
  // RECENT ACTIVITY FEED
  // ============================================
  const activityFeed = useMemo(() => {
    const items: {
      type: 'order' | 'recharge' | 'payment';
      title: string;
      subtitle: string;
      amount: number;
      date: string;
      status: string;
    }[] = [];

    filteredData.orders.slice(0, 5).forEach((o) => {
      items.push({
        type: 'order',
        title: o.customerName,
        subtitle: o.serviceName,
        amount: o.amount,
        date: o.date,
        status: o.status,
      });
    });

    filteredData.recharges.slice(0, 5).forEach((r) => {
      items.push({
        type: 'recharge',
        title: `${r.operator} - ${r.accountNumber}`,
        subtitle: r.vleCenterName || 'User Order',
        amount: r.amount,
        date: r.createdAt,
        status: r.status,
      });
    });

    filteredData.payments.slice(0, 5).forEach((p) => {
      items.push({
        type: 'payment',
        title: `${p.userName} - ${p.plan}`,
        subtitle: p.userEmail,
        amount: p.amount,
        date: p.requestedAt,
        status: p.status,
      });
    });

    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [filteredData]);

  // ============================================
  // EXPORT CSV
  // ============================================
  const handleExport = () => {
    const csv = [
      ['Type', 'Title', 'Subtitle', 'Amount', 'Date', 'Status'],
      ...activityFeed.map((a) => [a.type, a.title, a.subtitle, a.amount, a.date, a.status]),
    ]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${range}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Analytics Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time business insights — revenue, orders, VLEs, aur recharge stats.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['7d', '30d', '90d', 'all'] as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  range === r
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r === '90d' ? '90 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Revenue"
          value={formatCurrency(kpis.currentRevenue)}
          icon={<DollarSign className="w-6 h-6" />}
          trend={kpis.revenueTrend}
          sublabel={`vs previous ${range === 'all' ? 'period' : range}`}
          color="emerald"
        />
        <KPICard
          label="Service Orders"
          value={kpis.currentOrders}
          icon={<FileText className="w-6 h-6" />}
          trend={kpis.ordersTrend}
          sublabel="customer applications"
          color="blue"
        />
        <KPICard
          label="Recharge Orders"
          value={kpis.currentRecharges}
          icon={<Smartphone className="w-6 h-6" />}
          trend={kpis.rechargesTrend}
          sublabel="mobile + DTH + utility"
          color="purple"
        />
        <KPICard
          label="Active VLEs"
          value={`${kpis.activeVles}/${kpis.totalVles}`}
          icon={<Store className="w-6 h-6" />}
          sublabel="authorized centers"
          color="amber"
        />
      </div>

      {/* ═══ CHARTS ROW ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Revenue Trend
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Total: <strong className="text-emerald-600">{formatCurrency(kpis.currentRevenue)}</strong>
              </p>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : range === '90d' ? 'Last 90 Days' : 'All Time'}
            </span>
          </div>
          <BarChart data={revenueChartData} color="#10b981" height={200} />
        </div>

        {/* Order Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-purple-600" />
            Order Distribution
          </h3>
          <DonutChart data={orderDistribution} size={140} />
        </div>
      </div>

      {/* ═══ SECONDARY KPIs ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-5 h-5 text-amber-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">VLE Wallets</span>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {formatCurrency(vles.reduce((s, v) => s + v.walletBalance, 0))}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Total advance pool</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Subscriptions</span>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {formatCurrency(kpis.totalPaymentRevenue)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {filteredData.payments.filter((p) => p.status === 'approved').length} approved
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Pending</span>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {filteredData.payments.filter((p) => p.status === 'pending').length +
              filteredData.recharges.filter((r) => r.status === 'payment_submitted').length}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Awaiting action</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Success Rate</span>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {filteredData.orders.length + filteredData.recharges.length > 0
              ? Math.round(
                  ((filteredData.orders.filter((o) => o.status === 'completed').length +
                    filteredData.recharges.filter((r) => r.status === 'completed').length) /
                    (filteredData.orders.length + filteredData.recharges.length)) *
                    100
                )
              : 0}
            %
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Completion rate</p>
        </div>
      </div>

      {/* ═══ TOP VLEs + ACTIVITY FEED ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top VLEs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            Top Performing VLEs
          </h3>
          {topVles.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No VLE data available
            </div>
          ) : (
            <div className="space-y-2">
              {topVles.map((vle, idx) => (
                <div
                  key={vle.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' :
                    idx === 1 ? 'bg-slate-200 text-slate-700' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-slate-900 truncate">{vle.centerName}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                      <MapPin className="w-2.5 h-2.5" />
                      {vle.district}, {vle.state}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-emerald-600 font-mono">
                      {formatCurrency(vle.revenue)}
                    </div>
                    <div className="text-[10px] text-slate-500">{vle.orders} jobs</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-600" />
            Recent Activity
          </h3>
          {activityFeed.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No recent activity
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {activityFeed.map((item, idx) => {
                const typeConfig = {
                  order: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
                  recharge: { icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-100' },
                  payment: { icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                }[item.type];
                const Icon = typeConfig.icon;

                return (
                  <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition">
                    <div className={`w-8 h-8 rounded-lg ${typeConfig.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${typeConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{item.title}</div>
                      <div className="text-[10px] text-slate-500 truncate">{item.subtitle}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-slate-900 font-mono">₹{item.amount}</div>
                      <div className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        item.status === 'completed' || item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        item.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {item.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-slate-600 font-semibold">
          📊 Data refreshes in <strong>real-time</strong> from Firebase
        </div>
        <div className="flex items-center gap-3 text-slate-500 font-mono">
          <span>Orders: {orders.length}</span>
          <span>•</span>
          <span>Recharges: {rechargeOrders.length}</span>
          <span>•</span>
          <span>VLEs: {vles.length}</span>
        </div>
      </div>
    </div>
  );
};
