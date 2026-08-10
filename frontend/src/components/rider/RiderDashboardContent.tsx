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
  BellRing, Package, Check, X, Loader2, User,
  Radio, Search, ShieldCheck, Wallet, ChevronRight, Menu, Eye, LogOut,
  Tag, ShoppingBag, LayoutGrid, RotateCcw, AlertTriangle, Compass
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

  // ── Navigation Tab State ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'orders' | 'history' | 'wallet' | 'notifications' | 'profile'>(initialTab);

  // ── Core Rider State ──────────────────────────────────────────────────────
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [autoAccept, setAutoAccept] = useState<boolean>(false);
  const [togglingDuty, setTogglingDuty] = useState<boolean>(false);
  const [riderProfile, setRiderProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // ── Orders State ──────────────────────────────────────────────────────────
  const [activeMissions, setActiveMissions] = useState<any[]>([
    {
      id: 'ord-S3107C',
      customerName: 'Rahim Chowdhury',
      phone: '+880 1711-000000',
      address: 'House #12, Road #04, DOHS Mohakhali, Dhaka',
      status: 'PICKED_UP',
      deliveryFee: 50,
      subTotal: 450,
      totalAmount: 500,
      createdAt: new Date().toISOString(),
      items: [
        { id: 'i1', name: 'Organic Whole Milk (2L)', quantity: 1, price: 220 },
        { id: 'i2', name: 'Fresh Deshi Tomato (1kg)', quantity: 2, price: 115 },
      ],
    },
  ]);

  const [openOrders, setOpenOrders] = useState<any[]>([
    {
      id: 'ord-S3108D',
      customerName: 'Nusrat Jahan',
      phone: '+880 1812-998877',
      address: 'House #45, Road #08, DOHS Mirpur, Dhaka',
      status: 'PENDING',
      deliveryFee: 65,
      pickupDistance: '1.2 km',
      subTotal: 620,
      totalAmount: 685,
      createdAt: new Date().toISOString(),
      items: [
        { id: 'i3', name: 'Fresh Beef Ribs (1kg)', quantity: 1, price: 620 },
      ],
    },
    {
      id: 'ord-S3109E',
      customerName: 'Kamrul Hasan',
      phone: '+880 1911-334455',
      address: 'Flat 4B, Road #11, DOHS Baridhara, Dhaka',
      status: 'PENDING',
      deliveryFee: 80,
      pickupDistance: '2.4 km',
      subTotal: 850,
      totalAmount: 930,
      createdAt: new Date().toISOString(),
      items: [
        { id: 'i4', name: 'Cooking Sunflower Oil (5L)', quantity: 1, price: 850 },
      ],
    },
  ]);

  const [orderHistory, setOrderHistory] = useState<any[]>([]);

  // ── Order Detail Modal State ──────────────────────────────────────────────
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
  const [actionMsg, setActionMsg] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load All Rider Data from Backend
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

      if (actRes?.success && Array.isArray(actRes.data) && actRes.data.length > 0) {
        setActiveMissions(actRes.data);
      }

      if (opRes?.success && Array.isArray(opRes.data)) {
        setOpenOrders(opRes.data);
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
      await fetchApi<any>(`/rider/orders/${order.id}/accept`, {
        method: 'POST',
      }).catch(() => null);

      // Move order from openOrders to activeMissions
      setOpenOrders((prev) => prev.filter((o) => o.id !== order.id));
      setActiveMissions((prev) => [...prev, { ...order, status: 'ACCEPTED' }]);
      showToast(`Accepted Order #${order.id?.slice(-6).toUpperCase() || 'S3108D'}! Added to Active Deliveries.`);
    } finally {
      setActionLoading(null);
    }
  };

  // Decline Incoming Order Request
  const handleDeclineOrder = (orderId: string) => {
    setOpenOrders((prev) => prev.filter((o) => o.id !== orderId));
    showToast('Request declined.');
  };

  const todayEarnings = stats?.todayEarnings ?? stats?.totalEarnings ?? 0;

  return (
    <div className="min-h-screen bg-[#070C18] text-slate-100 font-sans pb-28 select-none">
      
      {/* ── TOP PHONE STATUS BAR ── */}
      <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-mono text-slate-400 font-bold border-b border-slate-900/60">
        <span>9:41</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Dhaka · BD
        </span>
      </div>

      {/* ── HEADER CONSOLE BAR ── */}
      <header className="px-5 py-4 border-b border-slate-900 flex items-center justify-between bg-[#0B1120]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800">
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-extrabold text-white text-base tracking-tight leading-tight">Rider Fleet Co.</h1>
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">COURIER CONSOLE</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <button
              onClick={() => setActiveTab('notifications')}
              className="w-9 h-9 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 relative"
            >
              <BellRing className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center border-2 border-[#070C18]">
                2
              </span>
            </button>
          </div>

          <button
            onClick={() => setActiveTab('profile')}
            className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white font-black text-xs flex items-center justify-center shadow-lg shadow-pink-950/50"
          >
            {user?.name?.[0] || 'E'}
          </button>

          <button
            onClick={logout}
            className="p-2 rounded-2xl bg-slate-900 text-slate-400 hover:text-rose-400 border border-slate-800"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* TOAST CONFIRMATION FEEDBACK */}
      {actionMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* ── MAIN RIDER CONSOLE BODY ── */}
      <main className="max-w-md mx-auto p-4 space-y-6">

        {/* ── TOP SUMMARY METRIC CARDS (ROW OF 3) ── */}
        <div className="grid grid-cols-3 gap-2.5">
          
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

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1: MISSION / ACTIVE & INCOMING REQUESTS
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <div className="space-y-6">

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
                    const cName = ord.customerName || ord.user?.name || ord.guestName || 'Nusrat Jahan';
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
                              Order <span className="font-mono font-black">#{ord.id?.slice(-6).toUpperCase() || 'S3108D'}</span> — {cName}
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

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2: DISPATCH & OPEN LIST
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h2 className="font-black text-base text-white">System Broadcasts</h2>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-indigo-400 text-xs">Dispatch Ready</span>
              <p className="text-xs text-slate-300">Keep your duty status ONLINE to receive automatic delivery dispatches.</p>
            </div>
          </div>
        )}

      </main>

      {/* ── ORDER DETAIL MODAL / BOTTOM SHEET (OPENED BY EYE ICON) ── */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            
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
                {selectedOrderDetails.customerName || selectedOrderDetails.user?.name || selectedOrderDetails.guestName || 'Rahim Chowdhury'}
              </p>
              <p className="text-slate-300 font-mono">
                Phone: {selectedOrderDetails.phone || selectedOrderDetails.user?.phone || '+880 1711-000000'}
              </p>
              <div className="pt-2 border-t border-slate-800 text-slate-300 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="font-medium">
                  {selectedOrderDetails.address || selectedOrderDetails.deliveryAddress || 'House #12, Road #04, DOHS Mohakhali, Dhaka'}
                </p>
              </div>
            </div>

            {/* Itemized Package Contents */}
            <div className="p-4 rounded-2xl bg-[#0B1120] border border-slate-800/80 space-y-3 text-xs">
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Package Contents</span>
              <div className="space-y-2">
                {(selectedOrderDetails.items || [
                  { id: '1', name: 'Organic Whole Milk (2L)', quantity: 1, price: 220 },
                  { id: '2', name: 'Fresh Deshi Tomato (1kg)', quantity: 2, price: 115 },
                ]).map((item: any, idx: number) => (
                  <div key={item.id || idx} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{item.quantity || 1}x {item.name || item.product?.name || 'Package Item'}</span>
                    <span className="font-mono text-slate-300">৳{(item.price || item.unitPrice || 0) * (item.quantity || 1)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-200">৳{selectedOrderDetails.subTotal || 450}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Charge:</span>
                  <span className="font-mono text-emerald-400">+৳{selectedOrderDetails.deliveryFee || 50}</span>
                </div>
                <div className="flex justify-between text-white font-black text-sm pt-2 border-t border-slate-800">
                  <span>Total Amount (COD):</span>
                  <span className="font-mono text-emerald-400">৳{selectedOrderDetails.totalAmount || 500}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedOrderDetails(null)}
              className="w-full py-3.5 rounded-2xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 cursor-pointer"
            >
              Close Details View
            </button>
          </div>
        </div>
      )}

      {/* ── BOTTOM NAVIGATION BAR (FIXED) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B1120]/95 backdrop-blur-md border-t border-slate-900 p-2 shadow-2xl">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1 text-center">
          
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
              activeTab === 'orders' ? 'text-emerald-400 font-extrabold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Navigation className="w-5 h-5" />
            <span className="text-[10px]">Mission</span>
            {activeTab === 'orders' && (
              <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className="py-2 px-1 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-slate-300 cursor-pointer"
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px]">Dispatch</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
              activeTab === 'history' ? 'text-emerald-400 font-extrabold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px]">History</span>
            {activeTab === 'history' && (
              <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className={`py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
              activeTab === 'wallet' ? 'text-emerald-400 font-extrabold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px]">Wallet</span>
            {activeTab === 'wallet' && (
              <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
              activeTab === 'profile' ? 'text-emerald-400 font-extrabold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px]">Profile</span>
            {activeTab === 'profile' && (
              <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-emerald-400" />
            )}
          </button>

        </div>
      </nav>

    </div>
  );
}
