'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';
import { useOrderStore } from '@/store/useOrderStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useDeliveryRulesStore } from '@/store/useDeliveryRulesStore';
import { fetchApi } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/utils/cn';
import {
  ShoppingBag,
  Truck,
  MapPin,
  CreditCard,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Check,
  ChevronLeft,
  AlertCircle,
  Tag,
  X,
  Loader2,
  ArrowRight,
} from 'lucide-react';

const getSvgGroceryPlaceholder = (title: string) => {
  const t = String(title || '').toLowerCase();
  let bg = '%23eaf4ed'; // light emerald
  let stroke = '%231c5335'; // dark emerald
  let icon = '<path d="m15 11-1 9"/><path d="m19 11-4-7"/><path d="M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.6-7.4"/><path d="m9 11 1 9"/><path d="M9 4 5 11"/>'; // basket

  if (t.includes('fish') || t.includes('মাছ') || t.includes('ilish') || t.includes('hilsha')) {
    bg = '%23e0f2fe'; // sky blue
    stroke = '%230369a1';
    icon = '<path d="M6.5 12c.94-2.07 3.08-3.5 5.5-3.5 3.31 0 6 2.69 6 6 0 1.66-.67 3.16-1.76 4.24"/><path d="M2 12s3-6 10-6 10 6 10 6-3 6-10 6S2 12 2 12z"/>';
  } else if (t.includes('flour') || t.includes('ময়দা') || t.includes('ময়দা') || t.includes('আটা') || t.includes('rice') || t.includes('চাল')) {
    bg = '%23fef3c7'; // amber
    stroke = '%23b45309';
    icon = '<path d="M6 2v20M18 2v20M12 6v12M6 8h12M6 16h12"/>';
  } else if (t.includes('vim') || t.includes('liquid') || t.includes('লিকুইড')) {
    bg = '%23f3e8ff'; // purple
    stroke = '%236b21a8';
    icon = '<path d="M9 3h6v3H9z"/><path d="M10 6v3h4V6"/><path d="M5 12a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-7z"/>';
  }

  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="background:${bg};">${icon}</svg>`;
};

const getValidProductImage = (item: any): string => {
  const prod = item?.product || item || {};
  const title = String(prod.title || prod.name || item?.title || item?.name || '');
  const t = title.toLowerCase();
  
  const rawImg = prod.image || prod.imageUrl || (Array.isArray(prod.images) && prod.images[0]) || item?.image || item?.imageUrl || '';
  
  if (rawImg && typeof rawImg === 'string' && rawImg.trim() && !rawImg.includes('undefined')) {
    const clean = rawImg.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
      return clean;
    }
    if (clean.startsWith('/')) {
      return clean;
    }
    return `/${clean}`;
  }

  if (t.includes('মরিচ') || t.includes('mori') || t.includes('chilli') || t.includes('chili')) {
    return 'https://images.unsplash.com/photo-1588879460618-924446702a60?w=300&auto=format&fit=crop&q=80';
  }
  if (t.includes('লিকুইড') || t.includes('vim') || t.includes('liquid') || t.includes('soap')) {
    return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80';
  }
  if (t.includes('তেল') || t.includes('oil') || t.includes('tel')) {
    return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=80';
  }
  if (t.includes('ময়দা') || t.includes('ময়দা') || t.includes('আটা') || t.includes('flour') || t.includes('rice') || t.includes('চাল')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80';
  }
  if (t.includes('মাছ') || t.includes('fish') || t.includes('ilish') || t.includes('hilsha')) {
    return 'https://images.unsplash.com/photo-1534942519507-769d4679447d?w=300&auto=format&fit=crop&q=80';
  }
  if (t.includes('দুধ') || t.includes('milk') || t.includes('dudh')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80';
  }
  if (t.includes('ডিম') || t.includes('egg') || t.includes('dima')) {
    return 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=300&auto=format&fit=crop&q=80';
  }
  if (t.includes('মাংস') || t.includes('chicken') || t.includes('meat')) {
    return 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=300&auto=format&fit=crop&q=80';
  }

  return getSvgGroceryPlaceholder(title);
};

export function CheckoutClient() {
  const { items, getSubtotal, clearCart } = useCartStore();
  const { addOrder } = useOrderStore();
  const { user } = useAuthStore();
  const { fetchRules, calculateFee } = useDeliveryRulesStore();
  const { success: toastSuccess, error: toastError } = useToast();

  const [deliverySpeed, setDeliverySpeed] = useState<string>('express');
  const [deliveryOptions, setDeliveryOptions] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'card' | 'cod'>('cod');
  const [isPlaced, setIsPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');

  // Fetch dynamic delivery speed options from DB
  useEffect(() => {
    fetchApi<any[]>('/delivery-rules/options')
      .then((res) => {
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setDeliveryOptions(res.data);
          setDeliverySpeed(res.data[0].speedKey);
        }
      })
      .catch(() => null);
  }, []);

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

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);



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
      const msg = 'আপনার নাম দেওয়া আবশ্যক। (Customer Name is required)';
      setOrderError(msg);
      toastError('Validation Error', 'আপনার নাম দেওয়া আবশ্যক।');
      return;
    }

    if (!addressTrimmed) {
      const msg = 'আপনার ডেলিভারি ঠিকানা দেওয়া আবশ্যক। (Delivery Address is required)';
      setOrderError(msg);
      toastError('Validation Error', 'আপনার ডেলিভারি ঠিকানা দেওয়া আবশ্যক।');
      return;
    }

    if (!cleanPhone || !bdPhoneRegex.test(cleanPhone)) {
      const msg = '১১ ডিজিটের সঠিক মোবাইল নম্বর প্রদান করুন (যেমন: 01580450353)।';
      setOrderError(msg);
      toastError('Invalid Mobile Number', '১১ ডিজিটের সঠিক মোবাইল নম্বর প্রদান করুন (যেমন: 01580450353)।');
      return;
    }

    setIsLoading(true);

    try {
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

      let addressId: string | null = null;
      const line1 = addressTrimmed;
      const addressParts = addressTrimmed.split(',').map((s) => s.trim());
      const area = addressParts[1] || 'DOHS Mohakhali';
      const city = addressParts[2] || 'Dhaka';

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
      }).catch(() => null);

      if (createAddrRes?.success && createAddrRes.data?.id) {
        addressId = createAddrRes.data.id;
      } else {
        const addrRes = await fetchApi<any[]>('/users/addresses').catch(() => null);
        if (addrRes?.success && Array.isArray(addrRes.data) && addrRes.data.length > 0) {
          addressId = addrRes.data[0].id;
        }
      }

      if (!addressId) {
        const guestPayload = {
          guestName: user?.name || nameTrimmed || 'DOHS Resident',
          guestPhone: phone || '01580450353',
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

      const orderPayload: any = {
        addressId,
        customerName: nameTrimmed,
        phone,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        notes: `Name: ${nameTrimmed}. Phone: ${phone}. Address: ${addressTrimmed}. Payment: ${paymentMethod.toUpperCase()} | Speed: ${deliverySpeed}`,
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
      };

      const res = await fetchApi<any>('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      if (res?.success && res.data?.id) {
        setIsPlaced(true);
        clearCart();
        window.location.href = `/checkout/success?orderId=${res.data.id}&trackingCode=${res.data.trackingCode || ''}`;
      } else {
        const guestPayload = {
          guestName: user?.name || nameTrimmed || 'DOHS Resident',
          guestPhone: phone || '01580450353',
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
      setOrderError(err?.message || 'Failed to place order. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || isPlaced) {
    return (
      <div className="py-24 text-center space-y-6 max-w-md mx-auto">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#eaf4ed] border-2 border-[#1c5335] text-[#1c5335] flex items-center justify-center mx-auto shadow-xl animate-pulse">
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
      <div className="py-16 text-center space-y-4 max-w-md mx-auto font-sans">
        <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Your cart is empty</h2>
        <p className="text-sm text-slate-500">
          Add fresh groceries or daily items to your basket before proceeding to checkout.
        </p>
        <Link
          href="/services/shopping"
          className="inline-block px-6 py-3 rounded-xl bg-[#1c5335] hover:bg-[#143e27] text-white font-bold text-xs shadow-md transition-all"
        >
          Explore Groceries
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#faf8f2] text-slate-800 font-sans py-4 sm:py-8 px-2 sm:px-4 lg:px-8">
      <div className="max-w-[1300px] mx-auto space-y-6">

        {/* ── Top Header Navigation Bar & Stepper ── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#e8e4d9] pb-4">
          <Link
            href="/services/shopping/cart"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#1c5335] hover:underline transition-colors self-start md:self-auto"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to cart</span>
          </Link>

          {/* Stepper Progress */}
          <div className="flex items-center gap-3 text-xs font-bold">
            {/* Step 1: Cart */}
            <div className="flex items-center gap-1.5 text-slate-800">
              <span className="w-6 h-6 rounded-full bg-[#1c5335] text-white flex items-center justify-center text-[11px]">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
              <span>Cart</span>
            </div>
            <div className="w-8 sm:w-12 h-[2px] bg-[#1c5335]" />

            {/* Step 2: Checkout */}
            <div className="flex items-center gap-1.5 text-slate-800">
              <span className="w-6 h-6 rounded-full bg-[#c88d2b] text-white flex items-center justify-center text-xs font-black">
                2
              </span>
              <span>Checkout</span>
            </div>
            <div className="w-8 sm:w-12 h-[2px] bg-slate-300" />

            {/* Step 3: Confirmation */}
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-6 h-6 rounded-full border border-slate-300 text-slate-400 flex items-center justify-center text-xs font-semibold">
                3
              </span>
              <span>Confirmation</span>
            </div>
          </div>

          {/* Header Right Title */}
          <span className="text-[11px] sm:text-xs font-extrabold text-[#1c5335] uppercase tracking-wider hidden lg:block">
            DOHS EXPRESS GROCERY CHECKOUT
          </span>
        </div>

        {/* ── Main Form Grid ── */}
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Delivery Speed, Address & Payment (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-5">

            {/* Section 1: Select Delivery Speed */}
            <div className="bg-white rounded-2xl border border-[#e8e4d9] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#eaf4ed] text-[#1c5335] flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#1c5335] leading-tight">
                    Select delivery speed
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Choose how soon you'd like your order
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(deliveryOptions.length > 0
                  ? deliveryOptions
                  : [
                      {
                        id: 'opt_1',
                        speedKey: 'express',
                        title: '45-minute express',
                        badge: 'FASTEST',
                        description: 'A local DOHS rider picks up your fresh items immediately.',
                      },
                      {
                        id: 'opt_2',
                        speedKey: 'scheduled',
                        title: 'Scheduled slot',
                        badge: null,
                        description: 'Tomorrow morning, 8:00–10:00 AM.',
                      },
                    ]
                ).map((opt) => {
                  const isSelected = deliverySpeed === opt.speedKey;
                  return (
                    <div
                      key={opt.id || opt.speedKey}
                      onClick={() => setDeliverySpeed(opt.speedKey)}
                      className={`relative rounded-2xl p-4 sm:p-5 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-2 border-[#1c5335] bg-[#fbfdfb] shadow-2xs'
                          : 'border border-[#e8e4d9] bg-white hover:border-slate-300'
                      }`}
                    >
                      {opt.badge && (
                        <span className="bg-[#fbf4e6] text-[#b3771e] text-[9px] font-black tracking-wider px-2 py-0.5 rounded-md uppercase inline-block mb-1.5">
                          {opt.badge}
                        </span>
                      )}
                      <h4 className="font-extrabold text-[#1c5335] text-xs sm:text-sm">
                        {opt.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                        {opt.description}
                      </p>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#1c5335] text-white flex items-center justify-center absolute top-3.5 right-3.5">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 absolute top-3.5 right-3.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2: DOHS Delivery Address */}
            <div className="bg-white rounded-2xl border border-[#e8e4d9] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#eaf4ed] text-[#1c5335] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#1c5335] leading-tight">
                    DOHS delivery address
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Where should we bring your order
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 pt-1">
                <div>
                  <label className="text-xs text-slate-600 font-bold mb-1 block">Customer full name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahim Ahmed"
                    className="w-full h-11 px-4 rounded-xl border border-[#e5e1d5] bg-[#fbf9f4] text-slate-800 font-medium text-xs sm:text-sm focus:outline-none focus:border-[#1c5335] focus:bg-white transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 font-bold mb-1 block">House & flat location</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. House #12, Road #04, DOHS Mohakhali"
                    className="w-full h-11 px-4 rounded-xl border border-[#e5e1d5] bg-[#fbf9f4] text-slate-800 font-medium text-xs sm:text-sm focus:outline-none focus:border-[#1c5335] focus:bg-white transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 font-bold mb-1 block">Mobile number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 01712345678"
                    className="w-full h-11 px-4 rounded-xl border border-[#e5e1d5] bg-[#fbf9f4] text-slate-800 font-medium text-xs sm:text-sm focus:outline-none focus:border-[#1c5335] focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Payment Method */}
            <div className="bg-white rounded-2xl border border-[#e8e4d9] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#eaf4ed] text-[#1c5335] flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#1c5335] leading-tight">
                      Payment method
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select how you'd like to pay
                    </p>
                  </div>
                </div>

                <span className="bg-[#eaf4ed] text-[#1c5335] font-extrabold text-[10px] sm:text-xs px-3 py-1 rounded-full border border-emerald-200/50">
                  Cash on delivery available
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {[
                  { id: 'cod', label: 'Cash', sub: 'On delivery', available: true },
                  { id: 'bkash', label: 'bKash', sub: 'Coming soon', available: false },
                  { id: 'nagad', label: 'Nagad', sub: 'Coming soon', available: false },
                  { id: 'card', label: 'Card', sub: 'Coming soon', available: false },
                ].map((pm) => (
                  <div
                    key={pm.id}
                    onClick={() => {
                      if (pm.available) setPaymentMethod(pm.id as any);
                    }}
                    className={`rounded-xl p-3 text-center transition-all ${
                      pm.available && paymentMethod === pm.id
                        ? 'border-2 border-[#1c5335] bg-[#fbfdfb] shadow-2xs cursor-pointer'
                        : 'border border-[#e8e4d9] bg-white opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <span className="font-extrabold text-xs text-slate-800 block">{pm.label}</span>
                    <span className="text-[10px] text-slate-400 block font-normal mt-0.5">{pm.sub}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Order Items Summary Card (lg:col-span-4) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#e8e4d9] p-5 sm:p-6 shadow-xs space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-dashed border-[#e2decb] pb-3">
              <h3 className="font-extrabold text-[#1c5335] text-sm sm:text-base">
                Order items
              </h3>
              <span className="text-xs text-slate-400 font-semibold">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Items List */}
            <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
              {items.map((item: any) => {
                const prod = item.product || item;
                const quantity = item.quantity || 1;
                const title = prod.title || prod.name || item.title || item.name || 'Product';
                const price = prod.price ?? item.price ?? 0;
                const imgSrc = getValidProductImage(item);

                return (
                  <div key={prod.id || item.id || Math.random()} className="flex items-center gap-3 text-xs">
                    <div className="relative w-11 h-11 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center">
                      <img
                        src={imgSrc}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.onerror = null;
                          target.src = getSvgGroceryPlaceholder(title);
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-xs line-clamp-1">{title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {quantity} × {formatCurrency(price)}
                      </p>
                    </div>
                    <div className="font-black text-slate-800 text-xs ml-auto">
                      {formatCurrency(price * quantity)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Promo Code Box ── */}
            <div className="pt-1 border-t border-dashed border-[#e2decb]">
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#eaf4ed] border border-emerald-300">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-[#1c5335]">{appliedCoupon.code}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#1c5335] text-white font-bold">
                        {appliedCoupon.discountType === 'PERCENTAGE'
                          ? `${appliedCoupon.discountValue}% OFF`
                          : `৳${appliedCoupon.discountValue} OFF`}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="p-1 rounded-lg hover:bg-emerald-200 text-[#1c5335]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="p-1 rounded-xl border border-dashed border-[#d8d3c2] bg-[#fbf9f4] flex items-center gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      setCouponError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCoupon())}
                    placeholder="Enter promo or coupon code"
                    className="bg-transparent text-xs text-slate-800 placeholder:text-slate-400 font-medium focus:outline-none flex-1 px-2.5 py-1.5 uppercase"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="bg-[#eaf4ed] hover:bg-[#d5ebd9] text-[#1c5335] font-extrabold text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {couponError}
                </p>
              )}
            </div>

            {/* ── Price Summary & Total ── */}
            <div className="border-t border-dashed border-[#e2decb] pt-3 space-y-2 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery charge</span>
                <span className="font-bold text-slate-800">
                  {deliveryFee === 0 ? <span className="text-emerald-700">FREE</span> : formatCurrency(deliveryFee)}
                </span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount</span>
                  <span>- {formatCurrency(couponDiscount)}</span>
                </div>
              )}
              
              <div className="border-t border-slate-200 pt-2 flex items-baseline justify-between">
                <span className="font-extrabold text-sm sm:text-base text-slate-900">Total payable</span>
                <span className="font-black text-xl sm:text-2xl text-[#1c5335]">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {orderError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{orderError}</span>
              </div>
            )}

            {/* Place Order CTA Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-[#1c5335] hover:bg-[#143e27] text-white font-black text-sm sm:text-base shadow-lg shadow-[#1c5335]/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <span>Place order - {formatCurrency(total)}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </span>
              )}
            </button>

            {/* Security Footer */}
            <div className="text-[10px] text-slate-400 text-center font-medium flex items-center justify-center gap-1 pt-1">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Secure checkout · verified by DOHS Sheba</span>
            </div>

          </div>

        </form>
      </div>
    </div>
  );
}
