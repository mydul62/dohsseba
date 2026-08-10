'use client';

import React, { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { formatCurrency } from '@/utils/cn';
import { Tag, Sparkles, Copy, Check, Clock, ShoppingCart, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function OffersClient({ initialCoupons }: { initialCoupons: any[] }) {
  const { language } = useLanguageStore();
  const { applyCoupon, appliedCoupon } = useCartStore();
  const isBn = language === 'BN';

  const [coupons] = useState<any[]>(initialCoupons);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleApplyCoupon = (code: string) => {
    applyCoupon(code);
    handleCopyCode(code);
  };

  return (
    <div className="py-12 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 w-full max-w-[1720px] mx-auto space-y-10 min-h-[70vh]">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-extrabold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{isBn ? 'নিবাসীদের জন্য বিশেষ ছাড়ে অফার' : 'Savar DOHS Exclusive Savings'}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          {isBn ? 'সক্রিয় প্রমোশনাল কুপন ও ডিসকাউন্ট অফার' : 'Active Offers & Discount Coupons'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          {isBn
            ? 'চেকআউট বা কার্টে প্রমো কুপন কোড ব্যবহার করে হোম সার্ভিস ও দৈনিক গ্রোসারি অর্ডারে সর্বোচ্চ সেভিংস উপভোগ করুন।'
            : 'Copy coupon codes or click apply to claim instant discounts on your home services and express daily grocery orders.'}
        </p>
      </div>

      {coupons.length === 0 ? (
        <div className="p-16 rounded-3xl bg-[#1e1f32] border border-white/10 text-center space-y-4 max-w-md mx-auto">
          <Tag className="w-12 h-12 text-amber-400 mx-auto opacity-50" />
          <h3 className="font-bold text-white text-base">No Active Coupons Found</h3>
          <p className="text-xs text-slate-400">Check back soon for new resident deals or explore our services catalog.</p>
          <Link
            href="/services/home-service"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg transition-all"
          >
            <span>Browse Services</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => {
            const isApplied = appliedCoupon === coupon.code;
            const isCopied = copiedCode === coupon.code;
            const discountLabel =
              coupon.discountType === 'PERCENTAGE'
                ? `${coupon.discountValue}% OFF`
                : `৳${formatCurrency(coupon.discountValue)} OFF`;

            return (
              <div
                key={coupon.id || coupon.code}
                className={`p-6 rounded-3xl border transition-all duration-300 space-y-5 relative overflow-hidden flex flex-col justify-between shadow-2xl ${
                  isApplied
                    ? 'bg-amber-500/10 border-amber-500 shadow-amber-500/20'
                    : 'bg-[#1e1f32] border-white/10 hover:border-amber-500/50'
                }`}
              >
                {/* Top Badge & Validity */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1">
                      <Tag className="w-3 h-3 text-amber-400" />
                      <span>{discountLabel}</span>
                    </span>

                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>
                        {coupon.expiresAt
                          ? `Valid till ${new Date(coupon.expiresAt).toLocaleDateString()}`
                          : 'Limited Time'}
                      </span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-white text-lg leading-snug">{coupon.code}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{coupon.description || coupon.title}</p>
                    {coupon.minOrderAmount > 0 && (
                      <p className="text-[11px] text-amber-400/90 font-semibold mt-2">
                        Minimum Order Amount: ৳{formatCurrency(coupon.minOrderAmount)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Coupon Code Action Container */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="p-3 rounded-2xl bg-[#181928] flex items-center justify-between border border-dashed border-amber-500/40">
                    <div className="font-mono font-black text-base tracking-wider text-amber-400">
                      {coupon.code}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(coupon.code)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95 ${
                        isCopied
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? (isBn ? 'কপি হয়েছে!' : 'Copied!') : (isBn ? 'কপি কোড' : 'Copy Code')}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyCoupon(coupon.code)}
                    className={`w-full py-2.5 px-4 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg ${
                      isApplied
                        ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>
                      {isApplied
                        ? (isBn ? 'কার্টে কুপন যুক্ত আছে' : 'Applied to Cart')
                        : (isBn ? 'কুপন প্রয়োগ করুন (Apply Code)' : 'Apply to Cart / Order')}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
