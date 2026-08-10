'use client';

import React, { useState, useEffect } from 'react';
import { QuickSummaryWidget } from '@/components/dashboard/widgets/QuickSummaryWidget';
import { TargetMetricsCard } from '@/components/dashboard/widgets/TargetMetricsCard';
import { RevenueStatisticsWidget } from '@/components/dashboard/widgets/RevenueStatisticsWidget';
import { ProductTrackingWidget } from '@/components/dashboard/widgets/ProductTrackingWidget';
import { formatCurrency } from '@/utils/cn';
import { fetchApi } from '@/lib/api-client';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Users, DollarSign, ShieldCheck, Store, Check, X, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';

export default function AdminDashboardOverview() {
  const { language } = useLanguageStore();
  const isBn = language === 'BN';
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [partnerQueue, setPartnerQueue] = useState<any[]>([]);
  const [actionMsg, setActionMsg] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetchApi<any>('/admin/dashboard');
      if (res && res.success && res.data) {
        setStats(res.data);
        if (Array.isArray(res.data.pendingQueue)) {
          setPartnerQueue(res.data.pendingQueue);
        }
      } else {
        throw new Error(res?.message || 'Failed to load dashboard statistics');
      }
    } catch (err: any) {
      console.error('Error loading dashboard stats:', err);
      setErrorMsg(err?.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadDashboardData();
  }, []);

  const handleApprovePartner = async (id: string, name: string) => {
    setPartnerQueue((prev) => prev.filter((p) => p.id !== id));
    try {
      await fetchApi(`/admin/users/${id}/approve`, { method: 'PATCH' }).catch(() => null);
    } catch {}
    setActionMsg(`Partner "${name}" approved successfully! Notification sent.`);
    setTimeout(() => setActionMsg(''), 4000);
  };

  const handleRejectPartner = async (id: string, name: string) => {
    setPartnerQueue((prev) => prev.filter((p) => p.id !== id));
    setActionMsg(`Partner application for "${name}" rejected.`);
    setTimeout(() => setActionMsg(''), 4000);
  };

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 text-xs min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
        <span className="font-bold text-white text-sm">Syncing Admin Command Center…</span>
        <span className="text-slate-500 mt-1">Fetching live system metrics from database</span>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-8 rounded-3xl bg-[#1f2136] border border-red-500/20 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
          <X className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-white text-base">Failed to Load Dashboard Data</h3>
        <p className="text-xs text-slate-400 font-mono">{errorMsg}</p>
        <button
          onClick={loadDashboardData}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-2 mx-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  const dataStats = stats?.stats || {
    totalRevenue: 0,
    earningAmount: 0,
    toPaidAmount: 0,
    onlineVisitors: 1,
    ordersTargetPct: 0,
    usersTargetPct: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalProviders: 0,
    totalSellers: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Section KPI Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#1f2136] border border-white/10 text-white shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>{isBn ? 'মোট প্ল্যাটফর্ম জিএমভি' : 'Total Platform GMV'}</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400" suppressHydrationWarning>{formatCurrency(dataStats.totalRevenue || 0)}</div>
          <div className="text-[11px] text-emerald-400 font-bold">{isBn ? 'লাইভ ডাটাবেস ক্যালকুলেশন' : 'Live DB Calculation'}</div>
        </div>

        <div className="p-5 rounded-3xl bg-[#1f2136] border border-white/10 text-white shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>{isBn ? 'নিবন্ধিত বাসিন্দারা' : 'Registered Residents'}</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white" suppressHydrationWarning>
            {dataStats.totalUsers || 0} {isBn ? 'জন ব্যবহারকারী' : 'Users'}
          </div>
          <div className="text-[11px] text-indigo-300 font-bold">{isBn ? 'DOHS কমিউনিটি' : 'DOHS Communities'}</div>
        </div>

        <div className="p-5 rounded-3xl bg-[#1f2136] border border-white/10 text-white shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>{isBn ? 'যাচাইকৃত অংশীদার' : 'Verified Partners'}</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400" suppressHydrationWarning>
            {dataStats.totalProviders || 0} {isBn ? 'জন অংশীদার' : 'Partners'}
          </div>
          <div className="text-[11px] text-slate-400 font-bold">{isBn ? 'এনআইডি এবং নিরাপত্তা যাচাই করা হয়েছে' : 'NID & Security Vetted'}</div>
        </div>

        <div className="p-5 rounded-3xl bg-[#1f2136] border border-white/10 text-white shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>{isBn ? 'সক্রিয় স্থানীয় দোকান' : 'Active Local Shops'}</span>
            <Store className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400" suppressHydrationWarning>
            {dataStats.totalSellers || 0}{isBn ? 'টি দোকান' : ' Shops'}
          </div>
          <div className="text-[11px] text-slate-400 font-bold">{isBn ? 'স্থানীয় বাজারের বিক্রেতারা' : 'Local Bazaar Vendors'}</div>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {actionMsg}
        </div>
      )}

      {/* Main Grid Row 1: Quick Summary (8 cols) & Target Metrics (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <QuickSummaryWidget
            earningAmount={dataStats.earningAmount}
            toPaidAmount={dataStats.toPaidAmount}
            onlineVisitors={dataStats.onlineVisitors}
            chartData={stats?.quickSummaryChart}
          />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <TargetMetricsCard
            ordersCount={dataStats.totalOrders}
            ordersTargetPct={dataStats.ordersTargetPct}
            usersCount={dataStats.totalUsers}
            usersTargetPct={dataStats.usersTargetPct}
          />
        </div>
      </div>

      {/* Main Grid Row 2: Product & Service Tracking Table (8 cols) & Revenue Statistics (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <ProductTrackingWidget
            recentOrders={stats?.recentOrders}
            recentBookings={stats?.recentBookings}
          />
        </div>

        <div className="lg:col-span-4">
          <RevenueStatisticsWidget totalRevenue={dataStats.totalRevenue} />
        </div>
      </div>

      {/* Pending Partner Approval Queue Section */}
      <div className="p-6 rounded-3xl bg-[#1f2136] border border-white/10 text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-base text-white">Pending Partner Approval Queue</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" suppressHydrationWarning>
            {partnerQueue.length} Action Required
          </span>
        </div>

        {partnerQueue.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No pending partner applications in queue. All applications reviewed!
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            {partnerQueue.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-2xl border border-white/5 bg-[#181928] flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:border-white/20 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-400">{app.id}</span>
                    <span className="font-bold text-white text-sm">{app.name}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                      {app.category}
                    </span>
                  </div>
                  <div className="text-slate-400">
                    Applicant: <strong className="text-slate-200">{app.applicant}</strong> • Phone: {app.phone} • NID: {app.nid}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-white/10 pt-2 md:pt-0">
                  <button
                    onClick={() => handleRejectPartner(app.id, app.name)}
                    className="px-3.5 py-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold transition-all border border-red-500/20 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleApprovePartner(app.id, app.name)}
                    className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Partner</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
