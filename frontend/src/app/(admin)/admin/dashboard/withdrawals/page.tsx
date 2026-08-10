'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api-client';
import { formatCurrency } from '@/utils/cn';
import { useLanguageStore } from '@/store/useLanguageStore';
import {
  Wallet, Search, Filter, CheckCircle2, AlertCircle, Clock,
  Loader2, RefreshCw, X, Check, Building2, Smartphone, DollarSign,
  ArrowUpRight, ShieldCheck, User, MessageSquare, Trash2
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useConfirm } from '@/hooks/useConfirm';

export default function AdminWithdrawalsPage() {
  const { language } = useLanguageStore();
  const isBn = language === 'BN';
  const { confirm, dialogProps } = useConfirm();

  const [requests, setRequests] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ pendingCount: 0, pendingAmount: 0, totalPaidAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Process Modal state
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'APPROVED' | 'PAID' | 'REJECTED' | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetchApi<any>('/admin/withdrawals').catch((err) => {
        console.error('Fetch withdrawals error:', err);
        return null;
      });

      if (res && res.success && res.data) {
        setRequests(res.data.requests || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      } else {
        setErrorMsg(isBn ? 'উইথড্রয়াল রিকোয়েস্ট ফাইল পেতে ব্যর্থ হয়েছে।' : 'Failed to retrieve withdrawal requests.');
      }
    } catch (err: any) {
      console.error('Error loading withdrawals:', err);
      setErrorMsg(err?.message || 'Error loading withdrawal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleOpenProcessModal = (reqItem: any, type: 'APPROVED' | 'PAID' | 'REJECTED') => {
    setSelectedReq(reqItem);
    setActionType(type);
    setTransactionId(reqItem.transactionId || '');
    setAdminNote(reqItem.adminNote || '');
  };

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !actionType) return;

    try {
      setProcessing(true);
      const res = await fetchApi<any>(`/admin/withdrawals/${selectedReq.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: actionType,
          transactionId: transactionId.trim() || undefined,
          adminNote: adminNote.trim() || undefined,
        }),
      });

      if (res && res.success) {
        setActionMsg(
          isBn
            ? `উইথড্রয়াল রিকোয়েস্ট #${selectedReq.id.slice(-6).toUpperCase()} সফলভাবে ${actionType} করা হয়েছে!`
            : `Withdrawal #${selectedReq.id.slice(-6).toUpperCase()} updated to ${actionType} successfully!`
        );
        setSelectedReq(null);
        setActionType(null);
        setTransactionId('');
        setAdminNote('');
        loadRequests();
        setTimeout(() => setActionMsg(''), 4000);
      } else {
        alert(res?.message || 'Failed to update withdrawal status');
      }
    } catch (err: any) {
      alert(err?.message || 'Error updating status');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteRequest = async (id: string, amount: number, name: string) => {
    const ok = await confirm({
      title: isBn ? 'উইথড্রয়াল রিকোয়েস্ট ডিলিট করুন' : 'Delete Withdrawal Request',
      message: isBn
        ? `আপনি কি নিশ্চিত যে আপনি ${name || 'এই রাইডারের'} ৳${formatCurrency(amount)} টাকা উত্তোলনের রিকোয়েস্ট রেকর্ডটি মুছে ফেলতে চান?`
        : `Are you sure you want to delete the ৳${formatCurrency(amount)} withdrawal request record for ${name || 'this user'}?`,
      confirmText: isBn ? 'হ্যাঁ, ডিলিট করুন' : 'Delete Request',
      variant: 'danger',
    });

    if (!ok) return;

    try {
      const res = await fetchApi<any>(`/admin/withdrawals/${id}`, {
        method: 'DELETE',
      });

      if (res && res.success) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        setActionMsg(isBn ? 'উইথড্রয়াল রিকোয়েস্ট সফলভাবে ডিলিট করা হয়েছে।' : 'Withdrawal request deleted successfully!');
        loadRequests();
        setTimeout(() => setActionMsg(''), 4000);
      } else {
        alert(res?.message || 'Failed to delete withdrawal request');
      }
    } catch (err: any) {
      alert(err?.message || 'Error deleting request');
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const nameStr = String(r.user?.name || '').toLowerCase();
    const emailStr = String(r.user?.email || '').toLowerCase();
    const phoneStr = String(r.user?.phone || r.accountNumber || '').toLowerCase();
    const accountStr = String(r.accountNumber || '').toLowerCase();
    const query = search.toLowerCase().trim();

    const matchesSearch =
      !query ||
      nameStr.includes(query) ||
      emailStr.includes(query) ||
      phoneStr.includes(query) ||
      accountStr.includes(query);

    return matchesStatus && matchesSearch;
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-extrabold';
      case 'APPROVED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30 font-bold';
      case 'PENDING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold animate-pulse';
      case 'REJECTED':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 text-white">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-emerald-400 font-semibold mb-0.5 uppercase tracking-widest">Finance / Payout Management</p>
          <h1 className="font-black text-white text-2xl flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-400" />
            <span>{isBn ? 'উইথড্রয়াল রিকোয়েস্ট ও পেআউট ম্যানেজমেন্ট' : 'Withdrawal & Payout Manager'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isBn ? 'রাইডার এবং সেলারদের টাকা উত্তোলনের আবেদন রিভিউ, ডিলিট ও প্রসেস করুন' : 'Review, approve, disburse, or delete rider & merchant earning withdrawals'}
          </p>
        </div>

        <button
          onClick={loadRequests}
          disabled={loading}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{isBn ? 'রিফ্রেশ ডাটা' : 'Reload List'}</span>
        </button>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> {actionMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={loadRequests} className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold cursor-pointer">
            {isBn ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
          </button>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[#1f2136] border border-white/10 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>{isBn ? 'পেন্ডিং রিকোয়েস্ট' : 'Pending Requests'}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">{summary.pendingCount} {isBn ? 'টি' : 'Reqs'}</div>
          <div className="text-[11px] text-amber-300/80 font-bold">Awaiting Admin Approval</div>
        </div>

        <div className="p-5 rounded-3xl bg-[#1f2136] border border-white/10 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>{isBn ? 'পেন্ডিং পেআউট মোট টাকা' : 'Total Pending Amount'}</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">৳{formatCurrency(summary.pendingAmount)}</div>
          <div className="text-[11px] text-slate-400 font-bold">To be disbursed</div>
        </div>

        <div className="p-5 rounded-3xl bg-[#1f2136] border border-white/10 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>{isBn ? 'মোট পরিশোধিত টাকা (PAID)' : 'Total Paid Out'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">৳{formatCurrency(summary.totalPaidAmount)}</div>
          <div className="text-[11px] text-emerald-300/80 font-bold">Successfully Disbursed</div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 rounded-2xl bg-[#1e1f32] border border-white/10">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#181928] text-xs font-semibold overflow-x-auto">
          {['ALL', 'PENDING', 'APPROVED', 'PAID', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-all text-xs font-bold whitespace-nowrap cursor-pointer ${
                statusFilter === st ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isBn ? 'নাম, ফোন বা অ্যাকাউন্ট দিয়ে খুঁজুন…' : 'Search name, phone or account…'}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#181928] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="rounded-3xl bg-[#1e1f32] border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181928] text-slate-400 font-bold uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="p-4">{isBn ? 'ব্যবহারকারী / রাইডার' : 'Rider / User'}</th>
                <th className="p-4">{isBn ? 'পেমেন্ট মেথড ও অ্যাকাউন্ট' : 'Payment Method & Account'}</th>
                <th className="p-4">{isBn ? 'পরিমাণ (৳)' : 'Requested Amount'}</th>
                <th className="p-4">{isBn ? 'তারিখ' : 'Requested Date'}</th>
                <th className="p-4">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="p-4 text-right">{isBn ? 'এডমিন অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                      <span>{isBn ? 'উইথড্রয়াল আবেদন লোড হচ্ছে...' : 'Loading withdrawal requests...'}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Wallet className="w-8 h-8 text-slate-600" />
                      <span className="font-bold text-slate-300">{isBn ? 'কোন উইথড্রয়াল আবেদন পাওয়া যায়নি' : 'No Withdrawal Requests Found'}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-300 font-black flex items-center justify-center text-xs shrink-0 border border-emerald-500/30">
                          {(r.user?.name || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{r.user?.name || 'Unknown User'}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-slate-300 font-bold uppercase">
                              {r.userRole}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">{r.user?.email || 'N/A'} • {r.user?.phone || 'No phone'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                          {r.paymentMethod === 'Bank' ? <Building2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                          {r.paymentMethod}
                        </span>
                        <div className="font-mono text-white text-xs font-semibold">{r.accountNumber}</div>
                        {r.accountName && <div className="text-[10px] text-slate-400">Acc: {r.accountName}</div>}
                        {r.bankName && <div className="text-[10px] text-slate-400">{r.bankName} {r.branchName ? `(${r.branchName})` : ''}</div>}
                      </div>
                    </td>

                    <td className="p-4 font-black text-base text-white">
                      ৳{formatCurrency(r.amount)}
                    </td>

                    <td className="p-4 text-slate-300 text-xs">
                      {new Date(r.requestedAt).toLocaleDateString()}
                      <div className="text-[10px] text-slate-500">{new Date(r.requestedAt).toLocaleTimeString()}</div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-1">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] border inline-block ${getStatusBadgeStyle(r.status)}`}>
                          {r.status}
                        </span>
                        {r.transactionId && (
                          <div className="text-[10px] font-mono text-emerald-400">Trx: {r.transactionId}</div>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleOpenProcessModal(r, 'APPROVED')}
                              className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenProcessModal(r, 'PAID')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition-all cursor-pointer"
                            >
                              Pay Now
                            </button>
                            <button
                              onClick={() => handleOpenProcessModal(r, 'REJECTED')}
                              className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {r.status === 'APPROVED' && (
                          <button
                            onClick={() => handleOpenProcessModal(r, 'PAID')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition-all cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteRequest(r.id, r.amount, r.user?.name)}
                          className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all cursor-pointer"
                          title="Delete Withdrawal Request Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Process Action Modal ── */}
      {selectedReq && actionType && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1e1f32] border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-white text-base">
                  {actionType === 'PAID' ? 'Disburse Payout & Mark Paid' : (actionType === 'APPROVED' ? 'Approve Withdrawal Request' : 'Reject Withdrawal Request')}
                </h3>
              </div>
              <button
                onClick={() => { setSelectedReq(null); setActionType(null); }}
                className="p-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#181928] p-4 rounded-2xl border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Rider / User:</span>
                <span className="font-bold text-white">{selectedReq.user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Method & Account:</span>
                <span className="font-mono text-emerald-400">{selectedReq.paymentMethod} ({selectedReq.accountNumber})</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-black">
                <span className="text-slate-300">Amount:</span>
                <span className="text-white">৳{formatCurrency(selectedReq.amount)}</span>
              </div>
            </div>

            <form onSubmit={handleProcessSubmit} className="space-y-4 text-xs font-semibold">
              {(actionType === 'PAID' || actionType === 'APPROVED') && (
                <div>
                  <label className="text-slate-300 block mb-1">Transaction ID / Reference (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. TRX-99881122"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-300 block mb-1">Admin Note / Feedback to Rider</label>
                <textarea
                  rows={2}
                  placeholder={actionType === 'REJECTED' ? 'Reason for rejection (e.g. invalid account details)' : 'Payment note or confirmation details'}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => { setSelectedReq(null); setActionType(null); }}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-2 text-white cursor-pointer ${
                    actionType === 'REJECTED' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{processing ? 'Processing...' : `Confirm ${actionType}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog {...dialogProps} />

    </div>
  );
}
