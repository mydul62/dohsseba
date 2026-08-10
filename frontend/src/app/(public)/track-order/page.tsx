'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  PhoneCall,
  Package,
  Copy,
  Check,
  Printer,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  User,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  Sparkles,
  Navigation,
  Bike
} from 'lucide-react';
import { fetchApi } from '@/lib/api-client';
import { formatCurrency } from '@/utils/cn';
import { getSocket } from '@/lib/socket';
import { PrintableReceipt } from '@/components/common/PrintableReceipt';

interface TrackingOrder {
  id: string;
  trackingCode?: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  notes?: string;
  isGuest?: boolean;
  guestName?: string;
  guestPhone?: string;
  guestAddress?: string;
  customerPhone?: string;
  customer?: { name: string; phone?: string; email?: string };
  address?: { line1: string; area: string; city: string };
  items: {
    id: string;
    quantity: number;
    price: number;
    product?: { name: string; images?: string[]; unit?: string };
  }[];
  payment?: { method: string; status: string };
  rider?: { id: string; name: string; phone?: string; avatar?: string };
  createdAt: string;
  updatedAt: string;
}

const TIMELINE_STEPS = [
  { key: 'ACCEPTED', label: 'Accepted', desc: 'Order accepted & packing items', icon: Package },
  { key: 'PICKED_UP', label: 'Picked Up', desc: 'Rider picked up order from store', icon: Truck },
  { key: 'ON_THE_WAY', label: 'On the way', desc: 'Rider is on the way to your delivery doorstep', icon: Navigation },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Order successfully delivered to customer', icon: CheckCircle2 },
];

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get('code') || searchParams.get('query') || '';

  const [searchQuery, setSearchQuery] = useState(codeParam);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchTrackingDetails = async (queryStr: string) => {
    if (!queryStr.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchApi<any>(`/orders/track/${encodeURIComponent(queryStr.trim())}`);
      if (res && res.success && res.data) {
        setOrder(res.data);
      } else {
        setOrder(null);
        setError(res?.message || `No active order found matching "${queryStr}".`);
      }
    } catch (err: any) {
      setOrder(null);
      setError(err?.message || `No order found for "${queryStr}".`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codeParam) {
      setSearchQuery(codeParam);
      fetchTrackingDetails(codeParam);
    }
  }, [codeParam]);

  // ── Real-Time Socket.IO Updates ──
  useEffect(() => {
    if (!order?.id) return;

    const socketInstance = getSocket();

    // Join order tracking socket room
    socketInstance.emit('joinOrderRoom', order.id);

    const handleStatusUpdate = (data: any) => {
      if (data && (data.orderId === order.id || data.id === order.id)) {
        console.log('⚡ [REALTIME TRACKING] Socket order status updated:', data);
        if (data.order) {
          setOrder(data.order);
        } else if (data.status) {
          setOrder((prev) => (prev ? { ...prev, status: data.status } : prev));
        }
        // Re-fetch full details to update rider info if assigned
        fetchTrackingDetails(searchQuery);
      }
    };

    socketInstance.on('ORDER_STATUS_UPDATED', handleStatusUpdate);
    socketInstance.on('RIDER_ASSIGNED', handleStatusUpdate);

    return () => {
      socketInstance.off('ORDER_STATUS_UPDATED', handleStatusUpdate);
      socketInstance.off('RIDER_ASSIGNED', handleStatusUpdate);
    };
  }, [order?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchTrackingDetails(searchQuery.trim());
    }
  };

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'SELLER_ACCEPTED':
      case 'READY_FOR_RIDER':
      case 'WAITING_FOR_MANUAL_ASSIGNMENT':
      case 'RIDER_ASSIGNED':
      case 'ARRIVED_AT_STORE':
      case 'ACCEPTED':
        return 0;
      case 'PICKUP_STARTED':
      case 'PICKED_UP':
        return 1;
      case 'ON_THE_WAY':
      case 'ARRIVED':
      case 'ARRIVED_DESTINATION':
      case 'DELIVERING':
        return 2;
      case 'DELIVERED':
      case 'COMPLETED':
        return 3;
      case 'CANCELLED':
      case 'REJECTED':
        return -1;
      default:
        return 0;
    }
  };

  const currentStep = order ? getStepIndex(order.status) : 0;
  const isCancelled = order?.status === 'CANCELLED' || order?.status === 'REJECTED';

  const customerName = order?.guestName || order?.customer?.name || 'Valued Resident';
  const customerPhone = order?.guestPhone || order?.customerPhone || order?.customer?.phone || 'N/A';
  const deliveryAddress = order?.guestAddress || (order?.address ? `${order.address.line1}, ${order.address.area}` : 'DOHS Mohakhali');
  const displayTrackingCode = order?.trackingCode || order?.id || '';

  return (
    <div className="min-h-screen bg-[#0f101d] text-white py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Back & Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Link
            href="/services/shopping"
            className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-indigo-400" /> Live Courier Express Tracking
          </div>
        </div>

        {/* Hero Title & Large Search Box */}
        <div className="text-center space-y-4 max-w-2xl mx-auto pt-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <Truck className="w-8 h-8 text-[#7eb343]" /> Track Your DOHS Parcel
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Enter your <strong className="text-white">Tracking Code</strong> (e.g. TRK-84920183) or Phone Number to view real-time delivery status & rider location.
          </p>

          <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Tracking Code (TRK-...) or Phone Number"
                className="w-full pl-12 pr-28 py-3.5 sm:py-4 rounded-2xl bg-[#1a1b2e] border-2 border-indigo-500/40 text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-2xl transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 px-5 py-2.5 sm:py-3 rounded-xl bg-[#7eb343] hover:bg-[#6c9c36] text-white text-xs font-black transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Track Order'}
              </button>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-12 rounded-3xl bg-[#1a1b2e] border border-white/10 text-center space-y-3 animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-[#7eb343]" />
            <p className="text-sm font-bold text-white">Fetching Live Order Tracking Details…</p>
            <p className="text-xs text-slate-400">Connecting to DOHS Express Courier Dispatch</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-8 rounded-3xl bg-rose-950/40 border border-rose-500/30 text-center space-y-3 shadow-xl">
            <AlertTriangle className="w-10 h-10 mx-auto text-rose-400" />
            <h3 className="font-extrabold text-white text-base">Tracking Search Error</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">{error}</p>
          </div>
        )}

        {/* Active Order Found View */}
        {order && !loading && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Badge Bar */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-[#171828] via-[#1c1e34] to-[#222440] border border-white/10 shadow-2xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tracking Code:</span>
                    <span className="font-mono font-black text-amber-400 text-base">{displayTrackingCode}</span>
                    <button
                      onClick={() => handleCopyCode(displayTrackingCode)}
                      className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition-colors inline-flex items-center gap-1"
                      title="Copy Tracking Code"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Placed on {new Date(order.createdAt).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>

                <div className="flex items-center gap-3">
                  {order.isGuest && (
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-xs">
                      👤 Guest Order
                    </span>
                  )}

                  <span className={`px-4 py-1.5 rounded-full text-xs font-black border uppercase tracking-wider ${
                    isCancelled
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : order.status === 'DELIVERED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-[#7eb343]/20 text-[#7eb343] border-[#7eb343]/40 animate-pulse'
                  }`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Delivery ETA & Rider Banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#7eb343]/20 border border-[#7eb343]/30 flex items-center justify-center text-[#7eb343] shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Delivery</span>
                    <h4 className="font-extrabold text-white text-sm">
                      {order.status === 'DELIVERED'
                        ? 'Order Delivered Successfully'
                        : isCancelled
                        ? 'Order Cancelled'
                        : '25–45 Mins Express Delivery'}
                    </h4>
                  </div>
                </div>

                {/* Rider Assignment Status */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                    <Bike className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Rider</span>
                    <h4 className="font-extrabold text-white text-sm truncate">
                      {(order.rider?.name || (order as any).riderName) ? (
                        <div className="flex flex-col">
                          <span className="text-emerald-400 font-extrabold text-sm">
                            {order.rider?.name || (order as any).riderName}
                          </span>
                          <a
                            href={`tel:${order.rider?.phone || (order as any).riderPhone || '01306031982'}`}
                            className="text-xs text-indigo-300 hover:text-emerald-300 font-mono font-bold flex items-center gap-1 mt-0.5"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{order.rider?.phone || (order as any).riderPhone || '01306031982'}</span>
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">Waiting for rider pickup acceptance...</span>
                      )}
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Courier Delivery Progress Timeline */}
            {!isCancelled && (
              <div className="p-6 rounded-3xl bg-[#171828] border border-white/10 shadow-2xl space-y-6">
                <h3 className="font-black text-white text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#7eb343]" /> Delivery Progress Timeline
                </h3>

                <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-1 before:bg-white/10">
                  {TIMELINE_STEPS.map((step, idx) => {
                    const isCompleted = currentStep > idx;
                    const isCurrent   = currentStep === idx;
                    const Icon        = step.icon;

                    return (
                      <div key={step.key} className="relative flex items-start gap-4 group">
                        {/* Icon Node */}
                        <div className={`absolute -left-6 sm:-left-8 top-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-[#7eb343] border-[#7eb343] text-white shadow-lg shadow-[#7eb343]/30'
                            : isCurrent
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/40 animate-bounce'
                            : 'bg-[#121320] border-white/20 text-slate-600'
                        }`}>
                          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                        </div>

                        {/* Step Details */}
                        <div className="min-w-0">
                          <h4 className={`font-bold text-sm ${
                            isCompleted || isCurrent ? 'text-white' : 'text-slate-500'
                          }`}>
                            {step.label}
                            {isCurrent && (
                              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                                Current Status
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order Items & Customer Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Items Card */}
              <div className="p-6 rounded-3xl bg-[#171828] border border-white/10 space-y-4 shadow-xl">
                <h3 className="font-black text-white text-sm flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-400" /> Order Summary ({order.items?.length || 0} items)
                </h3>

                <div className="divide-y divide-white/5 max-h-64 overflow-y-auto pr-1 space-y-2">
                  {order.items?.map((item) => {
                    const prodName = item.product?.name || 'Product Item';
                    const img = (Array.isArray(item.product?.images) && item.product?.images[0]) || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100';
                    return (
                      <div key={item.id} className="pt-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={img} alt={prodName} className="w-10 h-10 rounded-xl object-cover bg-slate-900 border border-white/10 shrink-0" />
                          <div className="min-w-0">
                            <h5 className="font-bold text-white text-xs truncate">{prodName}</h5>
                            <span className="text-[11px] text-slate-400">Qty: {item.quantity} × ৳{item.price}</span>
                          </div>
                        </div>
                        <span className="font-bold text-white text-xs">৳{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-bold text-white">৳{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Delivery Fee</span>
                    <span className="font-bold text-emerald-400">{order.deliveryFee === 0 ? 'FREE' : `৳${formatCurrency(order.deliveryFee)}`}</span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between font-black text-sm text-white">
                    <span>Total Amount</span>
                    <span className="text-[#7eb343]">৳{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Details Card */}
              <div className="p-6 rounded-3xl bg-[#171828] border border-white/10 space-y-4 shadow-xl flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="font-black text-white text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-400" /> Recipient Details
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Customer Name</span>
                      <span className="font-bold text-white text-sm">{customerName}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Contact Phone</span>
                      <span className="font-mono text-emerald-400 font-bold">{customerPhone}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Delivery Address</span>
                      <span className="text-slate-300 leading-relaxed font-medium">{deliveryAddress}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Payment Method</span>
                      <span className="font-bold text-white uppercase">{order.payment?.method || 'CASH ON DELIVERY'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> Download / Print Receipt
                  </button>
                </div>
              </div>
            </div>

            {/* Dedicated Clean Printable Receipt (Only visible during print) */}
            <PrintableReceipt order={order} />

          </div>
        )}
      </div>
    </div>
  );
}

export default function PublicOrderTrackingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f101d] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#7eb343] animate-spin" /></div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
