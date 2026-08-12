'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api-client';
import { formatCurrency } from '@/utils/cn';
import {
  ArrowUpRight, Wallet, Building2, Smartphone, CreditCard,
  ShieldCheck, AlertCircle, CheckCircle2, Loader2, Info, Clock, RefreshCw
} from 'lucide-react';

const METHODS = [
  { id: 'bkash', label: 'bKash', icon: Smartphone, fee: '1.5%' },
  { id: 'nagad', label: 'Nagad', icon: Smartphone, fee: '1.5%' },
  { id: 'bank',  label: 'Bank Transfer (DBBL / Any Bank)', icon: Building2, fee: 'Free' },
];

export default function WithdrawPage() {
  const [method, setMethod] = useState('bkash');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [withdrawable, setWithdrawable] = useState(0);
  const [requests, setRequests] = useState<any[]>([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    setPageLoading(true);
    try {
      const [dashRes, walletRes, historyRes] = await Promise.all([
        fetchApi<any>('/seller/dashboard').catch(() => null),
        fetchApi<any>('/wallet').catch(() => null),
        fetchApi<any>('/seller/withdrawals').catch(() => null),
      ]);

      if (dashRes?.success && dashRes.data) {
        setWithdrawable(Number(dashRes.data.withdrawableBalance || 0));
      } else if (walletRes?.success && walletRes.data) {
        setWithdrawable(Math.floor(Number(walletRes.data.balance || 0) * 0.9));
      }

      if (historyRes?.success && Array.isArray(historyRes.data)) {
        setRequests(historyRes.data);
      }
    } catch (_) {
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const val = parseFloat(amount);
    if (!amount || isNaN(val) || val <= 0) {
      setError('Please enter a valid withdrawal amount.');
      return;
    }
    if (val < 500) {
      setError('Minimum withdrawal amount is ৳500.');
      return;
    }
    if (withdrawable > 0 && val > withdrawable) {
      setError(`Requested amount exceeds withdrawable balance of ৳${formatCurrency(withdrawable)}.`);
      return;
    }
    if (!accountNumber.trim()) {
      setError('Please provide your Mobile / Bank account number.');
      return;
    }

    try {
      setSubmitLoading(true);
      const payload = {
        amount: val,
        paymentMethod: method === 'bkash' ? 'bKash' : method === 'nagad' ? 'Nagad' : 'Bank',
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim() || undefined,
        bankName: method === 'bank' ? bankName.trim() || 'Bank Transfer' : undefined,
        note: note.trim() || undefined,
      };

      const res = await fetchApi<any>('/seller/withdrawals', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setSuccess(`Withdrawal request of ৳${formatCurrency(val)} submitted successfully! Super Admin will process it within 24 hours.`);
        setAmount('');
        setNote('');
        await loadData();
      } else {
        setError(res.message || 'Failed to submit withdrawal request.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error submitting request. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Finance / Withdraw</p>
          <h1 className="font-black text-white text-xl flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-indigo-400" /> Request Withdrawal
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Transfer your store earnings directly to your mobile wallet or bank account</p>
        </div>
        <button
          onClick={loadData}
          disabled={pageLoading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${pageLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {pageLoading ? (
        <div className="p-16 text-center rounded-3xl bg-[#1f2136] border border-white/10 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs font-bold text-white">Loading wallet balance and payout requests...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Form Section */}
          <div className="lg:col-span-2 space-y-5">

            {/* Available Balance Header */}
            <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 flex items-center justify-between shadow-2xl">
              <div>
                <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider">Available to Withdraw</p>
                <p className="font-black text-white text-3xl font-mono mt-1">৳{formatCurrency(withdrawable)}</p>
                <p className="text-[11px] text-indigo-200/80 mt-1">Minimum payout request is ৳500</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                <Wallet className="w-7 h-7" />
              </div>
            </div>

            {success && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium animate-in fade-in duration-200">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <p>{success}</p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="rounded-3xl bg-[#1f2136] border border-white/10 p-6 space-y-5 shadow-2xl">
              
              {/* Method Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Select Payout Method *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        method === m.id
                          ? 'border-indigo-500 bg-indigo-500/15 shadow-md shadow-indigo-500/20'
                          : 'border-white/10 bg-slate-900/60 hover:bg-white/5 text-slate-400'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                        <m.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">{m.label}</p>
                        <p className="text-[10px] text-slate-400">Fee: {m.fee}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {method === 'bank' ? 'Bank Account Number *' : 'Mobile Wallet Number (bKash / Nagad) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={method === 'bank' ? 'e.g. 148110XXXXXX' : 'e.g. 01711XXXXXX'}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-xs font-mono font-bold"
                />
              </div>

              {/* Bank Name if Bank */}
              {method === 'bank' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Bank Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. DBBL, Islami Bank, City Bank"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      placeholder="Name on bank account"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Withdrawal Amount (৳) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
                  <input
                    type="number"
                    min="500"
                    required
                    placeholder="Enter amount (min ৳500)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-xs font-mono font-extrabold"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Note / Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. July sales payout request"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-xs"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitLoading}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                <span>Submit Withdrawal Request</span>
              </button>
            </form>
          </div>

          {/* History Sidebar */}
          <div className="space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" /> Payout Request History
            </h3>

            {requests.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-[#1f2136] border border-white/10 text-slate-400 space-y-1">
                <Info className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-white">No withdrawal requests</p>
                <p className="text-[11px] text-slate-500">Your submitted payout requests will appear here with live approval status.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((r) => {
                  const reqDate = r.requestedAt ? new Date(r.requestedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently';
                  const isPaid = r.status === 'PAID' || r.status === 'APPROVED' || r.status === 'COMPLETED';
                  const isPending = r.status === 'PENDING';
                  return (
                    <div key={r.id} className="p-4 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          isPaid
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : isPending
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                          {r.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{reqDate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-extrabold text-white text-sm font-mono">৳{formatCurrency(Number(r.amount))}</p>
                          <p className="text-[11px] text-slate-400">{r.paymentMethod} · {r.accountNumber}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
