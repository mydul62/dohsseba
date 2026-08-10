'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api-client';
import { formatCurrency } from '@/utils/cn';
import { StatusBadge } from '@/components/dashboard/seller/OrdersContent';
import { useSocket } from '@/hooks/useSocket';

const FALLBACK_ORDERS = [
  {
    id: 'ord-1',
    status: 'PENDING',
    createdAt: '2026-07-28T10:15:00Z',
    subtotal: 620,
    shipping: 40,
    discount: 0,
    total: 660,
    customer: { name: 'Sharmin Sultana', email: 'sharmin@email.com', phone: '01711-234567' },
    address: { line1: 'House 14, Road 3', city: 'DOHS Mirpur, Dhaka', zip: '1216', phone: '01711-234567' },
    payment: { method: 'bKash', status: 'PAID', transId: 'TRX-994201' },
    items: [
      { id: 'item-1', product: { name: 'Organic Whole Milk (2L)', unit: 'liter', images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=300'] }, quantity: 2, price: 160 },
      { id: 'item-2', product: { name: 'Fresh Deshi Tomato', unit: 'kg', images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=300'] }, quantity: 3, price: 100 },
    ],
  },
];
import {
  ArrowLeft, Printer, Download, CheckCircle2, Package,
  Truck, Clock, RefreshCw, Check, User, MapPin, CreditCard,
  PhoneCall, Mail, Loader2, AlertTriangle, XCircle, RotateCcw,
  ShoppingBag, ChevronRight, Info, AlertCircle,
} from 'lucide-react';

// ─── Status Flow ──────────────────────────────────────────────────────────────

const STATUS_FLOW = ['ACCEPTED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED'] as const;

const FLOW_META: Record<string, { label: string; desc: string; icon: React.ReactNode; color: string }> = {
  ACCEPTED:   { label: 'Accepted',   desc: 'Order accepted & packing items', icon: <Package className="w-5 h-5" />, color: 'text-blue-400 border-blue-500 bg-blue-500' },
  PICKED_UP:  { label: 'Picked Up',  desc: 'Rider picked up order from store', icon: <Truck className="w-5 h-5" />, color: 'text-purple-400 border-purple-500 bg-purple-500' },
  ON_THE_WAY: { label: 'On the way', desc: 'Out for doorstep delivery', icon: <Truck className="w-5 h-5" />, color: 'text-cyan-400 border-cyan-500 bg-cyan-500' },
  DELIVERED:  { label: 'Delivered',  desc: 'Successfully delivered', icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-400 border-emerald-500 bg-emerald-500' },
};

const NEXT_STATUS: Record<string, string | null> = {
  PENDING:          'ACCEPTED',
  SELLER_ACCEPTED:  'PICKED_UP',
  ACCEPTED:         'PICKED_UP',
  PICKED_UP:        'ON_THE_WAY',
  ON_THE_WAY:       'DELIVERED',
  DELIVERED:        null,
  CANCELLED:        null,
  RETURNED:         null,
};

const getStatusIndex = (status: string): number => {
  switch (status) {
    case 'PENDING':
    case 'SELLER_ACCEPTED':
    case 'READY_FOR_RIDER':
    case 'RIDER_ASSIGNED':
    case 'ARRIVED_AT_STORE':
    case 'ACCEPTED':
    case 'PROCESSING':
    case 'PACKED':
      return 0;
    case 'PICKUP_STARTED':
    case 'PICKED_UP':
      return 1;
    case 'ON_THE_WAY':
    case 'ARRIVED':
    case 'ARRIVED_DESTINATION':
    case 'DELIVERING':
    case 'SHIPPED':
      return 2;
    case 'DELIVERED':
    case 'COMPLETED':
      return 3;
    default:
      return 0;
  }
};

// ─── Timeline ─────────────────────────────────────────────────────────────────

function OrderTimeline({ status }: { status: string }) {
  const currentIdx = getStatusIndex(status);
  const isCancelled = status === 'CANCELLED';
  const isReturned  = status === 'RETURNED';

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-start min-w-max px-2 py-4">
        {STATUS_FLOW.map((step, i) => {
          const isCompleted = !isCancelled && !isReturned && i < currentIdx;
          const isCurrent   = !isCancelled && !isReturned && i === currentIdx;
          const isFuture    = isCancelled || isReturned || i > currentIdx;
          const meta        = FLOW_META[step];

          return (
            <React.Fragment key={step}>
              {/* Connector */}
              {i > 0 && (
                <div className={`flex-1 h-0.5 mt-5 min-w-[48px] transition-colors duration-500 ${isCompleted || (isCurrent && i <= currentIdx) ? 'bg-indigo-500' : 'bg-white/10'}`} />
              )}
              {/* Step */}
              <div className="flex flex-col items-center gap-2 w-28">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 relative ${
                  isCompleted ? `border-indigo-500 bg-indigo-600 text-white` :
                  isCurrent   ? `border-indigo-400 bg-indigo-600/30 text-indigo-300` :
                  'border-white/15 bg-[#181928] text-slate-600'
                }`}>
                  {isCompleted ? <Check className="w-5 h-5" /> : React.cloneElement(meta.icon as any, { className: `w-4 h-4` })}
                  {isCurrent && <span className="absolute inset-0 rounded-full animate-ping bg-indigo-500/30" />}
                </div>
                <div className="text-center">
                  <p className={`text-[11px] font-bold ${isCurrent ? 'text-indigo-300' : isCompleted ? 'text-slate-200' : 'text-slate-600'}`}>{meta.label}</p>
                  <p className={`text-[9px] mt-0.5 ${isCurrent ? 'text-indigo-400/70' : 'text-slate-600'}`}>{meta.desc}</p>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* Cancelled / Returned as a terminal branch */}
        {(isCancelled || isReturned) && (
          <>
            <div className="flex-1 h-0.5 mt-5 min-w-[48px] bg-red-500/30" />
            <div className="flex flex-col items-center gap-2 w-28">
              <div className="w-10 h-10 rounded-full border-2 border-red-500 bg-red-600/20 text-red-400 flex items-center justify-center">
                {isCancelled ? <XCircle className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
              </div>
              <div className="text-center">
                <p className="text-[11px] font-bold text-red-300">{isCancelled ? 'Cancelled' : 'Returned'}</p>
                <p className="text-[9px] mt-0.5 text-red-400/70">{isCancelled ? 'Order was cancelled' : 'Item was returned'}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Print Invoice Section ────────────────────────────────────────────────────

function InvoiceSection({ order }: { order: any }) {
  return (
    <div id="invoice-print" className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Fresh Bazaar</h2>
          <p className="text-xs text-slate-400">DOHS Seller Commerce</p>
          <p className="text-xs text-slate-400">support@freshbazaar.com</p>
        </div>
        <div className="text-right">
          <p className="font-black text-white">INVOICE</p>
          <p className="text-xs text-slate-400">#{order.id.toUpperCase()}</p>
          <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString('en-BD', { day:'2-digit', month:'long', year:'numeric' })}</p>
        </div>
      </div>

      {/* Bill To */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="font-bold text-slate-400 mb-1">Bill To</p>
          <p className="font-bold text-white">{order.customer?.name}</p>
          <p className="text-slate-400">{order.customer?.email}</p>
          <p className="text-slate-400">{order.customer?.phone}</p>
        </div>
        <div>
          <p className="font-bold text-slate-400 mb-1">Deliver To</p>
          <p className="text-slate-300">{order.address?.line1}</p>
          {order.address?.area && <p className="text-slate-300">{order.address.area}</p>}
          <p className="text-slate-300">{order.address?.city}</p>
          <p className="text-slate-400">PIN: {order.address?.zip || '1216'}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-xs border border-white/10 rounded-xl overflow-hidden">
        <thead className="bg-white/5">
          <tr className="text-slate-400 font-bold uppercase text-[10px]">
            <th className="p-3 text-left">Product</th>
            <th className="p-3 text-center">Qty</th>
            <th className="p-3 text-right">Unit Price</th>
            <th className="p-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {order.items?.map((item: any) => (
            <tr key={item.id}>
              <td className="p-3 text-white">{item.product?.name}</td>
              <td className="p-3 text-center text-slate-300">{item.quantity}</td>
              <td className="p-3 text-right text-slate-300">{formatCurrency(item.price)}</td>
              <td className="p-3 text-right font-bold text-white">{formatCurrency(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-white/10 text-xs">
          <tr><td colSpan={3} className="p-3 text-right text-slate-400">Subtotal</td><td className="p-3 text-right text-white">{formatCurrency(order.subtotal ?? order.total)}</td></tr>
          {order.shipping > 0 && <tr><td colSpan={3} className="p-3 text-right text-slate-400">Shipping</td><td className="p-3 text-right text-white">{formatCurrency(order.shipping)}</td></tr>}
          {order.discount > 0 && <tr><td colSpan={3} className="p-3 text-right text-emerald-400">Discount</td><td className="p-3 text-right text-emerald-400">-{formatCurrency(order.discount)}</td></tr>}
          <tr className="font-black"><td colSpan={3} className="p-3 text-right text-white">TOTAL</td><td className="p-3 text-right text-indigo-400 text-base">{formatCurrency(order.total)}</td></tr>
        </tfoot>
      </table>

      <p className="text-center text-xs text-slate-500 border-t border-white/10 pt-3">Thank you for shopping with Fresh Bazaar · DOHS Commerce Platform</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

import { useOrderStore } from '@/store/useOrderStore';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id     = params?.id as string;
  const { orders: storeOrders, updateOrderStatus } = useOrderStore();
  const { socket } = useSocket();

  const [order,    setOrder]    = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  // Real-time socket sync for rider status updates
  useEffect(() => {
    if (!id) return;

    if (socket) {
      socket.emit('join_order', id);
      const handleStatusUpdate = (data: any) => {
        console.log('⚡ [SELLER ORDER DETAIL] Received ORDER_STATUS_UPDATED:', data);
        setOrder((prev: any) => (prev ? { ...prev, status: data.status || prev.status } : prev));
      };
      socket.on('ORDER_STATUS_UPDATED', handleStatusUpdate);
      return () => {
        socket.off('ORDER_STATUS_UPDATED', handleStatusUpdate);
      };
    }
  }, [socket, id]);

  // Periodic status poll (3s) while viewing order details page to guarantee real-time sync
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetchApi<any>(`/orders/${id}`).catch(() => null);
        if (res?.success && res.data?.status) {
          setOrder((prev: any) => (prev && prev.status !== res.data.status ? { ...prev, status: res.data.status } : prev));
        }
      } catch (_) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const storeMatch = storeOrders.find(
      (o) => o.id.toUpperCase() === id.toUpperCase()
    );

    if (storeMatch) {
      const sm = storeMatch as any;
      const parsedDate = (() => {
        try {
          const d = new Date(storeMatch.date);
          return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
        } catch { return new Date().toISOString(); }
      })();

      setOrder({
        id: storeMatch.id,
        status: storeMatch.status,
        createdAt: parsedDate,
        subtotal: storeMatch.total,
        shipping: 0,
        discount: 0,
        total: storeMatch.total,
        customer: {
          name:  sm.customerName  || 'Customer',
          email: sm.customerEmail || '—',
          phone: sm.customerPhone || storeMatch.deliveryAddress || '—',
        },
        address: {
          line1: storeMatch.deliveryAddress || 'DOHS, Dhaka',
          city:  'Dhaka',
          zip:   '1206',
          phone: sm.customerPhone || '—',
        },
        payment: {
          method:  storeMatch.paymentMethod || 'N/A',
          status:  'PAID',
          transId: `TRX-${storeMatch.id.slice(-6).toUpperCase()}`,
        },
        items: storeMatch.items.map((item: any, idx: number) => ({
          id: `item-${idx}`,
          product: { name: item.name, unit: 'pcs', images: [item.image || ''] },
          quantity: item.qty,
          price: item.price,
        })),
        estDelivery: sm.estDelivery || '—',
        seller: sm.seller || 'DOHS Market',
      });
      setLoading(false);
      return;
    }

    // Fallback API / Mock check
    fetchApi<any>(`/orders/${id}`)
      .then((r) => { if (r.success && r.data) setOrder(r.data); else throw new Error(); })
      .catch(() => {
        const mock = FALLBACK_ORDERS.find((o) => o.id === id) || FALLBACK_ORDERS[0];
        if (mock) setOrder(mock);
      })
      .finally(() => setLoading(false));
  }, [id, storeOrders]);

  const handleStatusUpdate = async () => {
    if (!order) return;
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdating(true);

    try {
      await fetchApi(`/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      }).catch(() => {});
    } catch {
      // ignore
    } finally {
      updateOrderStatus(order.id, next as any);
      setOrder((prev: any) => ({ ...prev, status: next }));
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    setShowInvoice(true);
    setTimeout(() => window.print(), 300);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;
  if (!order)  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertTriangle className="w-10 h-10 text-red-400" />
      <p className="text-white font-bold">Order not found</p>
      <Link href="/seller/dashboard/orders" className="text-indigo-400 text-sm hover:underline">← Back to Orders</Link>
    </div>
  );

  const nextStatus = NEXT_STATUS[order.status];
  const canUpdateStatus = !!nextStatus;

  return (
    <>
      {/* Print Styles */}
      <style>{`@media print { body * { visibility: hidden; } #invoice-print, #invoice-print * { visibility: visible; } #invoice-print { position: fixed; top: 0; left: 0; width: 100%; } }`}</style>

      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/seller/dashboard/orders')} className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-black text-white text-lg">Order #{order.id.toUpperCase()}</h1>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-BD', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/5 transition-all">
              <Printer className="w-3.5 h-3.5" /> Print Invoice
            </button>
            {canUpdateStatus && (
              <button onClick={handleStatusUpdate} disabled={updating} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all disabled:opacity-60 shadow-lg">
                {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                {updating ? 'Updating…' : `Mark as ${FLOW_META[nextStatus!]?.label}`}
              </button>
            )}
          </div>
        </div>

        {/* ── Order Timeline ── */}
        <div className="p-6 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl">
          <h2 className="font-bold text-sm text-white mb-4">Order Status Timeline</h2>
          <OrderTimeline status={order.status} />

          {/* Status update notice */}
          {canUpdateStatus && (
            <div className="mt-4 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2 text-xs text-indigo-300">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Click <strong>Mark as {FLOW_META[nextStatus!]?.label}</strong> to advance this order to the next stage.
            </div>
          )}
          {!canUpdateStatus && order.status === 'DELIVERED' && (
            <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> This order was successfully delivered. No further action required.
            </div>
          )}
          {order.status === 'CANCELLED' && (
            <div className="mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1.5 text-xs text-rose-200">
              <div className="flex items-center gap-2 font-bold text-rose-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Rider Cancellation Reason / Note</span>
              </div>
              <p className="font-medium text-rose-200 leading-relaxed pl-6">
                {order.notes || order.cancellationReason || 'Order was cancelled by rider/customer. No extra reason provided.'}
              </p>
              {order.riderName && (
                <p className="text-[11px] text-slate-400 font-mono pl-6">
                  Assigned Rider: {order.riderName}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Two-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left — Items + Invoice */}
          <div className="lg:col-span-8 space-y-6">

            {/* Order Items */}
            <div className="p-6 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl space-y-4">
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-400" /> Order Items
              </h2>
              <div className="space-y-3">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[#181928]/60 border border-white/5">
                    <div className="w-12 h-12 rounded-xl bg-[#181928] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.product?.images?.[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{item.product?.name}</p>
                      <p className="text-xs text-slate-400">Unit: {item.product?.unit ?? 'piece'} · Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-white">{formatCurrency(item.price * item.quantity)}</p>
                      <p className="text-[10px] text-slate-400">{formatCurrency(item.price)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Invoice */}
            <div className="p-6 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm text-white">Invoice</h2>
                <button onClick={() => setShowInvoice((v) => !v)} className="text-xs text-indigo-400 hover:underline">
                  {showInvoice ? 'Hide' : 'Show'} Invoice
                </button>
              </div>
              {showInvoice && <InvoiceSection order={order} />}
              {!showInvoice && (
                <div className="p-6 text-center space-y-2 border border-dashed border-white/10 rounded-2xl">
                  <Printer className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-400">Click <strong className="text-white">Show Invoice</strong> or use <strong className="text-white">Print Invoice</strong> to generate a printable version.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right — Customer, Payment, Address */}
          <div className="lg:col-span-4 space-y-6">

            {/* Payment Summary */}
            <div className="p-5 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl space-y-3">
              <h2 className="font-bold text-sm text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-400" /> Payment Summary</h2>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Subtotal',  value: formatCurrency(order.subtotal ?? order.total), cls: 'text-slate-300' },
                  { label: 'Shipping',  value: formatCurrency(order.shipping ?? 0),            cls: 'text-slate-300' },
                  { label: 'Discount',  value: `-${formatCurrency(order.discount ?? 0)}`,      cls: 'text-emerald-400', hide: !order.discount },
                ].filter(i => !i.hide).map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-slate-400">{row.label}</span>
                    <span className={`font-bold ${row.cls}`}>{row.value}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="font-bold text-white">Total</span>
                  <span className="font-black text-indigo-400 text-base">{formatCurrency(order.total)}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Payment Method</span>
                  <span className="font-bold text-white">{order.payment?.method ?? 'bKash'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Payment Status</span>
                  <span className={`font-bold ${order.payment?.status === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>{order.payment?.status ?? 'PAID'}</span>
                </div>
                {order.payment?.transId && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Transaction ID</span>
                    <span className="font-mono text-indigo-300 text-[10px]">{order.payment.transId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="p-5 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl space-y-3">
              <h2 className="font-bold text-sm text-white flex items-center gap-2"><User className="w-4 h-4 text-indigo-400" /> Customer</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                  {order.customer?.name?.[0] ?? 'C'}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{order.customer?.name}</p>
                  <p className="text-[11px] text-slate-400">Regular Customer</p>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />{order.customer?.email || 'customer@dohssheba.com'}
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <a href={`tel:${order.customerPhone || order.customer?.phone || order.address?.phone || '01306031982'}`} className="hover:underline">
                    {order.customerPhone || order.customer?.phone || order.address?.phone || '01306031982'}
                  </a>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="p-5 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl space-y-3">
              <h2 className="font-bold text-sm text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-400" /> Delivery Address</h2>
              <div className="text-xs text-slate-300 space-y-0.5 leading-relaxed">
                <p className="font-bold text-white">{order.customer?.name}</p>
                <p>{order.address?.line1}</p>
                {order.address?.line2 && <p>{order.address.line2}</p>}
                {order.address?.area && <p>{order.address.area}</p>}
                <p>{order.address?.city}</p>
                <p className="text-slate-400">PIN: {order.address?.zip || '1216'}</p>
                <div className="text-emerald-400 font-bold flex items-center gap-1 mt-1">
                  <PhoneCall className="w-3 h-3 text-emerald-400" />
                  <a href={`tel:${order.customerPhone || order.address?.phone || order.customer?.phone || '01306031982'}`} className="hover:underline">
                    {order.customerPhone || order.address?.phone || order.customer?.phone || '01306031982'}
                  </a>
                </div>
              </div>
            </div>

            {/* Assigned Rider Card */}
            <div className="p-5 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-bold text-sm text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400" />
                  <span>Assigned Rider</span>
                </h2>
                {order.riderName || order.rider?.name ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Assigned to {order.riderName || order.rider?.name}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Awaiting Rider
                  </span>
                )}
              </div>

              {order.riderName || order.rider?.name ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-500 p-0.5 shrink-0 overflow-hidden shadow-md">
                      {order.rider?.avatar ? (
                        <img src={order.rider.avatar} alt="" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <div className="w-full h-full rounded-2xl bg-[#181928] flex items-center justify-center text-white font-black text-sm">
                          {(order.riderName || order.rider?.name)?.[0] || 'R'}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white text-sm truncate">{order.riderName || order.rider?.name}</p>
                      <p className="text-[11px] text-emerald-400 font-semibold">Active Dispatch Partner</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Rider Phone:</span>
                      <a
                        href={`tel:${order.rider?.phone || order.riderPhone || '01306031982'}`}
                        className="font-bold text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>{order.rider?.phone || order.riderPhone || '01306031982'}</span>
                      </a>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Assignment Time:</span>
                      <span className="text-slate-300 font-mono">
                        {order.acceptedAt || order.assignedAt
                          ? new Date(order.acceptedAt || order.assignedAt).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })
                          : 'Just now'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Delivery Status:</span>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#181928] border border-dashed border-white/10 text-center space-y-1 text-xs">
                  <Clock className="w-5 h-5 text-amber-400 mx-auto" />
                  <p className="font-bold text-slate-300">Rider Assignment Pending</p>
                  <p className="text-[11px] text-slate-500">Nearby riders in Savar DOHS are being notified for store pickup.</p>
                </div>
              )}
            </div>

            {/* Danger Zone (Cancel) */}
            {['PENDING', 'PROCESSING'].includes(order.status) && (
              <div className="p-5 rounded-3xl bg-red-500/5 border border-red-500/20 space-y-3">
                <h2 className="font-bold text-sm text-red-300">Danger Zone</h2>
                <p className="text-xs text-slate-400">Cancelling this order will notify the customer and initiate a refund if payment was made.</p>
                <button className="w-full py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 font-bold text-xs hover:bg-red-500/30 transition-all">
                  Cancel Order
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
