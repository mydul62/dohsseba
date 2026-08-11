'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api-client';
import {
  Star, MessageSquare, ThumbsUp, CheckCircle2, CornerDownRight,
  Search, Filter, Send, X, AlertTriangle, ShieldCheck, Loader2,
  Package, User, Calendar, RefreshCw,
} from 'lucide-react';

function StarRating({ r }: { r: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= r ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
      ))}
    </div>
  );
}

export function ReviewsContent() {
  const [reviews,   setReviews]   = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [ratingFilter, setRating] = useState<number | 0>(0);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText,  setReplyText]  = useState('');
  const [sending,    setSending]    = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchApi<any>('/review-and-rating/seller/reviews')
      .then((r) => {
        if (r.success && Array.isArray(r.data)) {
          setReviews(r.data);
        } else {
          fetchApi<any>('/seller/reviews').then((r2) => {
            if (r2.success && Array.isArray(r2.data)) setReviews(r2.data);
          });
        }
      })
      .catch(() => {
        fetchApi<any>('/seller/reviews')
          .then((r2) => {
            if (r2.success && Array.isArray(r2.data)) setReviews(r2.data);
          })
          .catch((err) => console.error('Reviews fetch failed:', err));
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...reviews];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.comment?.toLowerCase().includes(q) || r.user?.name.toLowerCase().includes(q) || r.product?.name.toLowerCase().includes(q));
    }
    if (ratingFilter > 0) list = list.filter((r) => r.rating === ratingFilter);
    return list;
  }, [reviews, search, ratingFilter]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const ratingCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0];
    reviews.forEach((r) => { counts[r.rating] = (counts[r.rating] || 0) + 1; });
    return counts;
  }, [reviews]);

  const handleSendReply = (id: string) => {
    if (!replyText.trim()) return;
    setSending(true);
    setTimeout(() => {
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, reply: replyText, replyDate: new Date().toISOString() } : r));
      setReplyingId(null);
      setReplyText('');
      setSending(false);
    }, 400);
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-xl bg-[#1f2136]" />
      <div className="h-32 rounded-3xl bg-[#1f2136]" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Dashboard / Reviews</p>
          <h1 className="font-black text-white text-xl flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Customer Reviews & Ratings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">{reviews.length} ratings received across all products</p>
        </div>
      </div>

      {/* ── Rating Summary Card ── */}
      <div className="p-6 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-4 text-center md:text-left border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-6 space-y-1">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Overall Rating</p>
          <div className="flex items-baseline gap-2 justify-center md:justify-start">
            <span className="text-4xl font-black text-white">{avgRating}</span>
            <span className="text-sm text-slate-400">/ 5.0</span>
          </div>
          <StarRating r={Math.round(Number(avgRating))} />
          <p className="text-[11px] text-slate-400 pt-1">Based on {reviews.length} customer reviews</p>
        </div>

        <div className="md:col-span-8 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingCounts[star] || 0;
            const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-bold text-slate-300 flex items-center gap-1">{star} <Star className="w-3 h-3 text-amber-400 fill-amber-400" /></span>
                <div className="flex-1 h-2 rounded-full bg-[#181928] overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-10 text-right text-slate-400 text-[11px] font-mono">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="p-4 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reviews by customer or product…" className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" />
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => setRating(0)} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${ratingFilter === 0 ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>All Ratings</button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button key={star} onClick={() => setRating(star)} className={`px-2.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1 transition-all ${ratingFilter === star ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
              {star} <Star className="w-3 h-3 fill-current" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Reviews Feed ── */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#1f2136] border border-white/10 text-center text-slate-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-bold">No reviews found matching your search</p>
          </div>
        ) : filtered.map((r) => (
          <div key={r.id} className="p-6 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl space-y-4 hover:border-white/20 transition-all">
            {/* Top row */}
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                  {(r.user?.name || r.customer || 'A')[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">{r.user?.name || r.customer || 'Anonymous Customer'}</h4>
                    {r.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified Purchase
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Package className="w-3 h-3 text-indigo-400" /> Product: <span className="text-slate-200 font-semibold">{typeof r.product === 'object' ? r.product?.name : (r.product || 'Product')}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StarRating r={r.rating ?? 5} />
                <span className="text-[11px] text-slate-500">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' }) : (r.date || 'Recent')}
                </span>
              </div>
            </div>

            {/* Comment */}
            <p className="text-slate-200 text-xs leading-relaxed pl-13">{r.comment}</p>

            {/* Existing Seller Reply */}
            {r.reply && (
              <div className="ml-8 p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 space-y-1">
                <p className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                  <CornerDownRight className="w-3.5 h-3.5" /> Your Reply
                  <span className="text-[9px] text-slate-500 font-normal">({new Date(r.replyDate!).toLocaleDateString('en-BD')})</span>
                </p>
                <p className="text-xs text-slate-300">{r.reply}</p>
              </div>
            )}

            {/* Reply Action */}
            {!r.reply && (
              <div className="pl-13">
                {replyingId === r.id ? (
                  <div className="space-y-2">
                    <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write your official response to this customer..." rows={2} className="w-full px-3.5 py-2 rounded-xl bg-[#181928] border border-indigo-500 text-white text-xs placeholder-slate-500 focus:outline-none resize-none" />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setReplyingId(null)} className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/5">Cancel</button>
                      <button onClick={() => handleSendReply(r.id)} disabled={sending} className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all">
                        {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Send Reply
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setReplyingId(r.id); setReplyText(''); }} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                    <CornerDownRight className="w-3.5 h-3.5" /> Reply to customer
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
