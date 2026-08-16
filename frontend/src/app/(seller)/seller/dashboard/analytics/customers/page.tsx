'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/cn';
import { Users, TrendingUp, ShoppingBag, Star, Download, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { fetchApi } from '@/lib/api-client';

const INITIAL_MONTHLY_NEW = [
  { month: 'Aug', new: 8,  returning: 3 },
  { month: 'Sep', new: 11, returning: 5 },
  { month: 'Oct', new: 15, returning: 8 },
  { month: 'Nov', new: 13, returning: 9 },
  { month: 'Dec', new: 19, returning: 12 },
  { month: 'Jan', new: 16, returning: 11 },
  { month: 'Feb', new: 22, returning: 14 },
  { month: 'Mar', new: 28, returning: 18 },
  { month: 'Apr', new: 24, returning: 16 },
  { month: 'May', new: 32, returning: 22 },
  { month: 'Jun', new: 37, returning: 26 },
  { month: 'Jul', new: 44, returning: 31 },
];

const INITIAL_TOP_CUSTOMERS = [
  { name: 'Rahim Ahmed',    orders: 18, spent: 12400, lastOrder: '28 Jul 2026', vip: true },
  { name: 'Fatima Islam',   orders: 15, spent: 9800,  lastOrder: '26 Jul 2026', vip: true },
  { name: 'Karim Hassan',   orders: 12, spent: 7600,  lastOrder: '24 Jul 2026', vip: true },
  { name: 'Nadia Rahman',   orders: 9,  spent: 5200,  lastOrder: '22 Jul 2026', vip: false },
  { name: 'Sumon Chowdhury',orders: 7,  spent: 4100,  lastOrder: '19 Jul 2026', vip: false },
];

export default function CustomerAnalyticsPage() {
  const [monthlyNew, setMonthlyNew] = useState<any[]>(INITIAL_MONTHLY_NEW);
  const [topCustomers, setTopCustomers] = useState<any[]>(INITIAL_TOP_CUSTOMERS);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    fetchApi<any>('/orders/seller-analytics')
      .then((res) => {
        if (res.success && res.data) {
          if (Array.isArray(res.data.monthlySales) && res.data.monthlySales.length > 0) {
            setMonthlyNew(res.data.monthlySales);
          }
          if (Array.isArray(res.data.customersList) && res.data.customersList.length > 0) {
            setTopCustomers(res.data.customersList);
          }
        }
      })
      .catch((err) => console.error('Failed to load customer analytics:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const maxNewCustomers = Math.max(...monthlyNew.map(m => (m.new || 0) + (m.returning || 0)), 1);
  const totalNew = monthlyNew.reduce((a, m) => a + (m.new || 0), 0);
  const totalRet = monthlyNew.reduce((a, m) => a + (m.returning || 0), 0);
  const totalAll = totalNew + totalRet || 1;
  const retentionRate = ((totalRet / totalAll) * 100).toFixed(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Analytics / Customers</p>
          <h1 className="font-black text-white text-xl flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" /> Customer Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">New vs returning customers, retention rate, and top spenders</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-colors"
            title="Reset & Recalculate Customer Analytics Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Reset Data
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/10 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Customers', value: '248',         icon: Users,      color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
          { label: 'New This Year',   value: String(totalNew), icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Returning',       value: String(totalRet), icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
          { label: 'Retention Rate',  value: `${retentionRate}%`, icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        ].map((k) => (
          <div key={k.label} className={`rounded-2xl border ${k.bg} p-4`}>
            <k.icon className={`w-5 h-5 ${k.color} mb-3`} />
            <p className={`font-black text-xl ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-400 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Stacked Bar Chart */}
      <div className="rounded-2xl bg-[#1e1f32] border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white text-sm">Monthly: New vs Returning Customers</h2>
          <div className="flex gap-3 text-[10px]">
            <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2 h-2 rounded-full bg-indigo-500" />New</span>
            <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2 h-2 rounded-full bg-emerald-500" />Returning</span>
          </div>
        </div>
        <div className="flex items-end gap-2 h-36">
          {monthlyNew.map((m) => {
            const total = m.new + m.returning;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col-reverse rounded-t-md overflow-hidden" style={{ height: `${(total / maxNewCustomers) * 120}px` }}>
                  <div className="bg-indigo-500/70" style={{ height: `${(m.new / total) * 100}%` }} />
                  <div className="bg-emerald-500/70" style={{ height: `${(m.returning / total) * 100}%` }} />
                </div>
                <p className="text-[10px] text-slate-500">{m.month}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Customers */}
      <div className="rounded-2xl bg-[#1e1f32] border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-bold text-white text-sm flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-indigo-400" /> Top Spending Customers
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-widest border-b border-white/10">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-right">Orders</th>
                <th className="px-4 py-3 text-right">Total Spent</th>
                <th className="px-4 py-3 text-center">Last Order</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {TOP_CUSTOMERS.map((c, i) => (
                <tr key={c.name} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-slate-500 font-bold text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[11px] font-black shrink-0">
                        {c.name[0]}
                      </div>
                      <p className="font-semibold text-white text-sm">{c.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">{c.orders}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-400">৳{formatCurrency(c.spent)}</td>
                  <td className="px-4 py-3 text-center text-xs text-slate-400">{c.lastOrder}</td>
                  <td className="px-4 py-3 text-center">
                    {c.vip
                      ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">VIP</span>
                      : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400">Regular</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
