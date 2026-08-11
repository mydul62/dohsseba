'use client';

import React, { useEffect, useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useSiteSettingsStore } from '@/store/useSiteSettingsStore';
import { useDeliveryRulesStore } from '@/store/useDeliveryRulesStore';
import { useTranslation } from '@/hooks/useTranslation';
import { formatCurrency } from '@/utils/cn';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function CartDrawer() {
  const router = useRouter();
  const { items, isOpen, closeCart, updateQuantity, removeItem, getSubtotal } = useCartStore();
  const { fetchRules, calculateFee } = useDeliveryRulesStore();
  const { isBn } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchRules();
  }, [fetchRules]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const handleProceedToCheckout = () => {
    closeCart();
    router.push('/services/shopping/checkout');
  };

  const subtotal = getSubtotal();
  const { deliveryFee, isFree, amountNeededForFree } = calculateFee(subtotal);
  const total = subtotal + deliveryFee;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-500"
      onClick={closeCart}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 font-black text-slate-800 text-base sm:text-lg">
            <ShoppingBag className="w-5 h-5 text-[#7eb343]" />
            <span>{isBn ? 'আপনার কার্ট' : 'Your Shopping Cart'}</span>
            <span className="text-xs bg-[#7eb343]/10 text-[#7eb343] px-2 py-0.5 rounded-full font-bold">
              {items.reduce((acc, i) => acc + (i.quantity || 1), 0)} {isBn ? 'টি পণ্য' : 'items'}
            </span>
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <ShoppingBag className="w-8 h-8 opacity-40" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-700 text-base">
                  {isBn ? 'আপনার কার্ট খালি' : 'Your cart is empty'}
                </p>
                <p className="text-xs text-slate-400">
                  {isBn
                    ? 'অনুগহ করে বাজার থেকে আপনার প্রয়োজনীয় পণ্য যোগ করুন'
                    : 'Add items from the store to start shopping'}
                </p>
              </div>
              <button
                onClick={closeCart}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7eb343] hover:bg-[#6c9c36] text-white font-bold text-xs transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                <span>{isBn ? 'পণ্য দেখুন' : 'Browse Products'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            items.map((item: any) => {
              const prod = item.product || item;
              const id = prod.id || item.id;
              const title = prod.title || prod.name || item.name || 'Product';
              const price = prod.price ?? item.price ?? 0;
              const image = (Array.isArray(prod.images) && prod.images[0]) || prod.image || item.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200';
              const unit = prod.unit || item.unit;
              const quantity = item.quantity || 1;

              return (
                <div
                  key={id}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition-all group"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-100 shrink-0">
                    <img
                      src={image}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-xs truncate">
                      {title}
                    </h4>
                    <p className="text-xs text-[#7eb343] font-extrabold mt-0.5">
                      ৳{formatCurrency(price)}
                      {unit && <span className="text-[10px] text-slate-400 font-normal"> / {unit}</span>}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                        <button
                          onClick={() => updateQuantity(id, quantity - 1)}
                          className="p-1 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-xs font-extrabold text-slate-800 min-w-[20px] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(id, quantity + 1)}
                          className="p-1 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(id)}
                        className="p-1 hover:text-red-500 text-slate-400 transition-colors ml-auto cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Subtotal & Action Buttons */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-white space-y-3 shrink-0">
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>{isBn ? 'সাবটোটাল' : 'Subtotal'}</span>
                <span className="font-bold text-slate-900">৳{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>{isBn ? 'ডেলিভারি চার্জ (ডিএইচএস এলাকা)' : 'Delivery Charge (DOHS Area)'}</span>
                <span className="font-bold text-slate-900">
                  {deliveryFee === 0 || isFree ? (
                    <span className="text-[#7eb343] font-extrabold">{isBn ? 'ফ্রি' : 'FREE'}</span>
                  ) : (
                    `৳${formatCurrency(deliveryFee)}`
                  )}
                </span>
              </div>
              {amountNeededForFree > 0 ? (
                <p className="text-[11px] text-amber-800 bg-amber-50/90 p-2.5 rounded-xl text-center font-bold border border-amber-200 shadow-2xs">
                  {isBn
                    ? `ফ্রি ডেলিভারির জন্য আরও ৳${formatCurrency(amountNeededForFree)} টাকার পণ্য যুক্ত করুন!`
                    : `Add ৳${formatCurrency(amountNeededForFree)} more for FREE delivery!`}
                </p>
              ) : isFree ? (
                <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl text-center font-bold border border-emerald-200 shadow-2xs">
                  {isBn
                    ? `🎉 অভিনন্দন! আপনি ফ্রি ডেলিভারি আনলক করেছেন!`
                    : `🎉 Congratulations! You unlocked FREE delivery!`}
                </p>
              ) : null}
              <div className="border-t border-slate-100 pt-2 flex justify-between font-black text-sm sm:text-base">
                <span className="text-slate-900">{isBn ? 'মোট মূল্য' : 'Total Amount'}</span>
                <span className="text-[#7eb343]">৳{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Action Buttons: Add More Items, Standard Checkout & Guest Express Checkout */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={closeCart}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200"
                >
                  <Plus className="w-3.5 h-3.5 text-[#7eb343]" />
                  <span>{isBn ? 'আরও যোগ করুন' : 'Add Items'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="py-2.5 px-3 rounded-xl bg-[#7eb343] hover:bg-[#6c9c36] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <span>{isBn ? 'চেকআউট' : 'Checkout'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <Link
                href="/services/shopping/checkout/guest"
                onClick={closeCart}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center gap-1.5 border border-indigo-200 transition-all cursor-pointer block text-center"
              >
                <span>⚡ {isBn ? 'গেস্ট এক্সপ্রেস চেকআউট (লগইন ছাড়াই)' : 'Guest Express Checkout (No Login)'}</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
