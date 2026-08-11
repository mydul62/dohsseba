'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api-client';
import { useDeliveryRulesStore } from '@/store/useDeliveryRulesStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { DeliveryRule } from '@/types/deliveryRule';
import { formatCurrency } from '@/utils/cn';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ShieldCheck,
  Tag,
  Info,
  Clock,
  Zap,
} from 'lucide-react';

export function DeliveryChargeSettings() {
  const { language } = useLanguageStore();
  const isBn = language === 'BN';
  const { rules, fetchRules } = useDeliveryRulesStore();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ── Delivery Speed Options State ──────────────────────────────────────────
  const [deliveryOptions, setDeliveryOptions] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Modal / Form state for Delivery Rules
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DeliveryRule | null>(null);
  const [form, setForm] = useState({
    minAmount: 0,
    hasMaxLimit: true,
    maxAmount: 499 as number | '',
    isFree: false,
    charge: 50,
    isActive: true,
  });

  // Modal / Form state for Delivery Speed Options
  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<any | null>(null);
  const [optionForm, setOptionForm] = useState({
    title: '',
    badge: '',
    description: '',
    speedKey: '',
    priority: 1,
    isActive: true,
  });

  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const res = await fetchApi<any[]>('/delivery-rules/options/admin');
      if (res?.success && Array.isArray(res.data)) {
        setDeliveryOptions(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch delivery options:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchRules().finally(() => setLoading(false));
    fetchOptions();
  }, [fetchRules]);

  // ── Delivery Rule Handlers ────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingRule(null);
    setForm({
      minAmount: 0,
      hasMaxLimit: true,
      maxAmount: 499,
      isFree: false,
      charge: 50,
      isActive: true,
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (rule: DeliveryRule) => {
    setEditingRule(rule);
    setForm({
      minAmount: rule.minAmount,
      hasMaxLimit: rule.maxAmount !== null,
      maxAmount: rule.maxAmount !== null ? rule.maxAmount : '',
      isFree: rule.isFree,
      charge: rule.charge,
      isActive: rule.isActive,
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRule(null);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const minAmount = Number(form.minAmount) || 0;
    const maxAmount = form.hasMaxLimit && form.maxAmount !== '' ? Number(form.maxAmount) : null;
    const charge = form.isFree ? 0 : Number(form.charge) || 0;

    if (minAmount < 0) {
      setErrorMsg(isBn ? 'সর্বনিম্ন টাকার পরিমাণ ঋণাত্মক হতে পারবে না।' : 'Minimum amount cannot be negative.');
      setSaving(false);
      return;
    }

    if (maxAmount !== null && maxAmount < minAmount) {
      setErrorMsg(
        isBn
          ? 'সর্বোচ্চ পরিমাণ অবশ্যই সর্বনিম্ন পরিমাণের চেয়ে বড় বা সমান হতে হবে।'
          : 'Maximum amount must be greater than or equal to minimum amount.'
      );
      setSaving(false);
      return;
    }

    try {
      const payload = {
        minAmount,
        maxAmount,
        charge,
        isFree: form.isFree,
        isActive: form.isActive,
      };

      const url = editingRule ? `/delivery-rules/${editingRule.id}` : '/delivery-rules';
      const method = editingRule ? 'PUT' : 'POST';

      const res = await fetchApi<any>(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res && res.success) {
        setSuccessMsg(
          isBn
            ? editingRule
              ? 'ডেলিভারি চার্জ নিয়মটি সফলভাবে আপডেট হয়েছে!'
              : 'নতুন ডেলিভারি চার্জ নিয়ম সফলভাবে যোগ হয়েছে!'
            : editingRule
            ? 'Delivery charge rule updated successfully!'
            : 'New delivery charge rule added successfully!'
        );
        closeModal();
        await fetchRules();
      } else {
        throw new Error(res?.message || 'Failed to save delivery rule');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save delivery rule');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  const handleToggleRule = async (id: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetchApi<any>(`/delivery-rules/${id}/toggle`, {
        method: 'PATCH',
      });
      if (res && res.success) {
        setSuccessMsg(res.message || 'Status updated');
        await fetchRules();
      } else {
        throw new Error(res?.message || 'Failed to toggle status');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to toggle rule status');
    } finally {
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm(isBn ? 'আপনি কি নিশ্চিত যে এই নিয়মটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this rule?')) {
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetchApi<any>(`/delivery-rules/${id}`, {
        method: 'DELETE',
      });
      if (res && res.success) {
        setSuccessMsg(isBn ? 'নিয়মটি সফলভাবে মুছে ফেলা হয়েছে।' : 'Rule deleted successfully.');
        await fetchRules();
      } else {
        throw new Error(res?.message || 'Failed to delete rule');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete rule');
    } finally {
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // ── Delivery Speed Option Handlers ────────────────────────────────────────
  const openAddOptionModal = () => {
    setEditingOption(null);
    setOptionForm({
      title: '',
      badge: 'FASTEST',
      description: '',
      speedKey: '',
      priority: deliveryOptions.length + 1,
      isActive: true,
    });
    setErrorMsg('');
    setOptionModalOpen(true);
  };

  const openEditOptionModal = (opt: any) => {
    setEditingOption(opt);
    setOptionForm({
      title: opt.title,
      badge: opt.badge || '',
      description: opt.description,
      speedKey: opt.speedKey,
      priority: opt.priority || 1,
      isActive: opt.isActive,
    });
    setErrorMsg('');
    setOptionModalOpen(true);
  };

  const closeOptionModal = () => {
    setOptionModalOpen(false);
    setEditingOption(null);
    setErrorMsg('');
  };

  const handleOptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const url = editingOption
        ? `/delivery-rules/options/${editingOption.id}`
        : '/delivery-rules/options';
      const method = editingOption ? 'PUT' : 'POST';

      const res = await fetchApi<any>(url, {
        method,
        body: JSON.stringify(optionForm),
      });

      if (res && res.success) {
        setSuccessMsg(
          isBn
            ? editingOption
              ? 'ডেলিভারি স্পিড অপশন আপডেট হয়েছে!'
              : 'নতুন ডেলিভারি স্পিড অপশন যুক্ত হয়েছে!'
            : editingOption
            ? 'Delivery speed option updated!'
            : 'New delivery speed option added!'
        );
        closeOptionModal();
        await fetchOptions();
      } else {
        throw new Error(res?.message || 'Failed to save delivery speed option');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save delivery speed option');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  const handleToggleOption = async (id: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetchApi<any>(`/delivery-rules/options/${id}/toggle`, {
        method: 'PATCH',
      });
      if (res && res.success) {
        setSuccessMsg(res.message || 'Status updated');
        await fetchOptions();
      } else {
        throw new Error(res?.message || 'Failed to toggle status');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to toggle option status');
    } finally {
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleDeleteOption = async (id: string) => {
    if (!confirm(isBn ? 'আপনি কি নিশ্চিত যে এই অপশনটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this option?')) {
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetchApi<any>(`/delivery-rules/options/${id}`, {
        method: 'DELETE',
      });
      if (res && res.success) {
        setSuccessMsg(isBn ? 'অপশনটি সফলভাবে মুছে ফেলা হয়েছে।' : 'Option deleted successfully.');
        await fetchOptions();
      } else {
        throw new Error(res?.message || 'Failed to delete option');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete option');
    } finally {
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-8 text-white max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>{isBn ? 'গ্লোবাল ডেলিভারি সেটিংস (চেকআউট স্পিড ও চার্জ)' : 'Global Dynamic Delivery Settings'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Truck className="w-7 h-7 text-emerald-400" />
            <span>{isBn ? 'ডেলিভারি সেটিংস' : 'Delivery Settings'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isBn
              ? 'এডমিন ও সেলার উভয়ই চেকআউটের ডেলিভারি স্পিড অপশন এবং ডেলিভারি চার্জ রুলসগুলো লাইভ ম্যানেজ করতে পারবেন।'
              : 'Manage dynamic delivery speed options (Express, Scheduled slots) and delivery charge rules applied across the platform.'}
          </p>
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between gap-2 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── SECTION 1: Dynamic Delivery Speed Options (Select Delivery Speed) ── */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="font-extrabold text-white text-base">
                {isBn ? 'চেকআউট ডেলিভারি স্পিড অপশনসমূহ (Select Delivery Speed)' : 'Checkout Delivery Speed Options'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBn
                ? 'গ্রাহকরা চেকআউটে যে ডেলিভারি স্পিড (যেমন: 45-min express, Scheduled slot) দেখতে পান তা এখান থেকে নিয়ন্ত্রণ করুন।'
                : 'Configure delivery speed cards shown on http://localhost:3000/checkout.'}
            </p>
          </div>

          <button
            onClick={openAddOptionModal}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'নতুন স্পিড অপশন যোগ' : 'Add Speed Option'}</span>
          </button>
        </div>

        {loadingOptions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
        ) : deliveryOptions.length === 0 ? (
          <div className="text-center py-8 bg-[#171828] rounded-2xl border border-white/5 p-4">
            <p className="text-xs text-slate-400 font-bold">No delivery speed options found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deliveryOptions.map((opt) => (
              <div
                key={opt.id}
                className={`p-4 rounded-2xl border transition-all space-y-2 relative ${
                  opt.isActive ? 'bg-[#171828] border-amber-500/30' : 'bg-[#121320] border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {opt.badge && (
                      <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md uppercase border border-amber-400/30">
                        {opt.badge}
                      </span>
                    )}
                    <h3 className="font-extrabold text-white text-sm">{opt.title}</h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleOption(opt.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 cursor-pointer ${
                        opt.isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700/50 text-slate-400'
                      }`}
                    >
                      {opt.isActive ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      <span>{opt.isActive ? 'Active' : 'Disabled'}</span>
                    </button>
                    <button
                      onClick={() => openEditOptionModal(opt)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteOption(opt.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{opt.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 2: Dynamic Delivery Charge Rules ── */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-400" />
              <h2 className="font-extrabold text-white text-base">
                {isBn ? 'ডেলিভারি চার্জ নিয়মসমূহ (Delivery Charge Rules)' : 'Dynamic Delivery Charge Rules'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBn
                ? 'অর্ডারের টাকার ওপর ভিত্তি করে ফ্রি ডেলিভারি ও ডেলিভারি চার্জ নির্ধারণ রুলস।'
                : 'Tiered delivery charges based on cart order subtotal.'}
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'নতুন রুল যুক্ত করুন' : 'Add Rule'}</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8 bg-[#171828] rounded-2xl border border-white/5 p-4">
            <p className="text-xs text-slate-400 font-bold">No delivery charge rules configured</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[550px]">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">{isBn ? 'অর্ডার মূল্য সীমা (Order Amount)' : 'Order Amount Range'}</th>
                  <th className="py-3 px-4 text-right">{isBn ? 'ডেলিভারি চার্জ (Charge)' : 'Delivery Charge'}</th>
                  <th className="py-3 px-4 text-center">{isBn ? 'স্ট্যাটাস (Status)' : 'Status'}</th>
                  <th className="py-3 px-4 text-right">{isBn ? 'একশন (Actions)' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {rules.map((rule) => {
                  const rangeText =
                    rule.maxAmount !== null && rule.maxAmount !== undefined
                      ? `${formatCurrency(rule.minAmount)} – ${formatCurrency(rule.maxAmount)}`
                      : `${formatCurrency(rule.minAmount)}+`;

                  return (
                    <tr key={rule.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                        <span>{rangeText}</span>
                        {rule.isFree && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                            FREE DELIVERY
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right font-black text-sm">
                        {rule.isFree || rule.charge === 0 ? (
                          <span className="text-emerald-400">{isBn ? 'ফ্রি' : 'FREE'}</span>
                        ) : (
                          <span className="text-slate-200">{formatCurrency(rule.charge)}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleRule(rule.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                            rule.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                          }`}
                        >
                          {rule.isActive ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-emerald-400" />
                              <span>ACTIVE</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4" />
                              <span>INACTIVE</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(rule)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Boundary / Overlap Explanation Note */}
      <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 shrink-0 text-indigo-400 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold text-white">
            {isBn ? 'এডমিন ও সেলার লাইভ কনফিগারেশন নোট:' : 'Admin & Seller Live Sync Note:'}
          </p>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {isBn
              ? 'এখানে আপনি বা সেলার কোনো নতুন স্পিড অপশন বা ডেলিভারি চার্জ পরিবর্তন করলে তা সাথে সাথে গ্রাহকের চেকআউটে আপডেট হয়ে যাবে।'
              : 'Changes saved here immediately reflect on http://localhost:3000/checkout for customer orders.'}
          </p>
        </div>
      </div>

      {/* ── Modal 1: Delivery Rule Add/Edit ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#191b2d] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-white text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <span>{editingRule ? 'Edit Delivery Charge Rule' : 'Add New Delivery Charge Rule'}</span>
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Minimum Order Subtotal (৳) *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.minAmount}
                  onChange={(e) => setForm({ ...form, minAmount: Number(e.target.value) })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#111221] border border-white/10 text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasMaxLimit"
                    checked={form.hasMaxLimit}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        hasMaxLimit: e.target.checked,
                        maxAmount: e.target.checked ? (form.maxAmount || 999) : '',
                      })
                    }
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <label htmlFor="hasMaxLimit" className="font-bold text-slate-200 cursor-pointer">
                    Specify Maximum Amount Upper Limit
                  </label>
                </div>

                {form.hasMaxLimit && (
                  <div>
                    <label className="block text-slate-400 mb-1">Maximum Subtotal Amount (৳)</label>
                    <input
                      type="number"
                      min={form.minAmount}
                      step="1"
                      value={form.maxAmount}
                      onChange={(e) => setForm({ ...form, maxAmount: Number(e.target.value) })}
                      required={form.hasMaxLimit}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#111221] border border-white/10 text-white font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFree"
                    checked={form.isFree}
                    onChange={(e) => setForm({ ...form, isFree: e.target.checked, charge: e.target.checked ? 0 : form.charge || 50 })}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <label htmlFor="isFree" className="font-extrabold text-emerald-300 cursor-pointer text-xs">
                    🎉 Set as FREE Delivery for this Range
                  </label>
                </div>

                {!form.isFree && (
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Delivery Charge Amount (৳) *</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.charge}
                      onChange={(e) => setForm({ ...form, charge: Number(e.target.value) })}
                      required={!form.isFree}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#111221] border border-white/10 text-white font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-white/5 text-slate-300 font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black">
                  {saving ? 'Saving...' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Delivery Speed Option Add/Edit ── */}
      {optionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#191b2d] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-white text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>{editingOption ? 'Edit Delivery Speed Option' : 'Add Delivery Speed Option'}</span>
              </h3>
              <button onClick={closeOptionModal} className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleOptionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Option Title * (e.g. 45-minute express)</label>
                <input
                  type="text"
                  value={optionForm.title}
                  onChange={(e) => setOptionForm({ ...optionForm, title: e.target.value })}
                  placeholder="e.g. 45-minute express or Scheduled slot"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#111221] border border-white/10 text-white font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Badge (Optional, e.g. FASTEST)</label>
                <input
                  type="text"
                  value={optionForm.badge}
                  onChange={(e) => setOptionForm({ ...optionForm, badge: e.target.value.toUpperCase() })}
                  placeholder="FASTEST"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#111221] border border-white/10 text-white font-bold focus:outline-none focus:border-amber-400 uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Description *</label>
                <textarea
                  rows={2}
                  value={optionForm.description}
                  onChange={(e) => setOptionForm({ ...optionForm, description: e.target.value })}
                  placeholder="A local DOHS rider picks up your fresh items immediately."
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#111221] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Speed Key Identifier (e.g. express, scheduled)</label>
                <input
                  type="text"
                  value={optionForm.speedKey}
                  onChange={(e) => setOptionForm({ ...optionForm, speedKey: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                  placeholder="express"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#111221] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeOptionModal} className="px-5 py-2.5 rounded-xl bg-white/5 text-slate-300 font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black">
                  {saving ? 'Saving...' : 'Save Option'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
