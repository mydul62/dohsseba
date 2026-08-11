'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api-client';
import { formatCurrency } from '@/utils/cn';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSocket } from '@/hooks/useSocket';
import { getSocket } from '@/lib/socket';
import {
  Bike, Navigation, CheckCircle2, Clock, MapPin, Phone, Store,
  Package, Check, X, Loader2, User, Eye, Trash2, Tag, ShoppingBag,
  Search, ShieldCheck, Filter, Wallet, LogOut, AlertTriangle, BellRing
} from 'lucide-react';
import { CurrentMissionView } from './CurrentMissionView';
import ProfileManagementContent from '../dashboard/ProfileManagementContent';

// Audio chime synthesis & Haptic Vibration for incoming dispatch request
const triggerOrderAlert = () => {
  try {
    const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext || (window as any).webkitAudioContext) : null;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const playBeep = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.7, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = ctx.currentTime;
      playBeep(880, now, 0.2);
      playBeep(1174.66, now + 0.22, 0.2);
      playBeep(1480, now + 0.44, 0.35);
    }

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([400, 150, 400, 150, 500]);
    }
  } catch (_) {}
};

interface RiderDashboardProps {
  initialTab?: 'orders' | 'history' | 'wallet' | 'notifications' | 'profile';
}

export function RiderDashboardContent({ initialTab = 'orders' }: RiderDashboardProps) {
  const router = useRouter();
  const { language } = useLanguageStore();
  const { user, logout } = useAuthStore();
  const { socket } = useSocket();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Tab State Synced with InitialTab Route ─────────────────────────────────
  const [activeTab, setActiveTab] = useState<'orders' | 'history' | 'wallet' | 'notifications' | 'profile'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // ── Core Rider State ──────────────────────────────────────────────────────
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [autoAccept, setAutoAccept] = useState<boolean>(false);
  const [togglingDuty, setTogglingDuty] = useState<boolean>(false);
  const [riderProfile, setRiderProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // ── Dynamic Backend Orders State ──────────────────────────────────────────
  const [activeMissions, setActiveMissions] = useState<any[]>([]);
  const [openOrders, setOpenOrders] = useState<any[]>([]);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [historySearch, setHistorySearch] = useState<string>('');

  // ── Wallet & Withdraw State ───────────────────────────────────────────────
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawMethod, setWithdrawMethod] = useState<'bkash' | 'nagad' | 'bank'>('bkash');
  const [withdrawAccNo, setWithdrawAccNo] = useState<string>('');
  const [requestingWithdraw, setRequestingWithdraw] = useState<boolean>(false);
  // ── Order Detail Modal State ──────────────────────────────────────────────
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
  const [actionMsg, setActionMsg] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Load saved local history from localStorage on initial render ─────────
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const saved = localStorage.getItem(`rider_order_history_${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrderHistory((prev) => {
              const map = new Map();
              parsed.forEach((o: any) => map.set(o.id, o));
              prev.forEach((o: any) => map.set(o.id, o));
              return Array.from(map.values());
            });
          }
        } catch (_) {}
      }
    }
  }, [user?.id]);

  // Load All Rider Data Dynamically from Backend APIs
  const loadRiderData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes, actRes, opRes, hRes, wRes] = await Promise.all([
        fetchApi<any>('/rider/profile').catch(() => null),
        fetchApi<any>('/rider/stats').catch(() => null),
        fetchApi<any>('/rider/orders/active').catch(() => null),
        fetchApi<any>('/rider/orders/open').catch(() => null),
        fetchApi<any>('/rider/orders/history?limit=50').catch(() => null),
        fetchApi<any>('/rider/withdraw').catch(() => null),
      ]);

      if (pRes?.success && pRes.data) {
        setRiderProfile(pRes.data);
        setIsOnline(pRes.data.isOnline ?? pRes.data.isAvailable ?? true);
      }

      if (sRes?.success && sRes.data) setStats(sRes.data);

      if (actRes?.success && Array.isArray(actRes.data)) {
        setActiveMissions(actRes.data);
      } else {
        setActiveMissions([]);
      }

      if (opRes?.success && Array.isArray(opRes.data)) {
        setOpenOrders(opRes.data);
      } else {
        setOpenOrders([]);
      }

      if (hRes?.success && hRes.data) {
        const historyList = Array.isArray(hRes.data) ? hRes.data : (hRes.data.orders || []);
        setOrderHistory((prev) => {
          const map = new Map();
          historyList.forEach((o: any) => map.set(o.id, o));
          prev.forEach((o: any) => {
            if (!map.has(o.id) && (o.status === 'DELIVERED' || o.status === 'CANCELLED' || o.status === 'COMPLETED' || o.status === 'REJECTED')) {
              map.set(o.id, o);
            }
          });
          const merged = Array.from(map.values());
          if (typeof window !== 'undefined' && user?.id && merged.length > 0) {
            try {
              localStorage.setItem(`rider_order_history_${user.id}`, JSON.stringify(merged));
            } catch (_) {}
          }
          return merged;
        });
      }

      if (wRes?.success && wRes.data) {
        const wList = Array.isArray(wRes.data) ? wRes.data : (wRes.data.requests || []);
        setWithdrawHistory(wList);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadRiderData();
  }, [loadRiderData, user?.id, activeTab]);

  // Realtime Socket Listener
  useEffect(() => {
    const socketInstance = socket || getSocket();

    if (user?.id) {
      socketInstance.emit('register_rider', { riderId: user?.id });
    }

    const handleNewOrder = (data: any) => {
      console.log('⚡ [RIDER REALTIME] New dispatch request received:', data);
      const rawOrder = data?.order || data;
      if (rawOrder && (rawOrder.id || rawOrder.orderId)) {
        setOpenOrders((prev) => {
          const exists = prev.some((o) => o.id === (rawOrder.id || rawOrder.orderId));
          if (exists) return prev;
          return [rawOrder, ...prev];
        });
        triggerOrderAlert();
        showToast('⚡ New Dispatch Request Received!');
      }
      loadRiderData();
    };

    const handleStatusUpdate = (data: any) => {
      console.log('⚡ [RIDER REALTIME] Order status update event:', data);
      loadRiderData();
    };

    socketInstance.on('RIDER_ORDER_BROADCAST', handleNewOrder);
    socketInstance.on('new_order_dispatched', handleNewOrder);
    socketInstance.on('NEW_ORDER_DISPATCHED', handleNewOrder);
    socketInstance.on('ORDER_CREATED', handleNewOrder);
    socketInstance.on('order:created', handleNewOrder);
    socketInstance.on('ORDER_STATUS_UPDATED', handleStatusUpdate);
    socketInstance.on('order:status_updated', handleStatusUpdate);
    socketInstance.on('RIDER_ORDER_ACCEPTED', handleStatusUpdate);
    socketInstance.on('MISSION_COMPLETED', handleStatusUpdate);

    return () => {
      socketInstance.off('RIDER_ORDER_BROADCAST', handleNewOrder);
      socketInstance.off('new_order_dispatched', handleNewOrder);
      socketInstance.off('NEW_ORDER_DISPATCHED', handleNewOrder);
      socketInstance.off('ORDER_CREATED', handleNewOrder);
      socketInstance.off('order:created', handleNewOrder);
      socketInstance.off('ORDER_STATUS_UPDATED', handleStatusUpdate);
      socketInstance.off('order:status_updated', handleStatusUpdate);
      socketInstance.off('RIDER_ORDER_ACCEPTED', handleStatusUpdate);
      socketInstance.off('MISSION_COMPLETED', handleStatusUpdate);
    };
  }, [socket, user?.id, loadRiderData]);

  const showToast = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3500);
  };

  // Toggle Duty Online/Offline
  const handleToggleDuty = async () => {
    setTogglingDuty(true);
    try {
      const nextDuty = !isOnline;
      await fetchApi('/rider/duty', {
        method: 'PATCH',
        body: JSON.stringify({ isOnline: nextDuty, isAvailable: nextDuty }),
      }).catch(() => null);
      setIsOnline(nextDuty);
      showToast(nextDuty ? 'You are ON DUTY. Receiving new orders...' : 'Duty set to OFF DUTY.');
    } finally {
      setTogglingDuty(false);
    }
  };

  // Accept Incoming Order Request
  const handleAcceptOrder = async (order: any) => {
    setActionLoading(order.id);
    try {
      const res = await fetchApi<any>(`/rider/orders/${order.id}/accept`, {
        method: 'POST',
      }).catch(() => null);

      if (res?.success) {
        setOpenOrders((prev) => prev.filter((o) => o.id !== order.id));
        showToast(`Accepted Order #${order.id?.slice(-6).toUpperCase()}! Added to Active Deliveries.`);
        loadRiderData();
      } else {
        showToast(res?.message || 'Could not accept order.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Decline Incoming Order Request
  const handleDeclineOrder = (orderId: string) => {
    setOpenOrders((prev) => prev.filter((o) => o.id !== orderId));
    showToast('Request declined.');
  };

  // Remove Specific Item from Order
  const handleRemoveOrderItem = async (orderId: string, itemId: string, itemName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${itemName}" from this order?`)) return;
    setActionLoading(itemId);
    try {
      const res = await fetchApi<any>(`/rider/orders/${orderId}/items/${itemId}`, {
        method: 'DELETE',
      }).catch(() => null);

      if (res?.success && res.data) {
        setSelectedOrderDetails(res.data);
        showToast(`Item "${itemName}" removed from order.`);
      } else {
        setSelectedOrderDetails((prev: any) => {
          if (!prev) return null;
          const updatedItems = (prev.items || []).filter((i: any) => (i.id || i.name) !== itemId);
          const newSubTotal = updatedItems.reduce(
            (sum: number, i: any) => sum + Number(i.price || i.unitPrice || 0) * Number(i.quantity || 1),
            0
          );
          const fee = prev.deliveryFee || 50;
          return {
            ...prev,
            items: updatedItems,
            subTotal: newSubTotal,
            totalAmount: Math.max(0, newSubTotal + fee - (prev.discount || 0)),
          };
        });
        showToast(`Item "${itemName}" removed.`);
      }
      loadRiderData();
    } finally {
      setActionLoading(null);
    }
  };

  // Cancel Order Anytime
  const handleCancelOrder = async (orderId: string) => {
    const reason = window.prompt('Please enter the reason for cancelling this order (e.g. Customer unreachable / Wrong address):');
    if (reason === null) return;
    const note = reason.trim() || 'Rider cancelled order without extra notes.';
    setActionLoading(orderId);
    try {
      const targetOrder = activeMissions.find((o) => o.id === orderId) || selectedOrderDetails;
      const cancelledObj = targetOrder ? { ...targetOrder, status: 'CANCELLED', notes: `Rider Cancellation Note: ${note}`, updatedAt: new Date().toISOString() } : null;

      await fetchApi<any>(`/rider/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CANCELLED', note }),
      }).catch(() => null);

      setSelectedOrderDetails(null);
      setActiveMissions((prev) => prev.filter((o) => o.id !== orderId));
      if (cancelledObj) {
        setOrderHistory((prev) => [cancelledObj, ...prev.filter((o) => o.id !== orderId)]);
      }
      showToast('Order CANCELLED! Reason saved & sent to Seller.');
      loadRiderData();
    } finally {
      setActionLoading(null);
    }
  };

  // Request Payout Submit
  const handleRequestWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return;

    setRequestingWithdraw(true);
    try {
      const res = await fetchApi<any>('/rider/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(withdrawAmount),
          paymentMethod: withdrawMethod,
          accountNumber: withdrawAccNo,
        }),
      }).catch(() => null);

      if (res?.success) {
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setWithdrawAccNo('');
        showToast('Withdrawal request submitted successfully!');
        loadRiderData();
      } else {
        showToast(res?.message || 'Withdrawal request failed.');
      }
    } finally {
      setRequestingWithdraw(false);
    }
  };

  const todayEarnings = stats?.todayEarnings ?? stats?.totalEarnings ?? 0;
  const todayDeliveredOrderValue =
    stats?.todayOrderValue ??
    orderHistory.reduce((acc: number, ord: any) => {
      const isDelivered = ord.status === 'DELIVERED' || ord.status === 'COMPLETED';
      if (!isDelivered) return acc;
      return acc + (Number(ord.totalAmount) || Number(ord.subTotal || 0) + Number(ord.deliveryFee || 50));
    }, 0);

  // Filtered History Calculation
  const filteredHistory = orderHistory.filter((ord: any) => {
    const stUpper = String(ord.status || '').toUpperCase();
    const matchesFilter =
      historyFilter === 'ALL'
        ? true
        : historyFilter === 'DELIVERED'
        ? stUpper === 'DELIVERED' || stUpper === 'COMPLETED' || stUpper === 'DELIVERING'
        : stUpper === 'CANCELLED' || stUpper === 'REJECTED' || stUpper === 'CANCELED';

    const q = historySearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      String(ord.id || '').toLowerCase().includes(q) ||
      String(ord.trackingCode || '').toLowerCase().includes(q) ||
      String(ord.customerName || '').toLowerCase().includes(q) ||
      String(ord.customer?.name || '').toLowerCase().includes(q) ||
      String(ord.guestName || '').toLowerCase().includes(q) ||
      String(ord.customerPhone || '').toLowerCase().includes(q) ||
      String(ord.address?.line1 || '').toLowerCase().includes(q) ||
      String(ord.deliveryAddress || '').toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-24 select-none">
      
      {/* Toast Confirmation Feedback */}
      {actionMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10000] px-4 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* ── TOP SUMMARY METRIC CARDS (ROW OF 4) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Card 1: Duty Status Toggle */}
        <div
          onClick={handleToggleDuty}
          className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-24 ${
            isOnline
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-950/30'
              : 'bg-slate-900/80 border-slate-800 text-slate-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isOnline ? 'bg-emerald-500' : 'bg-slate-700'}`}>
              <div className={`w-3 h-3 rounded-full bg-white transition-transform ${isOnline ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">STATUS</span>
            <strong className={`text-xs font-extrabold block mt-0.5 ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isOnline ? 'On Duty' : 'Off Duty'}
            </strong>
          </div>
        </div>

        {/* Card 2: Active Deliveries Count */}
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACTIVE</span>
          <div className="text-2xl font-black text-white font-mono">{activeMissions.length}</div>
        </div>

        {/* Card 3: Today's Income (Commission) */}
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TODAY INCOME</span>
          <div className="text-lg font-black text-emerald-400 font-mono">৳{todayEarnings}</div>
        </div>

        {/* Card 4: Today's Delivered Total Value (Product + Delivery Fee) */}
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DELIVERED VALUE</span>
          <div className="text-lg font-black text-blue-400 font-mono">৳{todayDeliveredOrderValue}</div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          DYNAMIC ROUTE VIEW HANDLER (5 TABS)
         ══════════════════════════════════════════════════════════════════════ */}

      {/* TAB 1: HISTORY VIEW */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>DELIVERY & CANCELLED HISTORY</span>
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-black flex items-center justify-center border border-indigo-500/30">
                {filteredHistory.length}
              </span>
            </h2>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search history by Order ID, customer or address..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#0F172A] border border-slate-800 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {['ALL', 'DELIVERED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setHistoryFilter(st as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    historyFilter === st
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#0F172A] border border-slate-800 text-center space-y-2">
              <Clock className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="font-extrabold text-sm text-white">No Order History Found</h3>
              <p className="text-xs text-slate-500">Delivered and cancelled orders will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((ord: any) => {
                const isDelivered = ord.status === 'DELIVERED' || ord.status === 'COMPLETED';
                const isCancelled = ord.status === 'CANCELLED' || ord.status === 'REJECTED';
                const cName = ord.customerName || ord.customer?.name || ord.user?.name || ord.guestName || (ord.notes && ord.notes.match(/Name:\s*([^.\n]+)/i)?.[1]?.trim()) || 'Resident Customer';
                const cPhone = ord.phone || ord.customerPhone || ord.customer?.phone || ord.user?.phone || ord.address?.phone || (ord.notes && ord.notes.match(/Phone:\s*([0-9\+\-\s]+)/i)?.[1]?.trim()) || 'N/A';
                const addr = ord.guestAddress || ord.deliveryAddress || ord.address?.line1 || (typeof ord.address === 'string' ? ord.address : null) || (ord.notes && ord.notes.match(/Address:\s*([^.\n]+)/i)?.[1]?.trim()) || '';
                const itemsList = ord.items || [];

                return (
                  <div key={ord.id} className="p-4 rounded-3xl bg-[#0F172A] border border-slate-800 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-300">
                          #{ord.id?.slice(-6).toUpperCase()}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${
                            isDelivered
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : isCancelled
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {isDelivered ? '✓ Delivered' : isCancelled ? '✕ Cancelled' : ord.status}
                        </span>
                      </div>

                      <span className={`font-mono font-black text-xs ${isDelivered ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {isDelivered ? `+৳${ord.deliveryFee || 50}` : '৳0 (Cancelled)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-white font-bold block">{cName}</strong>
                        <span className="text-slate-400 font-mono">{cPhone}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedOrderDetails(ord)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Products & Details</span>
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#0B1120] border border-slate-850 text-xs flex items-start gap-2 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="truncate">{addr}</span>
                    </div>

                    {itemsList.length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-slate-850">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                          Products ({itemsList.length} items):
                        </span>
                        <div className="space-y-1.5">
                          {itemsList.map((i: any, idx: number) => {
                            const pImg = i.product?.images?.[0] || i.image || i.productImage || null;
                            const pName = i.name || i.product?.name || `Item #${idx + 1}`;
                            return (
                              <div key={i.id || idx} className="flex justify-between items-center text-xs p-1.5 rounded-xl bg-[#0B1120] border border-slate-800/80">
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  {pImg ? (
                                    <img src={pImg} alt={pName} className="w-7 h-7 rounded-lg object-cover border border-slate-700/80 shrink-0" />
                                  ) : (
                                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-[10px] shrink-0">📦</div>
                                  )}
                                  <span className="text-slate-200 font-medium truncate">
                                    {i.quantity || 1}x {pName}
                                  </span>
                                </div>
                                <span className="font-mono font-bold text-slate-300 shrink-0">
                                  ৳{Number(i.price || i.unitPrice || 0) * Number(i.quantity || 1)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WALLET VIEW */}
      {activeTab === 'wallet' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-slate-300 uppercase tracking-wider">
              RIDER WALLET & PAYOUTS
            </h2>
            <button
              type="button"
              onClick={() => setShowWithdrawModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md cursor-pointer"
            >
              + Request Payout
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Available Balance</span>
              <div className="text-xl font-black text-emerald-400 font-mono">
                ৳{stats?.totalEarnings || todayEarnings}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Completed Trips</span>
              <div className="text-xl font-black text-blue-400 font-mono">
                {stats?.totalTrips || 0} Trips
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider px-1">Withdrawal Requests</h3>
            {withdrawHistory.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 text-center text-xs text-slate-500">
                No payout withdrawal requests submitted yet.
              </div>
            ) : (
              withdrawHistory.map((w: any) => (
                <div key={w.id} className="p-3.5 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">৳{w.amount} via {w.paymentMethod}</span>
                    <span className="text-[10px] text-slate-500">{new Date(w.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    {w.status || 'PENDING'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PROFILE VIEW */}
      {activeTab === 'profile' && (
        <ProfileManagementContent />
      )}

      {/* TAB 4: ORDERS VIEW (DEFAULT DISPATCH & ACTIVE MISSIONS) */}
      {(activeTab === 'orders' || activeTab === 'notifications') && (
        <>
          {/* ── ACTIVE DELIVERIES SECTION ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>ACTIVE DELIVERIES</span>
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-black flex items-center justify-center border border-blue-500/30">
                  {activeMissions.length}
                </span>
              </h2>
            </div>

            {activeMissions.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#0F172A] border border-slate-800 text-center space-y-2">
                <Bike className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="font-extrabold text-sm text-white">No Active Deliveries</h3>
                <p className="text-xs text-slate-500">Accept an incoming request below to start delivery.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeMissions.map((ord, idx) => (
                  <CurrentMissionView
                    key={ord.id || idx}
                    mission={ord}
                    onMissionUpdate={loadRiderData}
                    onOpenDetails={(selectedOrd) => setSelectedOrderDetails(selectedOrd)}
                    isPinned={idx === 0 && activeMissions.length > 1}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── INCOMING REQUESTS SECTION ── */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>INCOMING REQUESTS</span>
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center border border-amber-500/30">
                  {openOrders.length}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setAutoAccept(!autoAccept)}
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300"
              >
                {autoAccept ? 'Auto-accept ON' : 'Auto-accept off'}
              </button>
            </div>

            {openOrders.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/60 text-center text-xs text-slate-500">
                No incoming dispatch requests right now.
              </div>
            ) : (
              <div className="space-y-3">
                {openOrders.map((ord) => {
                  const cName = ord.customerName || ord.user?.name || ord.guestName || 'Customer';
                  const distance = ord.pickupDistance || '1.2 km';
                  const fee = ord.deliveryFee || 65;

                  return (
                    <div
                      key={ord.id}
                      className="p-4 rounded-3xl bg-[#0F172A] border-2 border-dashed border-amber-500/60 shadow-xl space-y-3.5 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/30 flex items-center gap-1">
                          ⏱ NEW REQUEST
                        </span>
                        <span className="text-xs font-bold text-slate-400">Pickup {distance}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-extrabold text-white">
                            Order <span className="font-mono font-black">#{ord.id?.slice(-6).toUpperCase()}</span> — {cName}
                          </span>
                        </div>
                        <span className="text-base font-black text-emerald-400 font-mono">+৳{fee}</span>
                      </div>

                      <div className="grid grid-cols-12 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleDeclineOrder(ord.id)}
                          className="col-span-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-xs transition-all cursor-pointer"
                        >
                          Decline
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedOrderDetails(ord)}
                          className="col-span-3 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-blue-400 font-extrabold text-xs flex items-center justify-center transition-all cursor-pointer"
                          title="Preview Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAcceptOrder(ord)}
                          disabled={actionLoading === ord.id}
                          className="col-span-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          {actionLoading === ord.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>Accept</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── ORDER DETAIL MODAL / BOTTOM SHEET (OPENED BY EYE ICON) ── */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4 shadow-2xl max-h-[80vh] overflow-y-auto mb-16 sm:mb-0">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">
                  Order Details #{selectedOrderDetails.id?.slice(-8).toUpperCase()}
                </h3>
                <span className="text-xs text-emerald-400 font-bold font-mono">
                  Earnings: +৳{selectedOrderDetails.deliveryFee || 50}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="p-4 rounded-2xl bg-[#0B1120] border border-slate-800/80 space-y-2 text-xs">
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Customer Info</span>
              <p className="font-extrabold text-white text-sm">
                {selectedOrderDetails.customerName || selectedOrderDetails.user?.name || selectedOrderDetails.customer?.name || selectedOrderDetails.guestName || (selectedOrderDetails.notes && selectedOrderDetails.notes.match(/Name:\s*([^.\n]+)/i)?.[1]?.trim()) || 'Valued Customer'}
              </p>
              <p className="text-slate-300 font-mono">
                Phone: {selectedOrderDetails.phone || selectedOrderDetails.customerPhone || selectedOrderDetails.user?.phone || selectedOrderDetails.customer?.phone || selectedOrderDetails.address?.phone || (selectedOrderDetails.notes && selectedOrderDetails.notes.match(/Phone:\s*([0-9\+\-\s]+)/i)?.[1]?.trim()) || 'N/A'}
              </p>
              <div className="pt-2 border-t border-slate-800 text-slate-300 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="font-medium">
                  {selectedOrderDetails.guestAddress || selectedOrderDetails.deliveryAddress || selectedOrderDetails.address?.line1 || (typeof selectedOrderDetails.address === 'string' ? selectedOrderDetails.address : null) || (selectedOrderDetails.notes && selectedOrderDetails.notes.match(/Address:\s*([^.\n]+)/i)?.[1]?.trim()) || ''}
                </p>
              </div>
            </div>

            {/* Itemized Package Contents */}
            <div className="p-4 rounded-2xl bg-[#0B1120] border border-slate-800/80 space-y-3 text-xs">
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Package Contents</span>
              
              <div className="space-y-2">
                {(selectedOrderDetails.items || []).length === 0 ? (
                  <p className="text-slate-500 text-center py-1 text-xs">No items listed.</p>
                ) : (
                  (selectedOrderDetails.items || []).map((item: any, idx: number) => {
                    const itemName = item.name || item.product?.name || `Item #${idx + 1}`;
                    const itemId = item.id || item.name || String(idx);
                    const price = Number(item.price || item.unitPrice || 0);
                    const qty = Number(item.quantity || 1);
                    const pImg = item.product?.images?.[0] || item.image || item.productImage || null;

                    return (
                      <div key={itemId} className="flex justify-between items-center text-xs p-2 rounded-xl bg-[#070C18] border border-slate-800/80">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveOrderItem(selectedOrderDetails.id, itemId, itemName)}
                            className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 shrink-0 cursor-pointer"
                            title={`Delete "${itemName}" from order`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {pImg ? (
                            <img src={pImg} alt={itemName} className="w-8 h-8 rounded-lg object-cover border border-slate-700/80 shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-[10px] text-slate-500 shrink-0">📦</div>
                          )}
                          <span className="font-bold text-white truncate">{qty}x {itemName}</span>
                        </div>
                        <span className="font-mono text-slate-300 shrink-0">৳{price * qty}</span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-200">৳{selectedOrderDetails.subTotal || 0}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Charge:</span>
                  <span className="font-mono text-emerald-400">+৳{selectedOrderDetails.deliveryFee || 50}</span>
                </div>
                <div className="flex justify-between text-white font-black text-sm pt-2 border-t border-slate-800">
                  <span>Total Amount (COD):</span>
                  <span className="font-mono text-emerald-400">৳{selectedOrderDetails.totalAmount || 0}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCancelOrder(selectedOrderDetails.id)}
                className="py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-extrabold text-xs border border-rose-500/30 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Cancel Order</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="py-3 rounded-2xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WITHDRAWAL REQUEST MODAL ── */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleRequestWithdraw} className="w-full max-w-sm bg-[#0F172A] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base">Request Wallet Payout</h3>
              <button type="button" onClick={() => setShowWithdrawModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Withdrawal Amount (৳)</label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-2xl bg-[#0B1120] border border-slate-700 text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Payout Channel</label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value as any)}
                  className="w-full h-11 px-3.5 rounded-2xl bg-[#0B1120] border border-slate-700 text-white font-bold"
                >
                  <option value="bkash">bKash Mobile Personal</option>
                  <option value="nagad">Nagad Mobile Wallet</option>
                  <option value="bank">Bank Account Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Account / Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 01711223344"
                  value={withdrawAccNo}
                  onChange={(e) => setWithdrawAccNo(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-2xl bg-[#0B1120] border border-slate-700 text-white font-bold"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={requestingWithdraw}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              {requestingWithdraw && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Submit Payout Request</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
