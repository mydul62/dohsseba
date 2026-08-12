'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/utils/cn';
import {
  Zap, Plus, Clock, Package, AlertTriangle, CheckCircle2, Flame,
  Trash2, XCircle, ShoppingBag, Calendar, TrendingUp, Filter, Sparkles
} from 'lucide-react';

interface FlashSaleItem {
  id: string;
  title: string;
  discountPct: number;
  itemsCount: number;
  startsIn: string;
  totalSold: number;
  targetStock: number;
  status: 'RUNNING' | 'SCHEDULED' | 'ENDED';
  startDate: string;
  endDate: string;
}

const INITIAL_FLASH_SALES: FlashSaleItem[] = [
  { id: 'fs1', title: 'Weekend Fresh Grocery Blitz', discountPct: 20, itemsCount: 4, startsIn: 'Active — Ends in 12h 45m', totalSold: 64, targetStock: 100, status: 'RUNNING', startDate: '2026-08-12 10:00', endDate: '2026-08-13 22:00' },
  { id: 'fs2', title: 'Midnight Mango Madness', discountPct: 25, itemsCount: 1, startsIn: 'Starts tomorrow at 10:00 PM', totalSold: 0, targetStock: 50, status: 'SCHEDULED', startDate: '2026-08-14 22:00', endDate: '2026-08-15 06:00' },
];

export default function FlashSalePage() {
  const [sales, setSales] = useState<FlashSaleItem[]>(INITIAL_FLASH_SALES);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'RUNNING' | 'SCHEDULED' | 'ENDED'>('ALL');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    discountPct: '20',
    itemsCount: '4',
    targetStock: '100',
    durationHours: '12',
    status: 'RUNNING' as 'RUNNING' | 'SCHEDULED',
    startDate: new Date().toISOString().split('T')[0],
  });

  const handleCreateFlashSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.discountPct) return;

    const discountNum = parseInt(form.discountPct, 10) || 20;
    const targetStockNum = parseInt(form.targetStock, 10) || 100;
    const itemsCountNum = parseInt(form.itemsCount, 10) || 1;
    const hours = parseInt(form.durationHours, 10) || 12;

    const startsLabel = form.status === 'RUNNING' 
      ? `Active — Ends in ${hours}h 00m`
      : `Starts on ${form.startDate}`;

    const newSale: FlashSaleItem = {
      id: `fs_${Date.now()}`,
      title: form.title.trim(),
      discountPct: discountNum,
      itemsCount: itemsCountNum,
      startsIn: startsLabel,
      totalSold: 0,
      targetStock: targetStockNum,
      status: form.status,
      startDate: form.startDate,
      endDate: `${form.startDate} (+${hours}h)`,
    };

    setSales([newSale, ...sales]);
    setIsModalOpen(false);

    // Reset Form
    setForm({
      title: '',
      discountPct: '20',
      itemsCount: '4',
      targetStock: '100',
      durationHours: '12',
      status: 'RUNNING',
      startDate: new Date().toISOString().split('T')[0],
    });
  };

  const filteredSales = sales.filter((s) => {
    if (filterStatus === 'RUNNING') return s.status === 'RUNNING';
    if (filterStatus === 'SCHEDULED') return s.status === 'SCHEDULED';
    if (filterStatus === 'ENDED') return s.status === 'ENDED';
    return true;
  });

  const liveCount = sales.filter((s) => s.status === 'RUNNING').length;
  const scheduledCount = sales.filter((s) => s.status === 'SCHEDULED').length;
  const totalSoldSum = sales.reduce((sum, s) => sum + s.totalSold, 0);

  return (
    <div className="space-y-6 select-none">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Dashboard / Marketing / Flash Sale</p>
          <h1 className="font-black text-white text-xl flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400" /> Flash Sales
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Run high-converting limited-time discount events with countdown timers</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Flash Sale
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Live Flash Sales</p>
            <p className="text-2xl font-black text-amber-400 font-mono mt-1">{liveCount}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Scheduled Sales</p>
            <p className="text-2xl font-black text-indigo-400 font-mono mt-1">{scheduledCount}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Flash Sale Units Sold</p>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{totalSoldSum} units</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        {(['ALL', 'RUNNING', 'SCHEDULED', 'ENDED'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === st
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {st === 'ALL' ? 'All Flash Sales' : st === 'RUNNING' ? '⚡ Live Now' : st === 'SCHEDULED' ? '🗓️ Scheduled' : '🏁 Ended'}
          </button>
        ))}
      </div>

      {/* Flash Sale Cards Grid */}
      {filteredSales.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#1f2136] border border-white/10 text-slate-400 space-y-2">
          <Zap className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-white">No flash sales found</p>
          <p className="text-xs text-slate-500">Launch a new high-conversion flash sale using the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSales.map((s) => {
            const pct = Math.min(100, Math.round((s.totalSold / Math.max(1, s.targetStock)) * 100));
            return (
              <div key={s.id} className="p-6 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl space-y-4 hover:border-amber-500/30 transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                        s.status === 'RUNNING'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                          : s.status === 'SCHEDULED'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                      }`}>
                        ⚡ {s.status === 'RUNNING' ? 'LIVE NOW' : s.status === 'SCHEDULED' ? 'SCHEDULED' : 'ENDED'}
                      </span>
                      <h3 className="font-black text-white text-base mt-2">{s.title}</h3>
                    </div>
                    <span className="text-2xl font-black text-amber-400 font-mono">-{s.discountPct}%</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#181928] border border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-mono flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> {s.startsIn}
                    </span>
                    <span className="text-slate-300 font-bold">{s.itemsCount} products included</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-bold">Items Sold</span>
                      <span className="text-slate-300 font-mono font-bold">{s.totalSold} / {s.targetStock} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#181928] overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-end">
                  <button
                    onClick={() => setSales((prev) => prev.filter((i) => i.id !== s.id))}
                    className="text-rose-400 hover:text-rose-300 font-bold hover:underline cursor-pointer flex items-center gap-1 text-[11px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> End / Delete Event
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Flash Sale Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-[#1e1f32] border border-amber-500/40 p-6 space-y-5 shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Zap className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Launch New Flash Sale Event</h3>
                  <p className="text-[11px] text-slate-400">Set up high-converting limited-time discount blitz</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateFlashSale} className="space-y-4 text-xs">
              
              {/* Event Title */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Flash Sale Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend Fresh Grocery Blitz, Midnight Mango Special"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Status Mode */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'RUNNING', label: '⚡ Live Now (Start Immediately)' },
                  { key: 'SCHEDULED', label: '🗓️ Schedule for Future' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setForm({ ...form, status: item.key as any })}
                    className={`py-2.5 px-3 rounded-2xl font-bold border transition-all text-center cursor-pointer ${
                      form.status === item.key
                        ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md font-black'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Discount % & Target Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Flash Discount (%) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="5"
                      max="90"
                      required
                      placeholder="20"
                      value={form.discountPct}
                      onChange={(e) => setForm({ ...form, discountPct: e.target.value })}
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors font-mono font-bold text-amber-400"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Target Stock Cap *</label>
                  <input
                    type="number"
                    min="10"
                    required
                    placeholder="100"
                    value={form.targetStock}
                    onChange={(e) => setForm({ ...form, targetStock: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white focus:outline-none focus:border-amber-500 transition-colors font-mono font-bold"
                  />
                </div>
              </div>

              {/* Items Count & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Products Included</label>
                  <input
                    type="number"
                    min="1"
                    value={form.itemsCount}
                    onChange={(e) => setForm({ ...form, itemsCount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white focus:outline-none focus:border-amber-500 transition-colors font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Duration (Hours)</label>
                  <select
                    value={form.durationHours}
                    onChange={(e) => setForm({ ...form, durationHours: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white focus:outline-none focus:border-amber-500 transition-colors font-bold cursor-pointer"
                  >
                    <option value="3">3 Hours Blitz</option>
                    <option value="6">6 Hours</option>
                    <option value="12">12 Hours (Half Day)</option>
                    <option value="24">24 Hours (Full Day)</option>
                    <option value="48">48 Hours (Weekend)</option>
                  </select>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Event Start Date *</label>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Launch Flash Sale</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
