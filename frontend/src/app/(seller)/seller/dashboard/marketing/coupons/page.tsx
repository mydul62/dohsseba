'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api-client';
import { formatCurrency } from '@/utils/cn';
import {
  Tag, Plus, Search, Copy, Check, Calendar, Percent,
  Clock, Trash2, Edit2, AlertTriangle, Filter, CheckCircle2,
  XCircle, ToggleLeft, ToggleRight, Loader2, X, Info, ShieldAlert,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useConfirm } from '@/hooks/useConfirm';

// ─── Mock Coupons ─────────────────────────────────────────────────────────────

const MOCK_COUPONS = [
  { id: 'cp1', code: 'FRESH10', description: '10% discount on all dairy & fresh produce', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 300, maxUses: 100, usedCount: 42, isActive: true, expiresAt: '2026-12-31T23:59:59Z', createdAt: '2026-07-01' },
  { id: 'cp2', code: 'DOHS50',  description: '৳50 flat discount on orders above ৳500',      discountType: 'FLAT',       discountValue: 50, minOrderAmount: 500, maxUses: 50,  usedCount: 18, isActive: true, expiresAt: '2026-09-30T23:59:59Z', createdAt: '2026-07-15' },
  { id: 'cp3', code: 'MANGO15', description: '15% off on Rajshahi Himsagar Mangoes',       discountType: 'PERCENTAGE', discountValue: 15, minOrderAmount: 400, maxUses: 30,  usedCount: 30, isActive: false, expiresAt: '2026-07-25T23:59:59Z', createdAt: '2026-07-10' },
  { id: 'cp4', code: 'WELCOME', description: '৳100 off on first grocery order',            discountType: 'FLAT',       discountValue: 100,minOrderAmount: 1000,maxUses: 200, usedCount: 85, isActive: true, expiresAt: '2026-12-31T23:59:59Z', createdAt: '2026-06-01' },
];

function CouponStatusBadge({ isActive, expiresAt }: { isActive: boolean; expiresAt: string }) {
  const isExpired = new Date(expiresAt) < new Date();
  if (isExpired) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-red-500/20 text-red-300 border-red-500/30"><XCircle className="w-3 h-3" /> Expired</span>;
  if (!isActive) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-500/20 text-slate-300 border-slate-500/30">Inactive</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/20 text-emerald-300 border-emerald-500/30"><CheckCircle2 className="w-3 h-3" /> Active</span>;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState(MOCK_COUPONS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { confirm, dialogProps } = useConfirm();

  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating]   = useState(false);
  const [form, setForm] = useState({
    code: '', description: '', discountType: 'PERCENTAGE', discountValue: '',
    minOrderAmount: '', maxUses: '', expiresAt: '',
  });

  const loadCoupons = () => {
    setLoading(true);
    fetchApi<any>('/coupons')
      .then((r) => {
        if (r.success && r.data) {
          setCoupons(r.data);
        }
      })
      .catch((err) => console.error('Failed to load coupons:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleStatus = async (id: string) => {
    try {
      setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !c.isActive } : c));
      await fetchApi(`/coupons/${id}/toggle`, { method: 'PATCH' });
    } catch (err) {
      console.error('Failed to toggle coupon:', err);
      loadCoupons();
    }
  };

  const deleteCoupon = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Coupon',
      message: 'Are you sure you want to delete this coupon code permanently? Customers will no longer be able to use it.',
      confirmText: 'Delete Coupon',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      await fetchApi(`/coupons/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete coupon:', err);
      loadCoupons();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.discountValue) return;
    setCreating(true);

    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        description: form.description,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : new Date('2026-12-31').toISOString(),
      };

      const res = await fetchApi<any>('/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        setCoupons((prev) => [res.data, ...prev.filter((c) => c.id !== res.data.id)]);
      } else {
        loadCoupons();
      }
      setShowModal(false);
      setForm({ code: '', description: '', discountType: 'PERCENTAGE', discountValue: '', minOrderAmount: '', maxUses: '', expiresAt: '' });
    } catch (err) {
      console.error('Failed to create coupon:', err);
      alert('Failed to create coupon. Make sure code is unique.');
    } finally {
      setCreating(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return coupons;
    return coupons.filter((c) => c.code.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()));
  }, [coupons, search]);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-xl bg-[#1f2136]" />
      <div className="h-64 rounded-3xl bg-[#1f2136]" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Dashboard / Marketing / Coupons</p>
          <h1 className="font-black text-white text-xl flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-400" /> Coupons & Promo Codes
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Create and manage discount codes for your buyers</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-lg">
          <Plus className="w-3.5 h-3.5" /> Create Coupon
        </button>
      </div>

      {/* Filter & Search */}
      <div className="p-4 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search promo codes…" className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" />
        </div>
      </div>

      {/* Coupon Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((c) => {
          const usagePct = c.maxUses ? Math.round((c.usedCount / c.maxUses) * 100) : 0;
          return (
            <div key={c.id} className="p-5 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl space-y-4 relative group">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-white text-lg tracking-wider bg-[#181928] px-3 py-1 rounded-xl border border-indigo-500/30 text-indigo-300">{c.code}</span>
                    <button onClick={() => copyCode(c.code)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Copy Code">
                      {copiedCode === c.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 mt-2">{c.description}</p>
                </div>
                <CouponStatusBadge isActive={c.isActive} expiresAt={c.expiresAt} />
              </div>

              {/* Discount Amount */}
              <div className="p-3 rounded-2xl bg-[#181928]/60 border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <p className="text-slate-400 text-[10px]">Discount Value</p>
                  <p className="font-black text-emerald-400 text-sm">
                    {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `${formatCurrency(c.discountValue)} OFF`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-[10px]">Min. Order</p>
                  <p className="font-bold text-white">{c.minOrderAmount ? formatCurrency(c.minOrderAmount) : 'No Min'}</p>
                </div>
              </div>

              {/* Usage Progress */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Usage Limit</span>
                  <span className="text-slate-300 font-mono">{c.usedCount} / {c.maxUses || '∞'} ({usagePct}%)</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#181928] overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(100, usagePct)}%` }} />
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Expires: {new Date(c.expiresAt).toLocaleDateString('en-BD')}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleStatus(c.id)} className="text-xs font-bold text-indigo-400 hover:underline">
                    {c.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => deleteCoupon(c.id)} className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleCreate} className="w-full max-w-md p-6 rounded-3xl bg-[#1f2136] border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Create New Coupon</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 transition-colors"><X className="w-4 h-4" /></button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Coupon Code *</label>
              <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="e.g. SUMMER20" required className="w-full px-3 py-2 rounded-xl bg-[#181928] border border-white/10 text-white text-xs font-mono uppercase focus:outline-none focus:border-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="e.g. 20% off summer sale" className="w-full px-3 py-2 rounded-xl bg-[#181928] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Discount Type</label>
                <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-[#181928] border border-white/10 text-white text-xs focus:outline-none">
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (৳)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Discount Value *</label>
                <input type="number" min="1" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} placeholder="e.g. 15" required className="w-full px-3 py-2 rounded-xl bg-[#181928] border border-white/10 text-white text-xs focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Min Order (৳)</label>
                <input type="number" min="0" value={form.minOrderAmount} onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))} placeholder="e.g. 300" className="w-full px-3 py-2 rounded-xl bg-[#181928] border border-white/10 text-white text-xs focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Max Uses</label>
                <input type="number" min="1" value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))} placeholder="e.g. 100" className="w-full px-3 py-2 rounded-xl bg-[#181928] border border-white/10 text-white text-xs focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Expiry Date</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-[#181928] border border-white/10 text-white text-xs focus:outline-none" />
            </div>

            <div className="flex gap-3 pt-2 border-t border-white/10">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/5">Cancel</button>
              <button type="submit" disabled={creating} className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2">
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5" />}
                {creating ? 'Saving…' : 'Publish Coupon'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Confirm Dialog ── */}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
