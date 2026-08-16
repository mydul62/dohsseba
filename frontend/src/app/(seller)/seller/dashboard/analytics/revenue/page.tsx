import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/cn';
import { DollarSign, TrendingUp, Download, ArrowUpRight, ArrowDownRight, Percent, RefreshCw } from 'lucide-react';
import { fetchApi } from '@/lib/api-client';

const INITIAL_DATA = [
  { month: 'Aug 25', gross: 6400,  commission: 640,  net: 5760 },
  { month: 'Sep 25', gross: 8900,  commission: 890,  net: 8010 },
  { month: 'Oct 25', gross: 11200, commission: 1120, net: 10080 },
  { month: 'Nov 25', gross: 9800,  commission: 980,  net: 8820 },
  { month: 'Dec 25', gross: 14500, commission: 1450, net: 13050 },
  { month: 'Jan 26', gross: 12300, commission: 1230, net: 11070 },
  { month: 'Feb 26', gross: 15600, commission: 1560, net: 14040 },
  { month: 'Mar 26', gross: 18900, commission: 1890, net: 17010 },
  { month: 'Apr 26', gross: 16400, commission: 1640, net: 14760 },
  { month: 'May 26', gross: 21500, commission: 2150, net: 19350 },
  { month: 'Jun 26', gross: 24160, commission: 2416, net: 21744 },
  { month: 'Jul 26', gross: 28440, commission: 2844, net: 25596 },
];

export default function RevenueAnalyticsPage() {
  const [active, setActive] = useState<string | null>(null);
  const [dataList, setDataList] = useState<any[]>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    fetchApi<any>('/orders/seller-analytics')
      .then((res) => {
        if (res.success && res.data?.monthlySales) {
          setDataList(res.data.monthlySales);
        }
      })
      .catch((err) => console.error('Failed to load revenue analytics:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalGross  = dataList.reduce((a, d) => a + (d.gross || 0), 0);
  const totalCommission = dataList.reduce((a, d) => a + (d.commission || 0), 0);
  const totalNet    = dataList.reduce((a, d) => a + (d.net || 0), 0);
  const maxGross    = Math.max(...dataList.map(d => d.gross || 0), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Analytics / Revenue</p>
          <h1 className="font-black text-white text-xl flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-400" /> Revenue Analytics
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-colors"
            title="Reset & Recalculate Revenue Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Reset Data
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/10 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Gross Revenue', value: totalGross,      color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', icon: ArrowUpRight },
          { label: 'Commission',    value: totalCommission, color: 'text-rose-400',   bg: 'bg-rose-500/10 border-rose-500/20',     icon: Percent },
          { label: 'Net Earnings',  value: totalNet,        color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: TrendingUp },
        ].map((c) => (
          <div key={c.label} className={`rounded-2xl border ${c.bg} p-4 text-center`}>
            <c.icon className={`w-5 h-5 ${c.color} mx-auto mb-2`} />
            <p className={`font-black text-xl ${c.color}`}>৳{formatCurrency(c.value)}</p>
            <p className="text-xs text-slate-400 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="rounded-2xl bg-[#1e1f32] border border-white/10 p-5">
        <h2 className="font-bold text-white text-sm mb-4">Monthly Gross vs Net Revenue</h2>
        <div className="flex items-end gap-1.5 h-48">
          {DATA.map((d) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setActive(active === d.month ? null : d.month)}>
              <div className="w-full flex gap-0.5 items-end" style={{ height: '160px' }}>
                <div className="flex-1 rounded-t-md bg-indigo-500/50 group-hover:bg-indigo-500 transition-colors"
                  style={{ height: `${(d.gross / maxGross) * 160}px` }} />
                <div className="flex-1 rounded-t-md bg-emerald-500/50 group-hover:bg-emerald-500 transition-colors"
                  style={{ height: `${(d.net / maxGross) * 160}px` }} />
              </div>
              <p className="text-[9px] text-slate-500 text-center leading-tight">{d.month.slice(0, 3)}</p>
            </div>
          ))}
        </div>
        {active && (() => {
          const d = DATA.find(x => x.month === active)!;
          return (
            <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-300 flex gap-6">
              <span><span className="font-bold text-white">{d.month}</span></span>
              <span>Gross: <span className="font-bold text-indigo-400">৳{formatCurrency(d.gross)}</span></span>
              <span>Commission: <span className="font-bold text-rose-400">-৳{formatCurrency(d.commission)}</span></span>
              <span>Net: <span className="font-bold text-emerald-400">৳{formatCurrency(d.net)}</span></span>
            </div>
          );
        })()}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#1e1f32] border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-bold text-white text-sm">Monthly Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-widest border-b border-white/10">
                <th className="px-4 py-3 text-left">Month</th>
                <th className="px-4 py-3 text-right">Gross</th>
                <th className="px-4 py-3 text-right">Commission (10%)</th>
                <th className="px-4 py-3 text-right">Net Earnings</th>
                <th className="px-4 py-3 text-right">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {DATA.map((d, i) => {
                const prev = DATA[i - 1];
                const growth = prev ? ((d.gross - prev.gross) / prev.gross * 100).toFixed(1) : '—';
                const isUp = prev ? d.gross >= prev.gross : true;
                return (
                  <tr key={d.month} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">{d.month}</td>
                    <td className="px-4 py-3 text-right text-indigo-300">৳{formatCurrency(d.gross)}</td>
                    <td className="px-4 py-3 text-right text-rose-400">-৳{formatCurrency(d.commission)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">৳{formatCurrency(d.net)}</td>
                    <td className="px-4 py-3 text-right">
                      {growth !== '—' ? (
                        <span className={`flex items-center justify-end gap-1 text-xs font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {growth}%
                        </span>
                      ) : <span className="text-slate-500">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
