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
} from 'lucide-react';

export function DeliveryChargeSettings() {
  const { language } = useLanguageStore();
  const isBn = language === 'BN';
  const { rules, fetchRules } = useDeliveryRulesStore();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modal / Form state
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

  useEffect(() => {
    setLoading(true);
    fetchRules().finally(() => setLoading(false));
  }, [fetchRules]);

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

  const handleToggle = async (id: string) => {
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

  const handleDelete = async (id: string) => {
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

  return (
    <div className="space-y-6 text-white max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>{isBn ? 'গ্লোবাল ডেলিভারি চার্জ ব্যবস্থাপনা' : 'Global Delivery Charge Management'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Truck className="w-7 h-7 text-emerald-400" />
            <span>{isBn ? 'ডেলিভারি চার্জ সেটিংস' : 'Delivery Charge Settings'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isBn
              ? 'এডমিন ও সেলার উভয়ই এই গ্লোবাল ডেলিভারি চার্জ রুলসগুলো পরিচালনা করতে পারবেন। গ্রাহকের চেকআউটে এই অনুযায়ী চার্জ হিসাব হবে।'
              : 'Manage dynamic delivery charge rules applied across the platform. Both Admin & Seller update the same live configuration.'}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isBn ? 'নতুন রুল যুক্ত করুন' : 'Add New Rule'}</span>
        </button>
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

      {/* Rules Table */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl space-y-4 overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            <h2 className="font-bold text-white text-sm">
              {isBn ? 'সক্রিয় ও প্রস্তাবিত ডেলিভারি রুলস তালিকা' : 'Active Delivery Rules List'}
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {rules.length} {isBn ? 'টি নিয়ম পাওয়া গেছে' : 'rules configured'}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-12 space-y-3 bg-[#171828] rounded-2xl border border-white/5 p-6">
            <Truck className="w-10 h-10 text-slate-500 mx-auto opacity-40" />
            <p className="font-bold text-slate-300 text-sm">
              {isBn ? 'কোনো ডেলিভারি চার্জ রুল পাওয়া যায়নি' : 'No delivery charge rules configured'}
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isBn ? 'প্রথম রুল যুক্ত করুন' : 'Add First Rule'}</span>
            </button>
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
                      ? `৳${formatCurrency(rule.minAmount)} – ৳${formatCurrency(rule.maxAmount)}`
                      : `৳${formatCurrency(rule.minAmount)}+`;

                  return (
                    <tr
                      key={rule.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        !rule.isActive ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="py-4 px-4 font-black text-white text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span>{rangeText}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-sm">
                        {rule.isFree ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30 text-xs">
                            🎉 {isBn ? 'ফ্রি ডেলিভারি' : 'Free Delivery'}
                          </span>
                        ) : (
                          <span className="text-white font-mono">৳{formatCurrency(rule.charge)}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggle(rule.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs transition-all cursor-pointer ${
                            rule.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                          }`}
                        >
                          {rule.isActive ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-emerald-400" />
                              <span>{isBn ? 'সক্রিয়' : 'Active'}</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-slate-400" />
                              <span>{isBn ? 'নিষ্ক্রিয়' : 'Inactive'}</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(rule)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                            title={isBn ? 'সম্পাদনা করুন' : 'Edit Rule'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rule.id)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                            title={isBn ? 'মুছে ফেলুন' : 'Delete Rule'}
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
            {isBn ? 'সীমা ও ওভারল্যাপ নিয়মনীতি:' : 'Boundary & Overlap Rules Notice:'}
          </p>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {isBn
              ? 'দুটি সক্রিয় নিয়ম অবশ্যই একই অর্ডারের টাকার পরিমাণ ওভারল্যাপ করতে পারবে না। উদাহরণস্বরূপ: ৳০–৳৪৯৯ এর পরের নিয়মটি ৳৫০০ হতে শুরু করতে হবে।'
              : 'Active rules must not overlap ranges. For example: Range ৳0–৳499 followed by ৳500–৳999 and ৳1000+. Backend automatically validates and rejects overlapping range creation.'}
          </p>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#191b2d] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-white text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <span>
                  {editingRule
                    ? isBn
                      ? 'ডেলিভারি চার্জ নিয়ম সম্পাদনা'
                      : 'Edit Delivery Charge Rule'
                    : isBn
                    ? 'নতুন ডেলিভারি চার্জ নিয়ম যোগ'
                    : 'Add New Delivery Charge Rule'}
                </span>
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 transition-colors"
              >
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
              {/* Min Amount */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  {isBn ? 'সর্বনিম্ন অর্ডারের টাকা (Min Order Subtotal) *' : 'Minimum Order Subtotal (৳) *'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.minAmount}
                  onChange={(e) => setForm({ ...form, minAmount: Number(e.target.value) })}
                  placeholder="0"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#111221] border border-white/10 text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Has Max Limit Checkbox */}
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
                    {isBn ? 'সর্বোচ্চ টাকার সীমা আছে (Set Upper Limit)' : 'Specify Maximum Amount Upper Limit'}
                  </label>
                </div>

                {form.hasMaxLimit ? (
                  <div>
                    <label className="block text-slate-400 mb-1">
                      {isBn ? 'সর্বোচ্চ অর্ডারের টাকা (Max Subtotal)' : 'Maximum Subtotal Amount (৳)'}
                    </label>
                    <input
                      type="number"
                      min={form.minAmount}
                      step="1"
                      value={form.maxAmount}
                      onChange={(e) => setForm({ ...form, maxAmount: Number(e.target.value) })}
                      placeholder="e.g. 499 or 999"
                      required={form.hasMaxLimit}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#111221] border border-white/10 text-white font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-400 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/20">
                    ℹ️ {isBn ? `এই রুলটি ৳${form.minAmount}+ এর ওপরের সব অর্ডারে প্রযোজ্য হবে` : `Rule applies for ৳${form.minAmount}+ with no upper limit`}
                  </p>
                )}
              </div>

              {/* Free Delivery Checkbox */}
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
                    🎉 {isBn ? 'এই সমায়সীমার জন্য ফ্রি ডেলিভারি প্রদান করুন (Free Delivery)' : 'Set as FREE Delivery for this Range'}
                  </label>
                </div>

                {!form.isFree && (
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      {isBn ? 'ডেলিভারি চার্জের টাকা (Delivery Charge) *' : 'Delivery Charge Amount (৳) *'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.charge}
                      onChange={(e) => setForm({ ...form, charge: Number(e.target.value) })}
                      placeholder="50"
                      required={!form.isFree}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#111221] border border-white/10 text-white font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#111221] border border-white/10">
                <span className="font-bold text-slate-300">
                  {isBn ? 'রুলটি এখনই সক্রিয় রাখবেন?' : 'Rule Active Status'}
                </span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    form.isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700/50 text-slate-400'
                  }`}
                >
                  {form.isActive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                  <span>{form.isActive ? 'Active' : 'Inactive'}</span>
                </button>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition-all"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingRule ? (isBn ? 'আপডেট করুন' : 'Update Rule') : (isBn ? 'সংরক্ষণ করুন' : 'Save Rule')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
