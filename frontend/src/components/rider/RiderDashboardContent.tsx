'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api-client';
import { formatCurrency } from '@/utils/cn';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSocket } from '@/hooks/useSocket';
import {
  Bike, Navigation, CheckCircle2, Clock, MapPin, Phone, Store,
  Package, Check, X, Loader2, User, Eye, Trash2, Tag, ShoppingBag
} from 'lucide-react';
import { CurrentMissionView } from './CurrentMissionView';

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

  // ── Order Detail Modal State ──────────────────────────────────────────────
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
  const [actionMsg, setActionMsg] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load All Rider Data Dynamically from Backend APIs
  const loadRiderData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes, actRes, opRes, hRes] = await Promise.all([
        fetchApi<any>('/rider/profile').catch(() => null),
        fetchApi<any>('/rider/stats').catch(() => null),
        fetchApi<any>('/rider/orders/active').catch(() => null),
        fetchApi<any>('/rider/orders/open').catch(() => null),
        fetchApi<any>('/rider/orders/history?limit=30').catch(() => null),
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

      if (hRes?.success && Array.isArray(hRes.data)) {
        setOrderHistory(hRes.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRiderData();
  }, [loadRiderData]);

  // Realtime Socket Listener
  useEffect(() => {
    if (!socket) return;

    socket.emit('register_rider', { riderId: user?.id });

    socket.on('new_order_dispatched', (order: any) => {
      setOpenOrders((prev) => [order, ...prev]);
      triggerOrderAlert();
      showToast('New Dispatch Request Received!');
    });

    socket.on('order_status_updated', () => {
      loadRiderData();
    });

    return () => {
      socket.off('new_order_dispatched');
      socket.off('order_status_updated');
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
    if (!window.confirm('Are you sure you want to CANCEL this order? It will be removed from your active missions.')) return;
    setActionLoading(orderId);
    try {
      await fetchApi<any>(`/rider/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CANCELLED' }),
      }).catch(() => null);

      setSelectedOrderDetails(null);
      setActiveMissions((prev) => prev.filter((o) => o.id !== orderId));
      showToast('Order CANCELLED! Removed from active missions.');
      loadRiderData();
    } finally {
      setActionLoading(null);
    }
  };

  const todayEarnings = stats?.todayEarnings ?? stats?.totalEarnings ?? 0;

  return (
    <div className="space-y-6 pb-24 select-none">
      
      {/* Toast Confirmation Feedback */}
      {actionMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10000] px-4 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* ── TOP SUMMARY METRIC CARDS (ROW OF 3) ── */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        
        {/* Card 1: Duty Status Toggle */}
        <div
          onClick={handleToggleDuty}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-24 ${
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
            <strong className={`text-sm font-extrabold block mt-0.5 ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isOnline ? 'On Duty' : 'Off Duty'}
            </strong>
          </div>
        </div>

        {/* Card 2: Active Deliveries Count */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACTIVE</span>
          <div className="text-2xl font-black text-white font-mono">{activeMissions.length}</div>
        </div>

        {/* Card 3: Today's Earnings */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TODAY</span>
          <div className="text-xl font-black text-white font-mono">৳{todayEarnings}</div>
        </div>
      </div>

      {/* ── 1. ACTIVE DELIVERIES SECTION ── */}
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

      {/* ── 2. INCOMING REQUESTS SECTION ── */}
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
                  {/* Top Badge & Distance */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/30 flex items-center gap-1">
                      ⏱ NEW REQUEST
                    </span>
                    <span className="text-xs font-bold text-slate-400">Pickup {distance}</span>
                  </div>

                  {/* Order ID & Customer Name + Fee */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-extrabold text-white">
                        Order <span className="font-mono font-black">#{ord.id?.slice(-6).toUpperCase()}</span> — {cName}
                      </span>
                    </div>
                    <span className="text-base font-black text-emerald-400 font-mono">+৳{fee}</span>
                  </div>

                  {/* Action Buttons: Decline | Eye Details | Accept */}
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
                {selectedOrderDetails.customerName || selectedOrderDetails.user?.name || selectedOrderDetails.customer?.name || selectedOrderDetails.guestName || 'Valued Customer'}
              </p>
              <p className="text-slate-300 font-mono">
                Phone: {selectedOrderDetails.phone || selectedOrderDetails.user?.phone || selectedOrderDetails.customer?.phone || selectedOrderDetails.customerPhone || 'N/A'}
              </p>
              <div className="pt-2 border-t border-slate-800 text-slate-300 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="font-medium">
                  {selectedOrderDetails.address?.line1 || selectedOrderDetails.address || selectedOrderDetails.deliveryAddress || 'DOHS Location, Dhaka'}
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

    </div>
  );
}
