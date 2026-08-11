'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';
import { formatCurrency } from '@/utils/cn';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Tag,
  Truck,
} from 'lucide-react';

import { useDeliveryRulesStore } from '@/store/useDeliveryRulesStore';

export default function FullCartPage() {
  const { items, updateQuantity, removeItem, clearCart, getSubtotal } = useCartStore();
  const { fetchRules, calculateFee } = useDeliveryRulesStore();
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');

  React.useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const subtotal = getSubtotal();
  const { deliveryFee, isFree, amountNeededForFree } = calculateFee(subtotal);
  const total = Math.max(0, subtotal - appliedDiscount + (items.length > 0 ? deliveryFee : 0));

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === 'DOHS20') {
      const disc = Math.round(subtotal * 0.2);
      setAppliedDiscount(disc);
      setCouponMsg('Coupon DOHS20 applied! 20% discount added.');
    } else if (couponCode.toUpperCase() === 'FREESHIP') {
      setAppliedDiscount(deliveryFee);
      setCouponMsg('Free shipping coupon applied!');
    } else {
      setCouponMsg('Invalid coupon code. Try DOHS20 or FREESHIP');
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto px-4">
        <div className="w-24 h-24 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
          <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
        </div>
        <h1 className="text-3xl font-extrabold">Your Cart is Empty</h1>
        <p className="text-sm text-muted-foreground">
          Browse our fresh daily groceries, fruits, vegetables & market essentials.
        </p>
        <Link
          href="/services/shopping"
          className="inline-block px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg transition-all"
        >
          Explore Shopping Market
        </Link>
      </div>
    );
  }

  return (
    <div className="py-10 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 w-full max-w-[1720px] mx-auto space-y-8">
      <h1 className="text-3xl font-extrabold">Shopping Cart ({items.length} Items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns: Items Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-semibold">
            <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              {isFree
                ? '🎉 Congratulations! You qualify for FREE DOHS Express Delivery.'
                : amountNeededForFree > 0
                ? `Add ${formatCurrency(amountNeededForFree)} more to unlock FREE Delivery.`
                : `Delivery charge: ৳${formatCurrency(deliveryFee)}`}
            </span>
          </div>

          <div className="space-y-3">
            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="p-4 rounded-3xl border border-border bg-card shadow-card flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-secondary flex-shrink-0">
                    <Image src={product.image} alt={product.title} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm truncate">{product.title}</h3>
                    <p className="text-xs text-muted-foreground">{product.unit}</p>
                    <div className="text-sm font-bold text-emerald-600 mt-1">
                      {formatCurrency(product.price)}
                    </div>
                  </div>
                </div>

                {/* Stepper & Subtotal */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 border border-border rounded-xl p-1 bg-secondary/50">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="p-1 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold px-2.5 min-w-[20px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="p-1 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="font-extrabold text-sm text-foreground min-w-[70px] text-right">
                    {formatCurrency(product.price * quantity)}
                  </div>

                  <button
                    onClick={() => removeItem(product.id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={clearCart}
              className="text-xs text-muted-foreground hover:text-destructive font-semibold"
            >
              Clear Entire Cart
            </button>
            <Link
              href="/services/shopping"
              className="text-xs text-emerald-600 font-bold hover:underline"
            >
              + Add More Items
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary & Coupon */}
        <div className="p-6 rounded-3xl border border-border bg-card shadow-card space-y-6">
          <h2 className="font-extrabold text-lg">Order Summary</h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Items Subtotal</span>
              <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
            </div>

            {appliedDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Coupon Discount</span>
                <span>-{formatCurrency(appliedDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between text-muted-foreground">
              <span>Delivery Charge</span>
              <span className="font-semibold text-foreground">
                {deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : formatCurrency(deliveryFee)}
              </span>
            </div>

            <div className="border-t border-border pt-3 flex justify-between font-black text-lg text-emerald-600">
              <span>Total Payable</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Promo Coupon Input */}
          <form onSubmit={handleApplyCoupon} className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground block flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              Apply Coupon Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="e.g. DOHS20"
                className="w-full h-10 px-3 rounded-xl border border-input text-xs font-mono font-bold uppercase"
              />
              <button
                type="submit"
                className="h-10 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs"
              >
                Apply
              </button>
            </div>
            {couponMsg && <p className="text-[11px] font-semibold text-emerald-600">{couponMsg}</p>}
          </form>

          <Link
            href="/services/shopping/checkout"
            className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl transition-all"
          >
            <span>Proceed to Express Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
