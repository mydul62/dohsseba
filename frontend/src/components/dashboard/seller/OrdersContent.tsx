'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api-client';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/useAuthStore';
import { formatCurrency } from '@/utils/cn';
import {
  Search, Download, Eye, Loader2, ChevronLeft, ChevronRight,
  X, ShoppingBag, Check, Clock, RefreshCw, Archive, Truck,
  CheckCircle2, XCircle, AlertTriangle, RotateCcw, Package,
  Calendar, User, Filter, ArrowUpDown, Banknote, Trash2, AlertCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export const ALL_STATUSES = ['PENDING', 'SELLER_ACCEPTED', 'READY_FOR_RIDER', 'RIDER_ASSIGNED', 'PICKUP_STARTED', 'PICKED_UP', 'ON_THE_WAY', 'ARRIVED', 'DELIVERED', 'CANCELLED', 'REJECTED'] as const;
export type OrderStatus = typeof ALL_STATUSES[number];

const STATUS_META: Record<OrderStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Pending', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: <Clock className="w-3 h-3" /> },
  SELLER_ACCEPTED: { label: 'Accepted', cls: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', icon: <CheckCircle2 className="w-3 h-3" /> },
  READY_FOR_RIDER: { label: 'Ready for Rider', cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', icon: <Truck className="w-3 h-3" /> },
  RIDER_ASSIGNED: { label: 'Rider Assigned', cls: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: <Truck className="w-3 h-3" /> },
  PICKUP_STARTED: { label: 'Store Pickup', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: <Package className="w-3 h-3" /> },
  PICKED_UP: { label: 'Picked Up', cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', icon: <Package className="w-3 h-3" /> },
  ON_THE_WAY: { label: 'On the Way', cls: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', icon: <Truck className="w-3 h-3" /> },
  ARRIVED: { label: 'Arrived Doorstep', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: <CheckCircle2 className="w-3 h-3" /> },
  DELIVERED: { label: 'Delivered', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: <CheckCircle2 className="w-3 h-3" /> },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-500/20 text-red-300 border-red-500/30', icon: <XCircle className="w-3 h-3" /> },
  REJECTED: { label: 'Rejected', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: <XCircle className="w-3 h-3" /> },
};

export function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status as OrderStatus] ?? { label: status, cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${m.cls}`}>
      {m.icon}{m.label}
    </span>
  );
}


import { useOrderStore } from '@/store/useOrderStore';
import { useSocket } from '@/hooks/useSocket';

// ─── Order List Component ─────────────────────────────────────────────────────

// Helper function: Play short "bip" notification sound for NEW orders only
const playNewOrderBipSound = () => {
  try {
    const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext || (window as any).webkitAudioContext) : null;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch notification bip
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch (err) {
    console.warn('Audio notification sound autoplay restricted:', err);
  }
};

interface OrdersContentProps {
  defaultStatus?: string;
  title?: string;
}

const PAGE_SIZE = 10;

export function OrdersContent({ defaultStatus, title }: OrdersContentProps) {
  const [apiOrders, setApiOrders] = useState<any[]>([]);
  const { orders: storeOrders, updateOrderStatus } = useOrderStore();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(defaultStatus || '');
  const [sortKey, setSortKey] = useState('newest');
  const [page, setPage] = useState(1);

  const { user } = useAuthStore();

  const { socket } = useSocket();

  const fetchOrders = (silent = false) => {
    if (!silent) setLoading(true);
    const params = new URLSearchParams({ page: '1', limit: '100' });
    if (defaultStatus) params.set('status', defaultStatus);
    fetchApi<any>(`/orders?${params}`)
      .then((r) => {
        if (r.success && Array.isArray(r.data)) {
          const mapped = r.data.map((o: any) => ({
            ...o,
            total: o.totalAmount ?? o.total ?? 0,
            createdAt: o.createdAt || new Date().toISOString(),
          }));
          setApiOrders((prev) => {
            const map = new Map();
            mapped.forEach((item: any) => map.set(String(item.id).toUpperCase(), item));
            prev.forEach((item: any) => {
              const k = String(item.id).toUpperCase();
              if (!map.has(k)) map.set(k, item);
            });
            return Array.from(map.values());
          });
        }
      })
      .catch((err) => console.error('Orders fetch failed:', err))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, [defaultStatus]);

  // Instant Real-Time Socket.IO Updates without page reload
  useEffect(() => {
    const socketInstance = socket || getSocket();

    if (user?.id) {
      socketInstance.emit('join_seller', user.id);
    }

    const handleOrderCreated = (data: any) => {
      console.log('⚡ [SELLER REALTIME] New order created in database:', data);
      const rawOrder = data?.order || data;
      if (rawOrder && (rawOrder.id || rawOrder.trackingCode)) {
        const newOrder = {
          ...rawOrder,
          total: rawOrder.totalAmount ?? rawOrder.total ?? 0,
          createdAt: rawOrder.createdAt || new Date().toISOString(),
        };
        setApiOrders((prev) => {
          const exists = prev.some((o) => o.id === newOrder.id || (o.trackingCode && o.trackingCode === newOrder.trackingCode));
          if (exists) {
            return prev.map((o) => (o.id === newOrder.id || (o.trackingCode && o.trackingCode === newOrder.trackingCode) ? { ...o, ...newOrder } : o));
          }
          // ONLY play short "bip" sound when order is genuinely NEW
          playNewOrderBipSound();
          return [newOrder, ...prev];
        });
        setPage(1); // Jump to page 1 to see the new order at the top
      }
      fetchOrders(true); // Silent background sync
    };

    const handleStatusUpdated = (data: any) => {
      console.log('⚡ [SELLER REALTIME] Order status updated:', data);
      const targetId = data?.orderId || data?.id || data?.order?.id;
      const targetStatus = data?.status || data?.order?.status;

      if (targetId && targetStatus) {
        setApiOrders((prev) =>
          prev.map((o) =>
            o.id === targetId || (o.trackingCode && o.trackingCode === targetId)
              ? {
                  ...o,
                  ...(data.order || {}),
                  status: targetStatus,
                }
              : o
          )
        );
      }
      fetchOrders(true); // Silent background sync
    };

    socketInstance.on('ORDER_CREATED', handleOrderCreated);
    socketInstance.on('order:created', handleOrderCreated);
    socketInstance.on('new_order', handleOrderCreated);
    socketInstance.on('ORDER_PUSHED', handleOrderCreated);
    socketInstance.on('ORDER_STATUS_UPDATED', handleStatusUpdated);
    socketInstance.on('order:status_updated', handleStatusUpdated);

    return () => {
      socketInstance.off('ORDER_CREATED', handleOrderCreated);
      socketInstance.off('order:created', handleOrderCreated);
      socketInstance.off('new_order', handleOrderCreated);
      socketInstance.off('ORDER_PUSHED', handleOrderCreated);
      socketInstance.off('ORDER_STATUS_UPDATED', handleStatusUpdated);
      socketInstance.off('order:status_updated', handleStatusUpdated);
    };
  }, [socket, user?.id]);

  const mappedStoreOrders = useMemo(() => {
    return storeOrders.map((o) => {
      let createdAt: string;
      try {
        const d = new Date(o.date);
        createdAt = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
      } catch {
        createdAt = new Date().toISOString();
      }

      return {
        id: o.id,
        customer: {
          name:  (o as any).customerName  || 'Customer',
          email: (o as any).customerEmail || '—',
          phone: (o as any).customerPhone || '—',
        },
        items: o.items.map((i) => ({
          product: { name: i.name },
          quantity: i.qty,
          price: i.price,
        })),
        total: o.total,
        totalAmount: o.total,
        status: o.status,
        createdAt,
        payment: { method: o.paymentMethod || 'N/A' },
        paymentMethod: o.paymentMethod || 'N/A',
        deliveryAddress: o.deliveryAddress,
        seller: (o as any).seller || 'DOHS Market',
        estDelivery: (o as any).estDelivery || '—',
      };
    });
  }, [storeOrders]);

  const allCombinedOrders = useMemo(() => {
    // Put apiOrders SECOND so real database orders override store orders in Map
    const combined = [...mappedStoreOrders, ...apiOrders];
    const uniqueMap = new Map();
    combined.forEach((o) => uniqueMap.set(String(o.id).toUpperCase(), o));
    return Array.from(uniqueMap.values());
  }, [mappedStoreOrders, apiOrders]);

  const filtered = useMemo(() => {
    let list = [...allCombinedOrders];
    if (status) list = list.filter((o) => o.status === status);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        o.id.toLowerCase().includes(q) ||
        (o.trackingCode && o.trackingCode.toLowerCase().includes(q)) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.guestName?.toLowerCase().includes(q) ||
        o.customer?.email?.toLowerCase().includes(q) ||
        (o.customerPhone && o.customerPhone.includes(q)) ||
        (o.guestPhone && o.guestPhone.includes(q))
      );
    }

    const getTime = (dateVal: any) => {
      if (!dateVal) return 0;
      const t = new Date(dateVal).getTime();
      return isNaN(t) ? 0 : t;
    };

    if (sortKey === 'newest') list.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
    if (sortKey === 'oldest') list.sort((a, b) => getTime(a.createdAt) - getTime(b.createdAt));
    if (sortKey === 'amount_desc') list.sort((a, b) => b.total - a.total);
    if (sortKey === 'amount_asc') list.sort((a, b) => a.total - b.total);
    return list;
  }, [allCombinedOrders, status, search, sortKey]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats per status
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    allCombinedOrders.forEach((o) => { c[o.status] = (c[o.status] || 0) + 1; });
    return c;
  }, [allCombinedOrders]);

  // Helpers
  const toggleAll = () => setSelected(selected.size === pageItems.length ? new Set() : new Set(pageItems.map((o) => o.id)));
  const toggleOne = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const exportCSV = () => {
    const rows = [
      ['Order ID', 'Customer', 'Total', 'Status', 'Date'],
      ...allCombinedOrders.map((o) => [o.id, o.customer?.name, o.total, o.status, new Date(o.createdAt).toLocaleDateString()]),
    ];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'orders.csv'; a.click();
  };

  // ─── Next status map ─────────────────────────────────────────────────────────
  const NEXT_STATUS: Record<string, string | null> = {
    PENDING:                       'SELLER_ACCEPTED',
    SELLER_ACCEPTED:               'READY_FOR_RIDER',
    READY_FOR_RIDER:               'WAITING_FOR_MANUAL_ASSIGNMENT',
    WAITING_FOR_MANUAL_ASSIGNMENT: 'READY_FOR_RIDER',
    RIDER_ASSIGNED:                null,
    PICKUP_STARTED:                null,
    PICKED_UP:                     null,
    ON_THE_WAY:                    null,
    ARRIVED:                       null,
    DELIVERED:                     null,
    CANCELLED:                     null,
    REJECTED:                      null,
  };

  const NEXT_LABEL: Record<string, string> = {
    PENDING:                       'Accept Order',
    SELLER_ACCEPTED:               'Dispatch to Rider Fleet',
    READY_FOR_RIDER:               'Request Manual Admin Assignment',
    WAITING_FOR_MANUAL_ASSIGNMENT: 'Re-broadcast to Rider Fleet',
    RIDER_ASSIGNED:                'Rider Assigned',
    DELIVERED:                     '',
    CANCELLED:                     '',
    REJECTED:                      '',
  };

  const NEXT_COLOR: Record<string, string> = {
    PENDING:                       'bg-emerald-600 hover:bg-emerald-500 text-white font-bold',
    SELLER_ACCEPTED:               'bg-cyan-600 hover:bg-cyan-500 text-white font-bold',
    READY_FOR_RIDER:               'bg-amber-600 hover:bg-amber-500 text-white font-bold',
    WAITING_FOR_MANUAL_ASSIGNMENT: 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold',
  };

  const handleQuickStatus = async (orderId: string, currentStatus: string) => {
    const next = NEXT_STATUS[currentStatus];
    if (!next || updatingId) return;
    setUpdatingId(orderId);
    try {
      const res = await fetchApi<any>(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      if (res?.success) {
        console.log(`✅ [SELLER] Order ${orderId} status updated to ${next}`);
        updateOrderStatus(orderId, next as any);
        fetchOrders();
      } else {
        console.error(`❌ [SELLER] Status update error:`, res?.message);
      }
    } catch (err) {
      console.error(`❌ [SELLER] Network error updating status:`, err);
    } finally {
      setUpdatingId(null);
    }
  };

  // ─── Bulk Operations ────────────────────────────────────────────────────────
  const updateSingleOrderStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetchApi<any>(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res?.success) {
        updateOrderStatus(id, newStatus as any);
      }
    } catch (err) {
      console.error(`Error updating order ${id} status:`, err);
    }
  };

  const handleBulkAccept = async () => {
    setLoading(true);
    const ids = Array.from(selected);
    for (const id of ids) {
      const order = allCombinedOrders.find((o) => o.id === id);
      if (order && order.status !== 'DELIVERED' && order.status !== 'CANCELLED') {
        await updateSingleOrderStatus(id, 'SELLER_ACCEPTED');
      }
    }
    setSelected(new Set());
    await fetchOrders();
    setLoading(false);
  };

  const handleBulkRiderRequest = async () => {
    setLoading(true);
    const ids = Array.from(selected);
    for (const id of ids) {
      const order = allCombinedOrders.find((o) => o.id === id);
      if (order && order.status !== 'DELIVERED' && order.status !== 'CANCELLED') {
        await updateSingleOrderStatus(id, 'READY_FOR_RIDER');
      }
    }
    setSelected(new Set());
    await fetchOrders();
    setLoading(false);
  };

  const handleBulkCancel = async () => {
    if (!window.confirm(`Are you sure you want to set ${selected.size} selected order(s) to CANCELLED?`)) return;
    setLoading(true);
    const ids = Array.from(selected);
    for (const id of ids) {
      const order = allCombinedOrders.find((o) => o.id === id);
      if (order && order.status !== 'DELIVERED') {
        await updateSingleOrderStatus(id, 'CANCELLED');
      }
    }
    setSelected(new Set());
    await fetchOrders();
    setLoading(false);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`⚠️ PERMANENT DELETE WARNING!\n\nAre you sure you want to permanently delete ${selected.size} selected order(s) from the database? This action cannot be undone.`)) return;
    setLoading(true);
    const ids = Array.from(selected);
    for (const id of ids) {
      try {
        await fetchApi<any>(`/orders/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.error(`Failed to delete order ${id}:`, err);
      }
    }
    setSelected(new Set());
    await fetchOrders();
    setLoading(false);
  };

  const handleBulkStatus = async () => {
    setLoading(true);
    const ids = Array.from(selected);
    for (const id of ids) {
      const order = allCombinedOrders.find((o) => o.id === id);
      if (order && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && NEXT_STATUS[order.status]) {
        await updateSingleOrderStatus(id, NEXT_STATUS[order.status]!);
      }
    }
    setSelected(new Set());
    await fetchOrders();
    setLoading(false);
  };

  const [autoAcceptOrders, setAutoAcceptOrders] = useState<boolean>(false);
  const [togglingAutoAccept, setTogglingAutoAccept] = useState<boolean>(false);
  const [selectedCancelledOrder, setSelectedCancelledOrder] = useState<any>(null);

  // Fetch Seller Store Profile Auto-Accept Preference
  useEffect(() => {
    fetchApi<any>('/seller/store-profile')
      .then((r) => {
        if (r.success && r.data) {
          setAutoAcceptOrders(Boolean(r.data.autoAcceptOrders));
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleAutoAccept = async () => {
    setTogglingAutoAccept(true);
    try {
      const nextState = !autoAcceptOrders;
      const res = await fetchApi<any>('/seller/auto-accept', {
        method: 'PATCH',
        body: JSON.stringify({ autoAcceptOrders: nextState }),
      }).catch(() => null);

      if (res?.success) {
        setAutoAcceptOrders(nextState);
      } else {
        setAutoAcceptOrders(nextState);
      }
    } finally {
      setTogglingAutoAccept(false);
    }
  };

  const pageLabel = title || (defaultStatus ? `${defaultStatus.charAt(0) + defaultStatus.slice(1).toLowerCase()} Orders` : 'All Orders');

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-black text-white text-xl">{pageLabel}</h1>
          <p className="text-xs text-slate-400">{filtered.length} order{filtered.length !== 1 ? 's' : ''} {defaultStatus ? `with status ${defaultStatus}` : 'total'}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-Accept Orders Toggle Switch */}
          <button
            type="button"
            onClick={handleToggleAutoAccept}
            disabled={togglingAutoAccept}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border transition-all cursor-pointer ${
              autoAcceptOrders
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-950/40'
                : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Toggle Auto-Accept & Auto-Dispatch Orders"
          >
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${autoAcceptOrders ? 'bg-emerald-500' : 'bg-slate-700'}`}>
              <div className={`w-3 h-3 rounded-full bg-white transition-transform ${autoAcceptOrders ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-wider block leading-none">Auto-Accept & Dispatch</span>
              <span className={`text-[11px] font-extrabold ${autoAcceptOrders ? 'text-emerald-400' : 'text-slate-400'}`}>
                {autoAcceptOrders ? 'ON (Auto Rider Broadcast)' : 'OFF (Manual Review)'}
              </span>
            </div>
          </button>

          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/5 transition-all cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Status Tab Strip (only on All Orders page) ── */}
      {!defaultStatus && (
        <div className="flex items-center gap-2 flex-wrap">
          {[{ key: '', label: 'All', count: allCombinedOrders.length }, ...ALL_STATUSES.map((s) => ({ key: s, label: STATUS_META[s].label, count: counts[s] || 0 }))].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => { setStatus(key); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${status === key ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
            >
              {label}
              {count > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${status === key ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300'}`}>{count}</span>}
            </button>
          ))}
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="p-4 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search order ID, customer name or email…" className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="px-3 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-slate-300 text-xs focus:outline-none focus:border-indigo-500 appearance-none transition-colors">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_desc">Amount High–Low</option>
            <option value="amount_asc">Amount Low–High</option>
          </select>
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all font-bold">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Bulk Action Bar ── */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-[#1e1f35] border border-indigo-500/40 shadow-2xl flex-wrap">
          <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            <span>{selected.size} order(s) selected</span>
          </span>

          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <button
              onClick={handleBulkAccept}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
              title="Accept all selected pending orders"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Accept Selected
            </button>

            <button
              onClick={handleBulkRiderRequest}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
              title="Request rider dispatch for selected orders"
            >
              <Truck className="w-3.5 h-3.5" /> Request Rider
            </button>

            <button
              onClick={handleBulkCancel}
              className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
              title="Set selected orders to Cancelled status"
            >
              <XCircle className="w-3.5 h-3.5" /> Cancel Selected
            </button>

            <button
              onClick={handleBulkDelete}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95 shadow-rose-600/20"
              title="Permanently delete selected orders from database"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
            </button>

            <button
              onClick={handleBulkStatus}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95"
              title="Advance selected orders to next status"
            >
              <ChevronRight className="w-3.5 h-3.5" /> Advance Status
            </button>

            <button
              onClick={() => setSelected(new Set())}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition-all"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* ── Table & Mobile Cards Container ── */}
      <div className="rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl overflow-hidden">
        {/* Mobile App Cards View (Visible on viewports < md) */}
        <div className="md:hidden divide-y divide-white/10">
          {pageItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-bold">No orders found</p>
            </div>
          ) : (
            pageItems.map((o) => (
              <div key={o.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-indigo-400 font-mono text-sm">#{o.id.toUpperCase()}</div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white block">{o.customer?.name || 'Customer'}</span>
                    <span className="text-[11px] text-slate-400">{o.items?.length || 1} item(s) · {o.payment?.method || 'bKash'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white block text-sm">৳{formatCurrency(o.total)}</span>
                    <span className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short' })}</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center gap-2 justify-end">
                  {!!NEXT_STATUS[o.status] && (
                    <button
                      onClick={() => handleQuickStatus(o.id, o.status)}
                      disabled={updatingId === o.id}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${NEXT_COLOR[o.status] || 'bg-indigo-600 text-white'}`}
                    >
                      {updatingId === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      <span>{NEXT_LABEL[o.status]}</span>
                    </button>
                  )}
                  <Link href={`/seller/dashboard/orders/${o.id}`} className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors">
                    View
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View (Hidden on viewports < md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-[#181928]/50">
                <th className="w-10 p-4">
                  <button onClick={toggleAll} className="w-4 h-4 rounded border border-white/20 flex items-center justify-center hover:border-indigo-400 transition-colors">
                    {selected.size === pageItems.length && pageItems.length > 0 && <Check className="w-2.5 h-2.5 text-indigo-400" />}
                  </button>
                </th>
                <th className="p-4 text-left">Order</th>
                <th className="p-4 text-left">Customer</th>
                <th className="p-4 text-left hidden md:table-cell">Items</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-left hidden lg:table-cell">Date</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-bold">No orders found</p>
                  </td>
                </tr>
              )}
              {pageItems.map((o) => (
                <tr key={o.id} className={`hover:bg-white/5 transition-colors ${selected.has(o.id) ? 'bg-indigo-600/5' : ''}`}>
                  <td className="p-4">
                    <button onClick={() => toggleOne(o.id)} className="w-4 h-4 rounded border border-white/20 flex items-center justify-center hover:border-indigo-400 transition-colors">
                      {selected.has(o.id) && <Check className="w-2.5 h-2.5 text-indigo-400" />}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-indigo-400 font-mono">#{o.id.slice(-8).toUpperCase()}</div>
                    {o.trackingCode && (
                      <div className="text-[10px] text-amber-400 font-mono font-bold flex items-center gap-1">
                        <span>{o.trackingCode}</span>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500">{o.payment?.method ?? 'bKash'}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-white">{o.guestName || o.customer?.name || 'Guest Resident'}</span>
                      {o.isGuest || !o.customer?.id ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          GUEST
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          USER
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-bold truncate max-w-[160px]">
                      {o.guestPhone || o.customerPhone || o.customer?.phone || o.customer?.email || 'N/A'}
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <div className="text-slate-300">{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{o.items?.map((i: any) => i.product?.name).join(', ')}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-black text-white">{formatCurrency(o.total)}</div>
                    {o.discount > 0 && <div className="text-[10px] text-emerald-400">-{formatCurrency(o.discount)}</div>}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <StatusBadge status={o.status} />
                      {(o.status === 'CANCELLED' || o.status === 'REJECTED') && (
                        <button
                          type="button"
                          onClick={() => setSelectedCancelledOrder(o)}
                          className="px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold hover:bg-rose-500/30 flex items-center gap-1 cursor-pointer"
                          title="View Cancellation Reason Note"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Note</span>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <div className="text-slate-300">{new Date(o.createdAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    <div className="text-[10px] text-slate-500">{new Date(o.createdAt).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {!!NEXT_STATUS[o.status] && (
                        <button
                          onClick={() => handleQuickStatus(o.id, o.status)}
                          disabled={updatingId === o.id}
                          title={NEXT_LABEL[o.status]}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all disabled:opacity-50 ${NEXT_COLOR[o.status] ?? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                        >
                          {updatingId === o.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <ChevronRight className="w-3 h-3" />
                          }
                          <span>{updatingId === o.id ? 'Updating…' : NEXT_LABEL[o.status]}</span>
                        </button>
                      )}
                      <Link href={`/track-order?code=${encodeURIComponent(o.trackingCode || o.id)}`} target="_blank" className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-all" title="Quick Track Order">
                        <Truck className="w-3.5 h-3.5" />
                      </Link>
                      <Link href={`/seller/dashboard/orders/${o.id}`} className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 flex items-center justify-center transition-all" title="View Order">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10 text-xs">
            <span className="text-slate-400">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 disabled:opacity-40 transition-all"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, i, arr) => (
                <React.Fragment key={p}>
                  {(i > 0 && arr[i - 1] !== p - 1) ? <span className="text-slate-500">…</span> : null}
                  <button onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg border font-bold transition-all ${page === p ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}>{p}</button>
                </React.Fragment>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 disabled:opacity-40 transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Cancellation Reason Modal ── */}
      {selectedCancelledOrder && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1f2136] border border-rose-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-white text-base">Order Cancellation Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCancelledOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Order ID:</span>
                <span className="font-mono font-bold text-white">#{selectedCancelledOrder.id?.slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Customer Name:</span>
                <span className="font-bold text-white">{selectedCancelledOrder.customerName || selectedCancelledOrder.customer?.name || 'Customer'}</span>
              </div>
              {selectedCancelledOrder.riderName && (
                <div className="flex justify-between text-slate-300">
                  <span>Assigned Rider:</span>
                  <span className="font-bold text-indigo-400">{selectedCancelledOrder.riderName}</span>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider block">Rider Cancellation Reason Note:</span>
                <p className="text-xs text-rose-200 font-medium leading-relaxed">
                  {selectedCancelledOrder.notes || selectedCancelledOrder.cancellationReason || 'Order was cancelled by rider/customer. No extra cancellation note provided.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCancelledOrder(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
