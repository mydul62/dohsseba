'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/utils/cn';
import {
  Percent, Plus, Calendar, CheckCircle2, Clock, Trash2, Tag, Zap,
  XCircle, Filter, Package, AlertTriangle, Layers, Layers3, ShoppingBag
} from 'lucide-react';

interface DiscountCampaign {
  id: string;
  name: string;
  type: 'Category Discount' | 'Product Discount' | 'Volume Discount';
  discount: string;
  category: string;
  status: 'ACTIVE' | 'EXPIRED';
  startDate: string;
  endDate: string;
  itemsIncluded: number;
}

const INITIAL_CAMPAIGNS: DiscountCampaign[] = [
  { id: 'd1', name: 'Summer Dairy Discount', type: 'Category Discount', discount: '10% OFF', category: 'Dairy & Eggs', status: 'ACTIVE', startDate: '2026-07-01', endDate: '2026-08-31', itemsIncluded: 5 },
  { id: 'd2', name: 'Rajshahi Mango Season Special', type: 'Product Discount', discount: '15% OFF', category: 'Fruits', status: 'ACTIVE', startDate: '2026-07-10', endDate: '2026-08-15', itemsIncluded: 1 },
  { id: 'd3', name: 'Eid Bulk Rice Discount', type: 'Volume Discount', discount: '5% OFF on 5kg+', category: 'Rice & Grains', status: 'EXPIRED', startDate: '2026-06-01', endDate: '2026-07-01', itemsIncluded: 3 },
];

export default function DiscountsPage() {
  const [campaigns, setCampaigns] = useState<DiscountCampaign[]>(INITIAL_CAMPAIGNS);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Campaign Form State
  const [form, setForm] = useState({
    name: '',
    type: 'Category Discount' as 'Category Discount' | 'Product Discount' | 'Volume Discount',
    discountValue: '',
    discountType: 'PERCENT' as 'PERCENT' | 'FLAT',
    category: 'Vegetables & Fruits',
    minQuantity: '5',
    itemsIncluded: '3',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.discountValue) return;

    let discountLabel = '';
    if (form.type === 'Volume Discount') {
      discountLabel = `${form.discountValue}% OFF on ${form.minQuantity}kg+`;
    } else if (form.discountType === 'PERCENT') {
      discountLabel = `${form.discountValue}% OFF`;
    } else {
      discountLabel = `৳${form.discountValue} OFF`;
    }

    const isEndDateExpired = new Date(form.endDate) < new Date();

    const newCampaign: DiscountCampaign = {
      id: `d_${Date.now()}`,
      name: form.name.trim(),
      type: form.type,
      discount: discountLabel,
      category: form.category,
      status: isEndDateExpired ? 'EXPIRED' : 'ACTIVE',
      startDate: form.startDate,
      endDate: form.endDate,
      itemsIncluded: parseInt(form.itemsIncluded, 10) || 1,
    };

    setCampaigns([newCampaign, ...campaigns]);
    setIsModalOpen(false);
    
    // Reset form
    setForm({
      name: '',
      type: 'Category Discount',
      discountValue: '',
      discountType: 'PERCENT',
      category: 'Vegetables & Fruits',
      minQuantity: '5',
      itemsIncluded: '3',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (filterStatus === 'ACTIVE') return c.status === 'ACTIVE';
    if (filterStatus === 'EXPIRED') return c.status === 'EXPIRED';
    return true;
  });

  const activeCount = campaigns.filter((c) => c.status === 'ACTIVE').length;
  const totalProducts = campaigns.reduce((sum, c) => sum + c.itemsIncluded, 0);

  return (
    <div className="space-y-6 select-none">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Dashboard / Marketing / Discounts</p>
          <h1 className="font-black text-white text-xl flex items-center gap-2">
            <Percent className="w-5 h-5 text-indigo-400" /> Discount Campaigns
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Set category-level, product-level, and volume discounts for your store</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Discount Campaign
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Campaigns</p>
            <p className="text-2xl font-black text-white font-mono mt-1">{campaigns.length}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Active Campaigns</p>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Products Included</p>
            <p className="text-2xl font-black text-blue-400 font-mono mt-1">{totalProducts} items</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        {(['ALL', 'ACTIVE', 'EXPIRED'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === st
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {st === 'ALL' ? 'All Campaigns' : st === 'ACTIVE' ? '🟢 Active' : '🔴 Expired'}
          </button>
        ))}
      </div>

      {/* Campaign Cards Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#1f2136] border border-white/10 text-slate-400 space-y-2">
          <Percent className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-white">No discount campaigns found</p>
          <p className="text-xs text-slate-500">Create a new discount campaign using the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredCampaigns.map((c) => (
            <div key={c.id} className="p-5 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl space-y-4 hover:border-indigo-500/30 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 inline-block">
                      {c.type}
                    </span>
                    <h3 className="font-black text-white text-sm mt-2">{c.name}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Category: {c.category}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border shrink-0 ${
                    c.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#181928] border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Discount</p>
                    <p className="font-black text-emerald-400 text-base font-mono">{c.discount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Items</p>
                    <p className="font-extrabold text-white text-xs font-mono">{c.itemsIncluded} products</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {c.startDate} → {c.endDate}
                </span>
                <button
                  onClick={() => setCampaigns((prev) => prev.filter((i) => i.id !== c.id))}
                  className="text-rose-400 hover:text-rose-300 font-bold hover:underline cursor-pointer flex items-center gap-1 text-[11px]"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Discount Campaign Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-[#1e1f32] border border-indigo-500/30 p-6 space-y-5 shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Create New Discount Campaign</h3>
                  <p className="text-[11px] text-slate-400">Configure promotional discounts for items or categories</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              
              {/* Campaign Name */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Dairy Discount, Mango Special Offer"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Campaign Type */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'Category Discount', label: 'Category' },
                  { key: 'Product Discount', label: 'Product' },
                  { key: 'Volume Discount', label: 'Volume Bulk' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setForm({ ...form, type: item.key as any })}
                    className={`py-2 px-3 rounded-2xl font-bold border transition-all text-center cursor-pointer ${
                      form.type === item.key
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Discount Value & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Discount Amount *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder={form.discountType === 'PERCENT' ? '15' : '50'}
                      value={form.discountValue}
                      onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono font-bold"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      {form.discountType === 'PERCENT' ? '%' : '৳'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-colors font-bold cursor-pointer"
                  >
                    <option value="PERCENT">% Percentage Off</option>
                    <option value="FLAT">৳ Flat Amount Off</option>
                  </select>
                </div>
              </div>

              {/* Category Scope */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Category / Scope</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-colors font-bold cursor-pointer"
                >
                  <option value="Vegetables & Fruits">Vegetables & Fruits</option>
                  <option value="Meat & Poultry">Meat & Poultry</option>
                  <option value="Seafood & Fish">Seafood & Fish</option>
                  <option value="Dairy & Eggs">Dairy & Eggs</option>
                  <option value="Bakery & Snacks">Bakery & Snacks</option>
                  <option value="Rice & Grains">Rice & Grains</option>
                  <option value="Beverages & Juices">Beverages & Juices</option>
                  <option value="All Products">All Store Products</option>
                </select>
              </div>

              {/* Volume Discount Threshold if Volume selected */}
              {form.type === 'Volume Discount' && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Minimum Volume Threshold (kg / items)</label>
                  <input
                    type="number"
                    min="2"
                    value={form.minQuantity}
                    onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono font-bold"
                  />
                </div>
              )}

              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
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
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Campaign</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
