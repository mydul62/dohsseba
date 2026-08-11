'use client';

import React, { useEffect, useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useDeliveryRulesStore } from '@/store/useDeliveryRulesStore';
import { useTranslation } from '@/hooks/useTranslation';
import { formatCurrency } from '@/utils/cn';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, Sparkles, Truck } from 'lucide-react';
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

  if (!mounted) return null;

  const handleProceedToCheckout = () => {
    closeCart();
    router.push('/services/shopping/checkout');
  };

  const subtotal = getSubtotal();
  const { deliveryFee, isFree, amountNeededForFree } = calculateFee(subtotal);
  const total = subtotal + deliveryFee;
  const itemCount = items.reduce((acc, i) => acc + (i.quantity || 1), 0);

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300 ease-in-out ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={closeCart}
    >
      <div
        className={`w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-slate-50 shrink-0">
          <div className="flex items-center gap-2.5 font-black text-slate-800 text-base sm:text-lg">
            <div className="w-9 h-9 rounded-xl bg-[#7eb343]/10 flex items-center justify-center text-[#7eb343] shrink-0 border border-[#7eb343]/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span>{isBn ? 'আপনার কার্ট' : 'Your Shopping Cart'}</span>
            <span className="text-xs bg-[#7eb343] text-white px-2.5 py-0.5 rounded-full font-extrabold shadow-2xs">
              {itemCount} {isBn ? 'টি পণ্য' : 'items'}
            </span>
          </div>

          <button
            onClick={closeCart}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all flex items-center justify-center cursor-pointer active:scale-90"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Free Delivery Progress Bar Header Banner */}
        {items.length > 0 && (
          <div className="bg-emerald-50/80 px-4 py-2.5 border-b border-emerald-100/80 flex items-center gap-2 text-xs font-bold text-emerald-800 shrink-0">
            <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              {isFree ? (
                <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                  {isBn ? 'অভিনন্দন! আপনার ডেলিভারি একদম ফ্রি!' : 'Congrats! You unlocked FREE Delivery!'}
                </span>
              ) : (
                <span>
                  {isBn
                    ? `আর ৳${formatCurrency(amountNeededForFree)} ফ্রী ডেলিভারির জন্য!`
                    : `Add ৳${formatCurrency(amountNeededForFree)} more for FREE delivery!`}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-200">
          {items.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-300 shadow-inner">
                <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
              </div>
              <div className="space-y-1.5 max-w-xs mx-auto">
                <p className="font-extrabold text-slate-800 text-lg">
                  {isBn ? 'আপনার কার্ট খালি' : 'Your cart is empty'}
                </p>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  {isBn
                    ? 'আপনার দৈনন্দিন প্রয়োজনীয় পণ্যগুলো কার্টে যোগ করে বাজার শুরু করুন'
                    : 'Add fresh groceries and daily essentials to start shopping'}
                </p>
              </div>
              <button
                onClick={closeCart}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#7eb343] hover:bg-[#6c9c36] text-white font-extrabold text-xs transition-all shadow-md shadow-[#7eb343]/20 active:scale-95 cursor-pointer mt-2"
              >
                <span>{isBn ? 'পণ্য ব্রাউজ করুন' : 'Browse Products'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            items.map((item: any) => {
              const prod = item.product || item;
              const id = prod.id || item.id;
              const title = prod.title || prod.name || item.name || 'Product';
              const price = prod.price ?? item.price ?? 0;
              const image =
                (Array.isArray(prod.images) && prod.images[0]) ||
                prod.image ||
                item.image ||
                'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200';
              const unit = prod.unit || item.unit;
              const quantity = item.quantity || 1;

              return (
                <div
                  key={id}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-100 bg-white hover:border-[#7eb343]/30 hover:shadow-md hover:shadow-slate-100 transition-all duration-200 group"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0 relative">
                    <img
                      src={image}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-xs truncate leading-snug">
                      {title}
                    </h4>
                    <p className="text-xs text-[#7eb343] font-black mt-1">
                      ৳{formatCurrency(price)}
                      {unit && <span className="text-[10px] text-slate-400 font-normal"> / {unit}</span>}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-2.5">
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50/80 overflow-hidden shadow-2xs">
                        <button
                          onClick={() => updateQuantity(id, quantity - 1)}
                          className="p-1.5 hover:bg-slate-200/80 text-slate-600 transition-colors cursor-pointer active:scale-90"
                          title="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-black text-slate-900 min-w-[22px] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(id, quantity + 1)}
                          className="p-1.5 hover:bg-slate-200/80 text-slate-600 transition-colors cursor-pointer active:scale-90"
                          title="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">
                          ৳{formatCurrency(price * quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-all cursor-pointer active:scale-90"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Subtotal & Action Buttons */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-white space-y-3.5 shrink-0 shadow-lg shadow-slate-200/50">
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>{isBn ? 'সাবটোটাল' : 'Subtotal'}</span>
                <span className="font-bold text-slate-900">৳{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>{isBn ? 'ডেলিভারি চার্জ (ডিএইচএস এলাকা)' : 'Delivery Charge (DOHS Area)'}</span>
                <span className="font-bold text-slate-900">
                  {deliveryFee === 0 || isFree ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] font-black border border-emerald-200">
                      {isBn ? 'ফ্রি ডেলিভারি' : 'FREE'}
                    </span>
                  ) : (
                    `৳${formatCurrency(deliveryFee)}`
                  )}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-2.5 flex justify-between font-black text-base">
                <span className="text-slate-900">{isBn ? 'মোট মূল্য' : 'Total Amount'}</span>
                <span className="text-[#7eb343] text-lg">৳{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Action Buttons: Add More Items, Standard Checkout & Guest Express Checkout */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={closeCart}
                  className="py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer border border-slate-200"
                >
                  <Plus className="w-3.5 h-3.5 text-[#7eb343]" />
                  <span>{isBn ? 'আরও যোগ করুন' : 'Add Items'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="py-3 px-3 rounded-2xl bg-[#7eb343] hover:bg-[#6c9c36] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#7eb343]/25 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>{isBn ? 'চেকআউট' : 'Checkout'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <Link
                href="/services/shopping/checkout/guest"
                onClick={closeCart}
                className="w-full py-3 px-3 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-800 font-extrabold text-xs flex items-center justify-center gap-2 border border-indigo-200/80 transition-all active:scale-[0.98] cursor-pointer block text-center shadow-2xs"
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
