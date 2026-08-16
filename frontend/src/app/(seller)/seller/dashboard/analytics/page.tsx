'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api-client';
import { formatCurrency } from '@/utils/cn';
import {
  BarChart2, TrendingUp, Users, ShoppingBag, DollarSign,
  ArrowUpRight, Package, Tag, Download, Calendar, Loader2, RefreshCw
} from 'lucide-react';

const INITIAL_MONTHLY = [
  { month: 'Aug', revenue: 6400, orders: 12, customers: 8 },
  { month: 'Sep', revenue: 8900, orders: 18, customers: 11 },
  { month: 'Oct', revenue: 11200, orders: 22, customers: 15 },
  { month: 'Nov', revenue: 9800, orders: 19, customers: 13 },
  { month: 'Dec', revenue: 14500, orders: 28, customers: 19 },
  { month: 'Jan', revenue: 12300, orders: 24, customers: 16 },
  { month: 'Feb', revenue: 15600, orders: 31, customers: 22 },
  { month: 'Mar', revenue: 18900, orders: 38, customers: 28 },
  { month: 'Apr', revenue: 16400, orders: 33, customers: 24 },
  { month: 'May', revenue: 21500, orders: 42, customers: 32 },
  { month: 'Jun', revenue: 24160, orders: 48, customers: 37 },
  { month: 'Jul', revenue: 28440, orders: 56, customers: 44 },
];

const INITIAL_TOP_PRODUCTS = [
  { name: 'Organic Whole Milk 1L',   revenue: 24800, units: 620 },
  { name: 'Fresh Hilsa Fish (500g)', revenue: 18600, units: 186 },
  { name: 'Fuji Apple (1kg)',        revenue: 14200, units: 355 },
  { name: 'Premium Basmati Rice 5kg', revenue: 11800, units: 236 },
  { name: 'Cold Pressed Mustard Oil', revenue: 9600, units: 192 },
];

const INITIAL_TOP_CATEGORIES = [
  { name: 'Dairy & Eggs',  revenue: 48200, pct: 34, color: 'bg-indigo-500' },
  { name: 'Fruits',        revenue: 34100, pct: 24, color: 'bg-emerald-500' },
  { name: 'Fish & Seafood', revenue: 25600, pct: 18, color: 'bg-cyan-500' },
  { name: 'Rice & Grains',  revenue: 19800, pct: 14, color: 'bg-amber-500' },
  { name: 'Spices & Oils',  revenue: 14300, pct: 10, color: 'bg-purple-500' },
];

type Period = '3m' | '6m' | '12m';

export default function AnalyticsOverviewPage() {
  const [period, setPeriod] = useState<Period>('12m');
  const [monthlyData, setMonthlyData] = useState<any[]>(INITIAL_MONTHLY);
  const [topProducts, setTopProducts] = useState<any[]>(INITIAL_TOP_PRODUCTS);
  const [topCategories, setTopCategories] = useState<any[]>(INITIAL_TOP_CATEGORIES);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = () => {
    setLoading(true);
    fetchApi<any>('/orders/seller-analytics')
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          if (Array.isArray(d.monthlySales) && d.monthlySales.length > 0) {
            setMonthlyData(d.monthlySales);
          }
          if (Array.isArray(d.productsList) && d.productsList.length > 0) {
            setTopProducts(d.productsList);
          }
          if (Array.isArray(d.categoriesList) && d.categoriesList.length > 0) {
            setTopCategories(d.categoriesList);
          }
        }
      })
      .catch((err) => console.error('Failed to load seller analytics:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const resetData = () => {
    loadAnalytics();
  };

  const slicedData = period === '3m' ? monthlyData.slice(-3) : period === '6m' ? monthlyData.slice(-6) : monthlyData;
  const maxRev = Math.max(...slicedData.map((m) => m.revenue), 1);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Dashboard / Analytics</p>
          <h1 className="font-black text-white text-xl flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" /> Store Analytics & Insights
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Comprehensive performance analytics for your store</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={resetData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-colors"
            title="Reset & Recalculate Analytics Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Reset Data
          </button>
          {(['3m', '6m', '12m'] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${period === p ? 'bg-indigo-600 text-white' : 'bg-[#1e1f32] text-slate-400 hover:text-white border border-white/10'}`}>
              {p}
            </button>
          ))}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',   value: '৳1,42,800', change: '+18.4%', up: true,  icon: DollarSign, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
          { label: 'Total Orders',    value: '375',        change: '+22.1%', up: true,  icon: ShoppingBag, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Unique Customers', value: '248',       change: '+14.6%', up: true,  icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
          { label: 'Avg Order Value', value: '৳380.8',     change: '-3.2%',  up: false, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        ].map((k) => (
          <div key={k.label} className={`rounded-2xl border ${k.bg} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <k.icon className={`w-5 h-5 ${k.color}`} />
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${k.up ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {k.change}
              </span>
            </div>
            <p className={`font-black text-lg ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-400 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Bar Chart */}
      <div className="rounded-2xl bg-[#1e1f32] border border-white/10 p-5">
        <h2 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" /> Monthly Revenue
        </h2>
        <div className="flex items-end gap-2 h-40">
          {slicedData.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <p className="text-[9px] text-slate-500 font-semibold">৳{(m.revenue / 1000).toFixed(0)}k</p>
              <div className="w-full rounded-t-lg bg-gradient-to-t from-indigo-700 to-indigo-400 hover:from-indigo-600 hover:to-indigo-300 transition-colors cursor-pointer"
                style={{ height: `${(m.revenue / maxRev) * 120}px` }} title={`৳${formatCurrency(m.revenue)}`} />
              <p className="text-[10px] text-slate-500">{m.month}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid: Top Products + Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top Products */}
        <div className="rounded-2xl bg-[#1e1f32] border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-400" /> Top 5 Products
            </h2>
            <Link href="/seller/dashboard/analytics/products" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">View All</Link>
          </div>
          <div className="divide-y divide-white/5">
            {topProducts.map((p, i) => (
              <div key={p.name} className="px-4 py-3 flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                  <p className="text-[11px] text-slate-500">{p.units} units sold</p>
                </div>
                <p className="text-xs font-bold text-emerald-400 shrink-0">৳{formatCurrency(p.revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-2xl bg-[#1e1f32] border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-400" /> Revenue by Category
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {topCategories.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">{c.name}</span>
                  <span className="text-slate-400">৳{formatCurrency(c.revenue)} ({c.pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full rounded-full ${c.color} transition-all`} style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-page Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Sales',     href: '/seller/dashboard/analytics',           icon: ShoppingBag },
          { label: 'Revenue',   href: '/seller/dashboard/analytics/revenue',   icon: DollarSign },
          { label: 'Products',  href: '/seller/dashboard/analytics/products',  icon: Package },
          { label: 'Customers', href: '/seller/dashboard/analytics/customers', icon: Users },
        ].map((l) => (
          <Link key={l.label} href={l.href}
            className="group rounded-2xl bg-[#1e1f32] border border-white/10 hover:border-indigo-500/40 p-4 flex flex-col gap-2 transition-all hover:bg-white/5">
            <l.icon className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300" />
            <p className="font-bold text-sm text-white group-hover:text-indigo-300">{l.label} Analytics</p>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
