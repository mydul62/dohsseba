'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Truck,
  Sparkles,
  Lock
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useSiteSettingsStore } from '@/store/useSiteSettingsStore';
import { useDeliveryRulesStore } from '@/store/useDeliveryRulesStore';
import { fetchApi } from '@/lib/api-client';
import { formatCurrency } from '@/utils/cn';

export default function GuestCheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { fetchRules, calculateFee } = useDeliveryRulesStore();

  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    guestAddress: '',
    notes: '',
    paymentMethod: 'CASH',
  });

  useEffect(() => {
    setMounted(true);
    fetchRules();
  }, [fetchRules]);

  const subtotal = getSubtotal();
  const { deliveryFee } = calculateFee(subtotal);
  const total = subtotal + deliveryFee;

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f101d] text-white py-16 px-4 flex items-center justify-center font-sans">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-3xl bg-[#171828] border border-white/10 shadow-2xl">
          <ShoppingBag className="w-12 h-12 mx-auto text-slate-500 opacity-40" />
          <h2 className="text-xl font-black text-white">Your Cart is Empty</h2>
          <p className="text-xs text-slate-400">Please add items from the bazaar store to complete guest checkout.</p>
          <Link
            href="/services/shopping"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#7eb343] hover:bg-[#6c9c36] text-white font-bold text-xs transition-all shadow-md active:scale-95"
          >
            <span>Browse Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const nameTrimmed = form.guestName.trim();
    const addressTrimmed = form.guestAddress.trim();
    const cleanPhone = form.guestPhone.replace(/[\s\-\+\(\)]/g, '').replace(/^88/, '');
    const bdPhoneRegex = /^01[3-9]\d{8}$/;

    if (!nameTrimmed) {
      setError('আপনার নাম দেওয়া আবশ্যক। (Please enter your full name.)');
      return;
    }
    if (!addressTrimmed) {
      setError('আপনার ডেলিভারি ঠিকানা দেওয়া আবশ্যক। (Please enter your house & sector address.)');
      return;
    }
    if (!cleanPhone || !bdPhoneRegex.test(cleanPhone)) {
      setError('১১ ডিজিটের সঠিক মোবাইল নম্বর প্রদান করুন (যেমন: 01712345678)।');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        guestName: nameTrimmed,
        guestPhone: cleanPhone,
        guestEmail: form.guestEmail.trim() || undefined,
        guestAddress: addressTrimmed,
        items: items.map((i: any) => ({
          productId: i.product?.id || i.id,
          quantity: i.quantity || 1,
        })),
        notes: form.notes.trim() || undefined,
        paymentMethod: form.paymentMethod,
      };

      const res = await fetchApi<any>('/orders/guest', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res && res.success && res.data) {
        clearCart();
        const orderId = res.data.id;
        const trackingCode = res.data.trackingCode || '';
        router.push(`/services/shopping/checkout/success?orderId=${orderId}&trackingCode=${trackingCode}&guest=true`);
      } else {
        throw new Error(res?.message || 'Failed to place guest order');
      }
    } catch (err: any) {
      setError(err?.message || 'Error placing order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f101d] text-white py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Link
            href="/services/shopping"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Shop
          </Link>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <Lock className="w-3.5 h-3.5 text-emerald-400" /> Instant Express Guest Checkout (No Account Needed)
          </div>
        </div>

        {/* Page Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <User className="w-7 h-7 text-[#7eb343]" /> Guest Express Checkout
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Complete your order in 30 seconds. We will issue a live courier tracking code instantly.
          </p>
        </div>

        {/* Main Grid: Form + Summary */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left 7 Columns: Recipient & Address Form */}
          <div className="lg:col-span-7 space-y-6">
            
            {error && (
              <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-bold leading-relaxed">
                ⚠️ {error}
              </div>
            )}

            {/* Recipient Contact Card */}
            <div className="p-6 rounded-3xl bg-[#171828] border border-white/10 space-y-4 shadow-2xl">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2 border-b border-white/10 pb-3">
                <User className="w-4 h-4 text-indigo-400" /> 1. Contact Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="text"
                      value={form.guestName}
                      onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                      placeholder="e.g. Sharmin Sultana"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#121320] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Phone Number (For Rider Contact) *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        required
                        type="tel"
                        value={form.guestPhone}
                        onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
                        placeholder="01700000000"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#121320] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={form.guestEmail}
                        onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
                        placeholder="resident@dohs.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#121320] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="p-6 rounded-3xl bg-[#171828] border border-white/10 space-y-4 shadow-2xl">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2 border-b border-white/10 pb-3">
                <MapPin className="w-4 h-4 text-amber-400" /> 2. Delivery Address in DOHS
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    House / Flat / Road / Block Address *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={form.guestAddress}
                    onChange={(e) => setForm({ ...form, guestAddress: e.target.value })}
                    placeholder="e.g. House 42, Road 5, Block C, Savar DOHS"
                    className="w-full p-3.5 rounded-xl bg-[#121320] border border-white/10 text-white text-xs leading-relaxed focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Delivery Notes / Gate Instructions
                  </label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="e.g. Call before coming or leave at security desk"
                    className="w-full px-4 py-3 rounded-xl bg-[#121320] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="p-6 rounded-3xl bg-[#171828] border border-white/10 space-y-4 shadow-2xl">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2 border-b border-white/10 pb-3">
                <CreditCard className="w-4 h-4 text-[#7eb343]" /> 3. Payment Method
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`p-4 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                  form.paymentMethod === 'CASH'
                    ? 'bg-[#7eb343]/15 border-[#7eb343] text-white shadow-md'
                    : 'bg-[#121320] border-white/10 text-slate-400 hover:border-slate-600'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH"
                    checked={form.paymentMethod === 'CASH'}
                    onChange={() => setForm({ ...form, paymentMethod: 'CASH' })}
                    className="hidden"
                  />
                  <div className="w-5 h-5 rounded-full border-2 border-[#7eb343] flex items-center justify-center shrink-0">
                    {form.paymentMethod === 'CASH' && <div className="w-2.5 h-2.5 rounded-full bg-[#7eb343]" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-white block">Cash on Delivery</span>
                    <span className="text-[10px] text-slate-400">Pay cash upon receiving parcel</span>
                  </div>
                </label>

                <label className={`p-4 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                  form.paymentMethod === 'BKASH'
                    ? 'bg-[#7eb343]/15 border-[#7eb343] text-white shadow-md'
                    : 'bg-[#121320] border-white/10 text-slate-400 hover:border-slate-600'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="BKASH"
                    checked={form.paymentMethod === 'BKASH'}
                    onChange={() => setForm({ ...form, paymentMethod: 'BKASH' })}
                    className="hidden"
                  />
                  <div className="w-5 h-5 rounded-full border-2 border-[#7eb343] flex items-center justify-center shrink-0">
                    {form.paymentMethod === 'BKASH' && <div className="w-2.5 h-2.5 rounded-full bg-[#7eb343]" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-white block">bKash / Online Payment</span>
                    <span className="text-[10px] text-slate-400">bKash Merchant Direct Transfer</span>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-[#7eb343] hover:bg-[#6c9c36] text-white font-black text-sm transition-all shadow-xl shadow-[#7eb343]/20 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Placing Express Guest Order…</span>
                </>
              ) : (
                <>
                  <span>Place Guest Order Now (৳{formatCurrency(total)})</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

          </div>

          {/* Right 5 Columns: Cart Items Order Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-[#171828] border border-white/10 space-y-4 shadow-2xl sticky top-8">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2 border-b border-white/10 pb-3">
                <ShoppingBag className="w-4 h-4 text-[#7eb343]" /> Order Summary ({items.length} items)
              </h3>

              <div className="divide-y divide-white/5 max-h-80 overflow-y-auto pr-1 space-y-3">
                {items.map((item: any) => {
                  const prod = item.product || item;
                  const id = prod.id || item.id;
                  const title = prod.title || prod.name || item.name;
                  const price = prod.price ?? item.price ?? 0;
                  const image = (Array.isArray(prod.images) && prod.images[0]) || prod.image || item.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200';
                  const quantity = item.quantity || 1;

                  return (
                    <div key={id} className="pt-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={image} alt={title} className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-white/10 shrink-0" />
                        <div className="min-w-0">
                          <h5 className="font-bold text-white text-xs truncate">{title}</h5>
                          <span className="text-[11px] text-slate-400">Qty: {quantity} × ৳{formatCurrency(price)}</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-white text-xs">৳{formatCurrency(price * quantity)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-white/10 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-bold text-white">৳{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Charge (DOHS Area)</span>
                  <span className="font-bold text-emerald-400">
                    {deliveryFee === 0 ? 'FREE' : `৳${formatCurrency(deliveryFee)}`}
                  </span>
                </div>
                <div className="pt-3 border-t border-white/10 flex justify-between font-black text-base text-white">
                  <span>Total Amount</span>
                  <span className="text-[#7eb343]">৳{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-[11px] space-y-1">
                <div className="font-extrabold text-white flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-indigo-400" /> DOHS Express Rider Delivery
                </div>
                <p className="text-slate-300">Live courier tracking code will be generated immediately after order confirmation.</p>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
