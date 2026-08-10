'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api-client';
import { formatCurrency } from '@/utils/cn';
import {
  Users, Bike, Phone, Search, RefreshCw, CheckCircle2,
  XCircle, Star, ShieldCheck, DollarSign, TrendingUp,
  Package, AlertTriangle, Loader2, ArrowUpRight,
} from 'lucide-react';

export default function SellerRidersContent() {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<any>('/seller/riders');
      if (res.success && Array.isArray(res.data)) {
        setRiders(res.data);
      } else {
        setRiders([]);
      }
    } catch (_) {
      setRiders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  // Filter logic
  const filteredRiders = riders.filter((r) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.name?.toLowerCase().includes(q) ||
      r.phone?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.vehicleNo?.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ONLINE'
        ? r.isOnline
        : !r.isOnline;

    return matchesSearch && matchesStatus;
  });

  // Fleet Overall Totals
  const totalFleetCount = riders.length;
  const onlineCount = riders.filter((r) => r.isOnline).length;
  const totalFleetDeliveredValue = riders.reduce((acc, r) => acc + Number(r.totalDeliveredValue || 0), 0);
  const totalFleetEarnings = riders.reduce((acc, r) => acc + Number(r.totalEarnings || 0), 0);

  return (
    <div className="space-y-6 select-none">
      
      {/* ── Header Title & Refresh ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-black text-white text-xl flex items-center gap-2">
            <Bike className="w-6 h-6 text-indigo-400" />
            <span>Riders Roster & Fleet Performance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track total delivery volume, earnings, order completion & cancellation stats per rider.
          </p>
        </div>

        <button
          onClick={fetchRiders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Roster</span>
        </button>
      </div>

      {/* ── Fleet Metric Summary Grid (4 Cards) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Total Riders */}
        <div className="p-4 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl flex flex-col justify-between h-28">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Fleet Riders</span>
            <div className="w-7 h-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalFleetCount}</div>
        </div>

        {/* Card 2: Online Riders */}
        <div className="p-4 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl flex flex-col justify-between h-28">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">On Duty Now</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{onlineCount}</div>
        </div>

        {/* Card 3: Total Delivered Order Value */}
        <div className="p-4 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl flex flex-col justify-between h-28">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Delivered Value</span>
            <div className="w-7 h-7 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-blue-400 font-mono">{formatCurrency(totalFleetDeliveredValue)}</div>
        </div>

        {/* Card 4: Total Rider Earnings */}
        <div className="p-4 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl flex flex-col justify-between h-28">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Riders Income</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">{formatCurrency(totalFleetEarnings)}</div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="p-4 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by rider name, phone or vehicle no…"
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#181928] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'ONLINE', 'OFFLINE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              {st === 'ALL' ? 'All Riders' : st === 'ONLINE' ? '🟢 On Duty' : '🔴 Off Duty'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Riders Table ── */}
      <div className="rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 gap-2 text-xs font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <span>Loading riders fleet performance…</span>
          </div>
        ) : filteredRiders.length === 0 ? (
          <div className="text-center p-12 space-y-3">
            <Bike className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 font-bold text-sm">No riders found.</p>
            <p className="text-slate-500 text-xs">Try clearing search filters or add riders to fleet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-white/[0.02]">
                  <th className="p-4">Rider</th>
                  <th className="p-4">Duty Status</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4 text-right">Total Delivered Value</th>
                  <th className="p-4 text-right">Rider Earnings</th>
                  <th className="p-4 text-center">Delivered Orders</th>
                  <th className="p-4 text-center">Cancelled Orders</th>
                  <th className="p-4 text-center">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {filteredRiders.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    
                    {/* Rider Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center font-extrabold text-white text-sm shrink-0 overflow-hidden">
                          {r.avatar ? (
                            <img src={r.avatar} alt={r.name} className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            r.name?.[0]?.toUpperCase() || 'R'
                          )}
                        </div>
                        <div className="min-w-0">
                          <strong className="font-bold text-white block text-sm truncate">{r.name || 'Unnamed Rider'}</strong>
                          <span className="text-[11px] text-slate-400 block font-mono">{r.email || r.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Duty Status */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        r.isOnline
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${r.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                        <span>{r.isOnline ? 'On Duty' : 'Off Duty'}</span>
                      </span>
                    </td>

                    {/* Vehicle & Rating */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block capitalize">{r.vehicleType || 'Motorbike'}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">No: {r.vehicleNo || 'D-1234'}</span>
                      </div>
                    </td>

                    {/* Total Delivered Value (Product + Delivery Fee) */}
                    <td className="p-4 text-right">
                      <div className="font-black text-blue-400 font-mono text-sm">
                        {formatCurrency(r.totalDeliveredValue)}
                      </div>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Product + Delivery Fee</span>
                    </td>

                    {/* Rider Earnings */}
                    <td className="p-4 text-right">
                      <div className="font-black text-emerald-400 font-mono text-sm">
                        {formatCurrency(r.totalEarnings)}
                      </div>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Rider Share</span>
                    </td>

                    {/* Total Delivered Count */}
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold font-mono text-xs inline-block">
                        {r.totalDeliveries} orders
                      </span>
                    </td>

                    {/* Total Cancellations Count */}
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-xl font-extrabold font-mono text-xs inline-block border ${
                        r.totalCancellations > 0
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}>
                        {r.totalCancellations} cancelled
                      </span>
                    </td>

                    {/* Contact Call Button */}
                    <td className="p-4 text-center">
                      {r.phone ? (
                        <a
                          href={`tel:${r.phone}`}
                          className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all mx-auto"
                          title={`Call ${r.name}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
