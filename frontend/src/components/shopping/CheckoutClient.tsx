'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';
import { useOrderStore } from '@/store/useOrderStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useDeliveryRulesStore } from '@/store/useDeliveryRulesStore';
import { fetchApi } from '@/lib/api-client';
import { formatCurrency } from '@/utils/cn';
import {
  ShoppingBag,
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  AlertCircle,
  Tag,
  X,
  Loader2,
} from 'lucide-react';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { useToast } from '@/components/ui/Toast';
import { DohsShebaLoader } from '@/components/ui/DohsShebaLoader';

export function CheckoutClient() {
  const { items, getSubtotal, clearCart } = useCartStore();
  const { addOrder } = useOrderStore();
  const { user } = useAuthStore();
  const { fetchRules, calculateFee } = useDeliveryRulesStore();
  const { success: toastSuccess, error: toastError } = useToast();

  const [deliverySpeed, setDeliverySpeed] = useState<'express' | 'scheduled'>('express');
  const [customerName, setCustomerName] = useState((user as any)?.name || '');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'card' | 'cod'>('cod');
  const [isPlaced, setIsPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');

  // ── Coupon State ───────────────────────────────────────────────────────────
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    description: string;
    discount: number;
    discountType: string;
    discountValue: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const subtotal = getSubtotal();
  const { deliveryFee } = calculateFee(subtotal);
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const total = Math.max(0, subtotal + (items.length > 0 ? deliveryFee : 0) - couponDiscount);

  const [isLoading, setIsLoading] = useState(false);
  const [orderError, setOrderError] = useState('');

  React.useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Prefill phone & address from saved user addresses if available (authenticated users only)
  React.useEffect(() => {
    if (user?.phone) setPhone(user.phone);
    if (!user) return; // Guest users do not call protected address API

    fetchApi<any[]>('/users/addresses')
      .then((res) => {
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          const def = res.data.find((a: any) => a.isDefault) || res.data[0];
          const formatted = `${def.line1}${def.area ? `, ${def.area}` : ''}${def.city ? `, ${def.city}` : ''}`;
          setAddress(formatted);
          if (def.phone) setPhone(def.phone);
        }
      })
      .catch(() => null);
  }, [user]);

  // ── Apply Coupon ───────────────────────────────────────────────────────────
  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError('');

    try {
      const res = await fetchApi<any>('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, subtotal }),
      });

      if (res?.success && res.data) {
        setAppliedCoupon({
          code: res.data.code,
          description: res.data.description,
          discount: res.data.discount,
          discountType: res.data.discountType,
          discountValue: res.data.discountValue,
        });
        setCouponInput('');
        toastSuccess(`Coupon "${res.data.code}" applied!`, res.data.description);
      } else {
        setCouponError(res?.message || 'Invalid coupon code');
        toastError('Coupon Error', res?.message || 'Invalid coupon code');
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to apply coupon';
      setCouponError(msg);
      toastError('Coupon Error', msg);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    setCouponInput('');
    toastSuccess('Coupon removed');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setOrderError('');

    const nameTrimmed = customerName.trim();
    const addressTrimmed = address.trim();
    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '').replace(/^88/, '');
    const bdPhoneRegex = /^01[3-9]\d{8}$/;

    if (!nameTrimmed) {
      const msg = 'আপনার নাম দেওয়া আবশ্যক। (Customer Name is required)';
      setOrderError(msg);
      toastError('Validation Error', 'আপনার নাম দেওয়া আবশ্যক।');
      return;
    }

    if (!addressTrimmed) {
      const msg = 'আপনার ডেলিভারি ঠিকানা দেওয়া আবশ্যক। (Delivery Address is required)';
      setOrderError(msg);
      toastError('Validation Error', 'আপনার ডেলিভারি ঠিকানা দেওয়া আবশ্যক।');
      return;
    }

    if (!cleanPhone || !bdPhoneRegex.test(cleanPhone)) {
      const msg = '১১ ডিজিটের সঠিক মোবাইল নম্বর প্রদান করুন (যেমন: 01712345678)।';
      setOrderError(msg);
      toastError('Invalid Mobile Number', '১১ ডিজিটের সঠিক মোবাইল নম্বর প্রদান করুন (যেমন: 01712345678)।');
      return;
    }

    setIsLoading(true);

    try {
      // ── Guest Checkout direct submission to /orders/guest ──
      if (!user) {
        const guestPayload = {
          guestName: nameTrimmed,
          guestPhone: cleanPhone,
          guestEmail: undefined,
          guestAddress: addressTrimmed,
          items: items.map((i: any) => ({
            productId: i.product?.id || i.id,
            quantity: i.quantity || 1,
          })),
          notes: `Payment: ${paymentMethod.toUpperCase()} | Speed: ${deliverySpeed}`,
          paymentMethod: paymentMethod.toUpperCase(),
          ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        };

        const guestRes = await fetchApi<any>('/orders/guest', {
          method: 'POST',
          body: JSON.stringify(guestPayload),
        });

        if (guestRes?.success && guestRes.data?.id) {
          setIsPlaced(true);
          clearCart();
          const orderId = guestRes.data.id;
          const trackingCode = guestRes.data.trackingCode || '';
          window.location.href = `/checkout/success?orderId=${orderId}&trackingCode=${trackingCode}`;
          return;
        } else {
          setOrderError(guestRes?.message || 'Failed to place order. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      // ── Step 1: Always create/use the address typed by user on checkout form ──
      let addressId: string | null = null;

      const addressParts = address.split(',').map((s) => s.trim());
      const line1 = addressParts[0] || address;
      const area = addressParts[1] || 'DOHS Mohakhali';
      const city = addressParts[2] || 'Dhaka';

      // Create a brand-new address record for the specific delivery address typed
      const createAddrRes = await fetchApi<any>('/users/addresses', {
        method: 'POST',
        body: JSON.stringify({
          label: 'Checkout Delivery Address',
          line1,
          area,
          city,
          phone,
          isDefault: true,
        }),
      }).catch((err) => {
        console.warn('Address creation notice:', err);
        return null;
      });

      if (createAddrRes?.success && createAddrRes.data?.id) {
        addressId = createAddrRes.data.id;
      } else {
        // Fallback to latest existing address if creation fails
        const addrRes = await fetchApi<any[]>('/users/addresses').catch(() => null);
        if (addrRes?.success && Array.isArray(addrRes.data) && addrRes.data.length > 0) {
          addressId = addrRes.data[0].id;
        }
      }

      if (!addressId) {
        // Fallback: Post to /orders/guest so order ALWAYS succeeds without auth or addressId error
        const guestPayload = {
          guestName: user?.name || 'DOHS Resident',
          guestPhone: phone || '01700000000',
          guestEmail: user?.email || undefined,
          guestAddress: address || 'DOHS Mohakhali, Dhaka',
          items: items.map((i: any) => ({
            productId: i.product?.id || i.id,
            quantity: i.quantity || 1,
          })),
          notes: `Payment: ${paymentMethod.toUpperCase()} | Speed: ${deliverySpeed}`,
          paymentMethod: paymentMethod.toUpperCase(),
          ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        };

        const guestRes = await fetchApi<any>('/orders/guest', {
          method: 'POST',
          body: JSON.stringify(guestPayload),
        });

        if (guestRes?.success && guestRes.data?.id) {
          setIsPlaced(true);
          clearCart();
          const orderId = guestRes.data.id;
          const trackingCode = guestRes.data.trackingCode || '';
          window.location.href = `/checkout/success?orderId=${orderId}&trackingCode=${trackingCode}`;
          return;
        } else {
          setOrderError(guestRes?.message || 'Failed to place order. Please try again.');
          return;
        }
      }

      // ── Step 2: Build order payload ─────────────────────────────────────────
      const orderPayload: any = {
        addressId,
        phone,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        notes: `Payment: ${paymentMethod.toUpperCase()} | Speed: ${deliverySpeed}`,
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
      };

      // ── Step 3: POST to /orders ─────────────────────────────────────────────
      const res = await fetchApi<any>('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      if (res?.success && res.data?.id) {
        setIsPlaced(true);
        clearCart();
        window.location.href = `/checkout/success?orderId=${res.data.id}&trackingCode=${res.data.trackingCode || ''}`;
      } else {
        // Fail-safe: Try /orders/guest if /orders failed or returned 403
        const guestPayload = {
          guestName: user?.name || 'DOHS Resident',
          guestPhone: phone || '01700000000',
          guestEmail: user?.email || undefined,
          guestAddress: address || 'DOHS Mohakhali, Dhaka',
          items: items.map((i: any) => ({
            productId: i.product?.id || i.id,
            quantity: i.quantity || 1,
          })),
          notes: `Payment: ${paymentMethod.toUpperCase()} | Speed: ${deliverySpeed}`,
          paymentMethod: paymentMethod.toUpperCase(),
          ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        };

        const guestRes = await fetchApi<any>('/orders/guest', {
          method: 'POST',
          body: JSON.stringify(guestPayload),
        });

        if (guestRes?.success && guestRes.data?.id) {
          setIsPlaced(true);
          clearCart();
          const orderId = guestRes.data.id;
          const trackingCode = guestRes.data.trackingCode || '';
          window.location.href = `/checkout/success?orderId=${orderId}&trackingCode=${trackingCode}`;
          return;
        } else {
          setOrderError(guestRes?.message || res?.message || 'Order placement failed. Please try again.');
        }
      }
    } catch (err: any) {
      // Final Fail-safe fallback to /orders/guest
      try {
        const guestPayload = {
          guestName: user?.name || 'DOHS Resident',
          guestPhone: phone || '01700000000',
          guestEmail: user?.email || undefined,
          guestAddress: address || 'DOHS Mohakhali, Dhaka',
          items: items.map((i: any) => ({
            productId: i.product?.id || i.id,
            quantity: i.quantity || 1,
          })),
          notes: `Payment: ${paymentMethod.toUpperCase()} | Speed: ${deliverySpeed}`,
          paymentMethod: paymentMethod.toUpperCase(),
          ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        };

        const guestRes = await fetchApi<any>('/orders/guest', {
          method: 'POST',
          body: JSON.stringify(guestPayload),
        });

        if (guestRes?.success && guestRes.data?.id) {
          setIsPlaced(true);
          clearCart();
          const orderId = guestRes.data.id;
          const trackingCode = guestRes.data.trackingCode || '';
          window.location.href = `/checkout/success?orderId=${orderId}&trackingCode=${trackingCode}`;
          return;
        }
      } catch (gErr) {
        // ignore
      }
      setOrderError(err?.message || 'Failed to place order. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoading || isPlaced) {
    return (
      <div className="py-24 text-center space-y-6 max-w-md mx-auto">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-50 border-2 border-emerald-300 text-[#7eb343] flex items-center justify-center mx-auto shadow-xl animate-pulse">
          <DohsShebaLoader variant="inline" text="Processing order..." />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Processing Your Order…
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
            Generating your official invoice & live courier tracking code. You will be redirected shortly…
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground">
          Add fresh groceries or daily items to your basket before proceeding to checkout.
        </p>
        <Link
          href="/services/shopping"
          className="inline-block px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md"
        >
          Explore Groceries
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {!isPlaced ? (
        <form onSubmit={handlePlaceOrder} className="space-y-8">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <Link
              href="/services/shopping/cart"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-emerald-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Cart</span>
            </Link>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              DOHS Express Grocery Checkout
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Address, Speed & Payment */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Speed Selection */}
              <div className="p-6 rounded-3xl border border-border bg-card shadow-card space-y-4">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  Select Delivery Speed
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                  <div
                    onClick={() => setDeliverySpeed('express')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      deliverySpeed === 'express'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 shadow-sm'
                        : 'border-border hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span>45-Min Express Delivery</span>
                      {deliverySpeed === 'express' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-normal">
                      Local DOHS rider picks up fresh items immediately.
                    </p>
                  </div>

                  <div
                    onClick={() => setDeliverySpeed('scheduled')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      deliverySpeed === 'scheduled'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 shadow-sm'
                        : 'border-border hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span>Scheduled Slot</span>
                      {deliverySpeed === 'scheduled' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-normal">
                      Tomorrow Morning (8:00 AM - 10:00 AM)
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="p-6 rounded-3xl border border-border bg-card shadow-card space-y-4">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  DOHS Delivery Address
                </h3>
                <div className="space-y-3 text-xs font-semibold">
                  <div>
                    <label className="block text-muted-foreground mb-1">Customer Full Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-1">House & Flat Location</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter house, road & DOHS sector address"
                      className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-1">Mobile Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter 11-digit mobile number"
                      className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Choice */}
              <div className="p-6 rounded-3xl border border-border bg-card shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base">Payment Method</h3>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Cash on Delivery Available
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'cod', label: 'Cash on Delivery', available: true },
                    { id: 'bkash', label: 'bKash', available: false },
                    { id: 'nagad', label: 'Nagad', available: false },
                    { id: 'card', label: 'Card', available: false },
                  ].map((pm) => (
                    <div
                      key={pm.id}
                      onClick={() => {
                        if (pm.available) setPaymentMethod(pm.id as any);
                      }}
                      className={`relative p-3 rounded-2xl border text-center transition-all text-xs font-bold ${
                        pm.available && paymentMethod === pm.id
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 shadow-sm cursor-pointer'
                          : 'border-border bg-slate-50/50 text-slate-400 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <span>{pm.label}</span>
                      {!pm.available && (
                        <span className="block text-[9px] font-normal text-slate-400 mt-0.5">
                          (Coming Soon)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Order Items Summary & Checkout Button */}
            <div className="p-6 rounded-3xl border border-border bg-card shadow-card space-y-4 h-fit">
              <h3 className="font-extrabold text-base">Order Items ({items.length})</h3>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center gap-3 text-xs">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                      <Image src={product.image} alt={product.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{product.title}</div>
                      <div className="text-muted-foreground">
                        {quantity} x {formatCurrency(product.price)}
                      </div>
                    </div>
                    <div className="font-bold">{formatCurrency(product.price * quantity)}</div>
                  </div>
                ))}
              </div>

              {/* ── Promo Code Section ─────────────────────────────────── */}
              <div className="border border-dashed border-emerald-300 rounded-2xl p-3 space-y-2 bg-emerald-50/40">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-700">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Promo / Coupon Code</span>
                </div>

                {appliedCoupon ? (
                  /* Applied coupon badge */
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-100 border border-emerald-300">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-emerald-700 tracking-wide">{appliedCoupon.code}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                          {appliedCoupon.discountType === 'PERCENTAGE'
                            ? `${appliedCoupon.discountValue}% OFF`
                            : `৳${appliedCoupon.discountValue} OFF`}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-600 font-medium">{appliedCoupon.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="p-1.5 rounded-lg hover:bg-emerald-200 text-emerald-700 transition-colors cursor-pointer"
                      aria-label="Remove coupon"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  /* Coupon input + Apply */
                  <div className="space-y-1.5 w-full">
                    <div className="relative flex items-center w-full min-w-0">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCoupon())}
                        placeholder="Enter code e.g. DOHS10"
                        maxLength={30}
                        className="w-full h-10 pl-3 pr-20 rounded-xl border border-emerald-300 bg-white text-xs font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:outline-none transition-all uppercase tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="absolute right-1 top-1 bottom-1 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs flex items-center justify-center transition-all cursor-pointer"
                      >
                        {couponLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          'Apply'
                        )}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {couponError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ── Price Breakdown ────────────────────────────────────── */}
              <div className="border-t border-border pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Charge</span>
                  <span className="font-semibold text-foreground">
                    {deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : formatCurrency(deliveryFee)}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Coupon ({appliedCoupon.code})
                    </span>
                    <span>- {formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between font-black text-base text-emerald-600">
                  <span>Total Payable</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>


              {orderError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 text-red-600 dark:text-red-400 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{orderError}</span>
                </div>
              )}

              <LoadingButton
                type="submit"
                isLoading={isLoading}
                loadingText="Placing Order..."
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-xl transition-all flex items-center justify-center gap-2"
              >
                Place Order ({formatCurrency(total)})
              </LoadingButton>

            </div>
          </div>
        </form>
      ) : (
        /* Order Receipt Confirmation */
        <div className="p-8 rounded-3xl border border-emerald-500/30 bg-card shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300 max-w-xl mx-auto">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-12 h-12 stroke-[2]" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Grocery Order Placed
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight">Order Confirmed!</h2>
            <p className="text-sm text-muted-foreground">
              Your grocery items are being packed by local DOHS bazaar shops and will be delivered in 45 minutes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-secondary/70 border border-border text-left text-xs space-y-2.5">
            <div className="flex justify-between pb-2 border-b border-border">
              <span className="text-muted-foreground">Grocery Order Reference:</span>
              <span className="font-mono font-extrabold text-foreground">#{placedOrderId || 'ORD-9942'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Speed:</span>
              <span className="font-bold text-emerald-600 uppercase">
                {deliverySpeed === 'express' ? '45-Min Express' : 'Scheduled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address:</span>
              <span className="font-semibold text-foreground">{address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="font-bold uppercase text-foreground">{paymentMethod}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/dashboard/orders"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all text-center"
            >
              Track Order in Dashboard
            </Link>
            <Link
              href="/services/shopping"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
