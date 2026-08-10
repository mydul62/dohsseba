'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api-client';
import { formatCurrency } from '@/utils/cn';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSocket } from '@/hooks/useSocket';
import {
  Bike, Navigation, CheckCircle2, Clock, MapPin, Phone, Store,
  BellRing, DollarSign, Package, Check, X, Loader2, Wifi, WifiOff,
  ExternalLink, Sparkles, TrendingUp, Calendar, Award, AlertTriangle, User,
  Radio, Search, Filter, ShieldCheck, Wallet, ChevronRight, Activity, Compass, LogOut
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
  const isBn = language === 'BN';

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Navigation Tab State ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'orders' | 'history' | 'wallet' | 'notifications' | 'profile'>(initialTab);

  // ── Core Rider State ──────────────────────────────────────────────────────
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [togglingDuty, setTogglingDuty] = useState<boolean>(false);
  const [riderProfile, setRiderProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // ── Orders State ──────────────────────────────────────────────────────────
  const [activeMissions, setActiveMissions] = useState<any[]>([]);
  const [openOrders, setOpenOrders] = useState<any[]>([]);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [incomingOrderAlert, setIncomingOrderAlert] = useState<any | null>(null);

  // ── Order Detail Bottom Sheet Modal ───────────────────────────────────────
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);

  // ── Wallet & Withdraw State ───────────────────────────────────────────────
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawMethod, setWithdrawMethod] = useState<'bkash' | 'nagad' | 'bank'>('bkash');
  const [withdrawAccNo, setWithdrawAccNo] = useState<string>('');
  const [requestingWithdraw, setRequestingWithdraw] = useState<boolean>(false);

  // ── Notifications State ───────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: 'n1',
      title: 'Welcome to DOHS Sheba Express Dispatch',
      message: 'Keep your duty status ONLINE to receive automatic delivery dispatches.',
      time: '10 mins ago',
      unread: true,
      type: 'system',
    },
    {
      id: 'n2',
      title: 'Earnings Credited ৳450',
      message: 'Weekly delivery incentive bonus has been added to your Available Wallet Balance.',
      time: '2 hours ago',
      unread: false,
      type: 'payment',
    },
  ]);

  // ── OTP Completion Modal State ────────────────────────────────────────────
  const [otpModalOrder, setOtpModalOrder] = useState<any | null>(null);
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string>('');

  // ── History Filter & Search State ─────────────────────────────────────────
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [historySearch, setHistorySearch] = useState<string>('');

  // Load All Rider Data
  const loadRiderData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes, actRes, opRes, hRes, wRes] = await Promise.all([
        fetchApi<any>('/rider/profile').catch(() => null),
        fetchApi<any>('/rider/stats').catch(() => null),
        fetchApi<any>('/rider/orders/active').catch(() => null),
        fetchApi<any>('/rider/orders/open').catch(() => null),
        fetchApi<any>('/rider/orders/history?limit=30').catch(() => null),
        fetchApi<any>('/rider/withdraw').catch(() => null),
      ]);

      if (pRes?.success && pRes.data) {
        setRiderProfile(pRes.data);
        setIsOnline(pRes.data.isOnline ?? pRes.data.isAvailable ?? true);
      }

      if (sRes?.success && sRes.data) setStats(sRes.data);

      if (actRes?.success && Array.isArray(actRes.data)) {
        setActiveMissions(actRes.data);
      }

      if (opRes?.success && Array.isArray(opRes.data)) {
        setOpenOrders(opRes.data);
        if (opRes.data.length > 0) {
          setIncomingOrderAlert(opRes.data[0]);
          triggerOrderAlert();
        }
      }

      if (hRes?.success && Array.isArray(hRes.data)) setOrderHistory(hRes.data);
      if (wRes?.success && Array.isArray(wRes.data)) setWithdrawHistory(wRes.data);
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
      setIncomingOrderAlert(order);
      setOpenOrders((prev) => [order, ...prev]);
      triggerOrderAlert();
    });

    socket.on('order_status_updated', () => {
      loadRiderData();
    });

    return () => {
      socket.off('new_order_dispatched');
      socket.off('order_status_updated');
    };
  }, [socket, user?.id, loadRiderData]);

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
      setActionMsg(nextDuty ? 'You are NOW ONLINE. Receiving new orders...' : 'Duty set to OFFLINE.');
      setTimeout(() => setActionMsg(''), 3000);
    } finally {
      setTogglingDuty(false);
    }
  };

  // Accept Order
  const handleAcceptOrder = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const res = await fetchApi<any>(`/rider/orders/${orderId}/accept`, {
        method: 'POST',
      }).catch(() => null);

      if (res?.success) {
        setIncomingOrderAlert(null);
        setOpenOrders((prev) => prev.filter((o) => o.id !== orderId));
        setActionMsg('Order Accepted! Added to your delivery queue.');
        setTimeout(() => setActionMsg(''), 3000);
        loadRiderData();
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Single Primary Action Button Handler for Order States
  const handleUpdateOrderStatus = async (orderId: string, targetStatus: string) => {
    if (targetStatus === 'COMPLETED') {
      const targetOrder = activeMissions.find((m) => m.id === orderId);
      setOtpModalOrder(targetOrder);
      setOtpInput('');
      setOtpError('');
      return;
    }

    setActionLoading(orderId);
    try {
      const res = await fetchApi<any>(`/rider/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: targetStatus }),
      }).catch(() => null);

      if (res?.success) {
        setActionMsg(`Order status updated to ${targetStatus}`);
        setTimeout(() => setActionMsg(''), 3000);
        loadRiderData();
      }
    } finally {
      setActionLoading(null);
    }
  };

  // OTP Verification Submit
  const handleVerifyOtpAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpModalOrder) return;

    if (!otpInput || otpInput.trim().length < 4) {
      setOtpError('Please enter valid 4-digit OTP provided by customer.');
      return;
    }

    setActionLoading(otpModalOrder.id);
    setOtpError('');

    try {
      const res = await fetchApi<any>(`/rider/orders/${otpModalOrder.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED', otp: otpInput }),
      }).catch(() => null);

      if (res?.success) {
        setOtpModalOrder(null);
        setActionMsg('Delivery Completed Successfully! Earnings credited to wallet.');
        setTimeout(() => setActionMsg(''), 4000);
        loadRiderData();
      } else {
        setOtpError(res?.message || 'Invalid OTP code. Please ask customer for correct 4-digit code.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Withdraw Funds Submit
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
        setActionMsg('Withdrawal Request Submitted to Admin.');
        setTimeout(() => setActionMsg(''), 4000);
        loadRiderData();
      }
    } finally {
      setRequestingWithdraw(false);
    }
  };

  // View Mode: Live GPS Map vs Task Card
  const [viewMode, setViewMode] = useState<'map' | 'card'>('map');

  // Multi-Order Priority Sorting: Pinned Delivery vs Queued
  const sortedMissions = [...activeMissions].sort((a, b) => {
    // Active delivery statuses take top priority
    const statePriority: Record<string, number> = {
      ARRIVED_CUSTOMER: 1,
      DELIVERING: 2,
      PICKED_UP: 3,
      ARRIVED_SELLER: 4,
      ASSIGNED: 5,
    };
    const pA = statePriority[a.status] || 10;
    const pB = statePriority[b.status] || 10;
    return pA - pB;
  });

  const pinnedCurrentDelivery = sortedMissions.length > 0 ? sortedMissions[0] : null;
  const queuedNextOrders = sortedMissions.length > 1 ? sortedMissions.slice(1) : [];

  // Filtered History
  const filteredHistory = orderHistory.filter((item) => {
    if (historyFilter !== 'ALL' && item.status !== historyFilter) return false;
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      const idMatch = (item.id || '').toLowerCase().includes(q);
      const nameMatch = (item.user?.name || item.customerName || '').toLowerCase().includes(q);
      const addressMatch = (item.address?.line1 || item.address || '').toLowerCase().includes(q);
      if (!idMatch && !nameMatch && !addressMatch) return false;
    }
    return true;
  });

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-28">
      {/* ── TOP BAR: Rider Status & Duty Toggle ───────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4 shadow-xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {/* Duty Switch */}
          <button
            type="button"
            onClick={handleToggleDuty}
            disabled={togglingDuty}
            className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-2 border cursor-pointer ${
              isOnline
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {togglingDuty ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            )}
            <span>{isOnline ? 'ONLINE DUTY' : 'OFFLINE'}</span>
          </button>

          {/* Current Status Pill */}
          <div className="text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
            <span className="text-xs font-black text-slate-200">
              {activeMissions.length > 0
                ? `${activeMissions.length} Active Delivery`
                : isOnline
                ? 'Ready for Orders'
                : 'Off Duty'}
            </span>
          </div>

          {/* Today's Earnings Badge */}
          <div className="px-3.5 py-1.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-right">
            <span className="text-[9px] font-bold text-indigo-300 uppercase block">Today's Earnings</span>
            <span className="text-xs font-black text-white">
              {formatCurrency(stats?.todayEarnings || stats?.totalEarnings || 0)}
            </span>
          </div>
        </div>

        {actionMsg && (
          <div className="max-w-md mx-auto mt-2 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center animate-in fade-in">
            {actionMsg}
          </div>
        )}
      </header>

      {/* ── MAIN CONTENT AREA (Tab Driven) ────────────────────────────────────── */}
      <main className="max-w-md mx-auto p-4 space-y-6">

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1: ORDERS / TASK MANAGER (PRIMARY VIEW)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <div className="space-y-6">

            {/* INCOMING BROADCAST DISPATCH ALERT */}
            {incomingOrderAlert && (
              <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-2 border-amber-500 shadow-2xl space-y-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 animate-ping" /> New Dispatch Request
                  </span>
                  <button
                    onClick={() => setIncomingOrderAlert(null)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="font-black text-white text-lg">{incomingOrderAlert.serviceName || 'Express Delivery Order'}</h3>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>From: <strong>{incomingOrderAlert.sellerName || 'DOHS Merchant'}</strong></span>
                    <span className="text-emerald-400 font-extrabold">+৳{incomingOrderAlert.deliveryFee || 85}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAcceptOrder(incomingOrderAlert.id)}
                  disabled={actionLoading === incomingOrderAlert.id}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                >
                  {actionLoading === incomingOrderAlert.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Accept Order Now (+৳{incomingOrderAlert.deliveryFee || 85})</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* SECTION 1: PINNED CURRENT DELIVERY (#1 Priority) */}
            {pinnedCurrentDelivery ? (
              <CurrentMissionView mission={pinnedCurrentDelivery} onMissionUpdate={loadRiderData} />
            ) : (
              <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
                <Bike className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="font-extrabold text-base text-white">No Active Delivery Right Now</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {isOnline
                    ? 'You are online and ready for automatic order dispatches.'
                    : 'Turn your duty ONLINE at the top to receive new orders.'}
                </p>
              </div>
            )}

            {/* SECTION 2: NEXT ORDERS QUEUE (MULTIPLE ORDER MANAGEMENT) */}
            {queuedNextOrders.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-wider px-1">
                  <span>NEXT ORDERS QUEUE ({queuedNextOrders.length})</span>
                  <span className="text-[10px] text-slate-500">Auto-Sorted by Priority</span>
                </div>

                <div className="space-y-3">
                  {queuedNextOrders.map((ord, idx) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-black text-xs flex items-center justify-center">
                            #{idx + 2}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px] uppercase border border-slate-700">
                            {ord.status}
                          </span>
                        </div>
                        <span className="font-black text-xs text-emerald-400">+৳{ord.deliveryFee || 85}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-white">{ord.user?.name || ord.customerName || 'Customer'}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{ord.address?.line1 || ord.address || 'DOHS Location'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedOrderDetails(ord)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2: HISTORY
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-lg text-white">Delivery Order History</h2>
              <span className="text-xs font-bold text-slate-400">{filteredHistory.length} Orders</span>
            </div>

            {/* History Search & Filter Bar */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search history by Order ID or address..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white placeholder-slate-500"
                />
              </div>

              <div className="flex items-center gap-2">
                {['ALL', 'COMPLETED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setHistoryFilter(st as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                      historyFilter === st
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* History List */}
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-400">#{item.id?.slice(-8)}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {item.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{item.serviceName || 'Express Delivery'}</span>
                    <span className="font-black text-emerald-400">+৳{item.deliveryFee || 85}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{item.address?.line1 || item.address}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 3: WALLET & PAYOUT FINANCIALS
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'wallet' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-lg text-white">Rider Financial Wallet</h2>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(true)}
                className="px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-md"
              >
                + Request Payout
              </button>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Available Balance</span>
                <div className="text-xl font-black text-emerald-400">
                  {formatCurrency(stats?.availableBalance || stats?.totalEarnings || 0)}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Balance</span>
                <div className="text-xl font-black text-amber-400">
                  {formatCurrency(stats?.pendingBalance || 0)}
                </div>
              </div>
            </div>

            {/* Payout History */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Withdrawal History</h3>
              {withdrawHistory.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
                  No payout withdrawal requests submitted yet.
                </div>
              ) : (
                withdrawHistory.map((w) => (
                  <div key={w.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">৳{w.amount} via {w.paymentMethod}</span>
                      <span className="text-[10px] text-slate-500">{new Date(w.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {w.status || 'PENDING'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 4: NOTIFICATIONS
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h2 className="font-black text-lg text-white">System Broadcasts & Notifications</h2>
            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-400">{n.title}</span>
                    <span className="text-[10px] text-slate-500">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-300">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 5: RIDER PROFILE & SETTINGS
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <div className="space-y-5">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-center">
              <div className="w-20 h-20 rounded-full bg-indigo-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-xl">
                {user?.name?.[0] || 'R'}
              </div>

              <div>
                <h3 className="font-black text-lg text-white">{user?.name || 'Assigned Rider'}</h3>
                <p className="text-xs text-slate-400">{user?.phone || '+880 1711-223344'}</p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  NID & License Verified
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-slate-400 uppercase tracking-wider">Assigned Vehicle Info</h4>
              <div className="flex justify-between text-slate-300">
                <span>Vehicle Type:</span>
                <span className="font-bold text-white">Motorbike / Express Cycle</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Plate Number:</span>
                <span className="font-mono font-bold text-white">DHAKA METRO-HA 14-8891</span>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="w-full py-3.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold text-xs border border-rose-500/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out Rider Session</span>
            </button>
          </div>
        )}
      </main>

      {/* ── EXPANDED ORDER DETAILS BOTTOM SHEET MODAL ─────────────────────────── */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base">Order Details #{selectedOrderDetails.id?.slice(-8)}</h3>
              <button onClick={() => setSelectedOrderDetails(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 space-y-1">
                <span className="text-slate-400 font-bold block">Customer:</span>
                <span className="font-extrabold text-white text-sm block">{selectedOrderDetails.user?.name || 'Customer'}</span>
                <span className="text-slate-300 block">{selectedOrderDetails.user?.phone || selectedOrderDetails.phone}</span>
                <span className="text-slate-300 block pt-1">{selectedOrderDetails.address?.line1 || selectedOrderDetails.address}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 space-y-1">
                <span className="text-slate-400 font-bold block">Delivery Fee Earnings:</span>
                <span className="font-black text-emerald-400 text-base block">+৳{selectedOrderDetails.deliveryFee || 85}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrderDetails(null)}
              className="w-full py-3 rounded-2xl bg-slate-800 text-white font-bold text-xs"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* ── OTP COMPLETION MODAL ──────────────────────────────────────────────── */}
      {otpModalOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleVerifyOtpAndComplete} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base">Verify Customer OTP</h3>
              <button type="button" onClick={() => setOtpModalOrder(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Ask customer <strong className="text-white">{otpModalOrder.user?.name || 'Customer'}</strong> for the 4-digit completion OTP sent to their phone.
              </p>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">4-Digit OTP Code</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. 4401"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full h-12 text-center text-xl font-mono font-black tracking-widest rounded-2xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {otpError && (
                <p className="text-xs font-bold text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  {otpError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={actionLoading === otpModalOrder.id}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-xl flex items-center justify-center gap-2"
            >
              {actionLoading === otpModalOrder.id && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Verify & Complete Delivery</span>
            </button>
          </form>
        </div>
      )}

      {/* ── WITHDRAWAL REQUEST MODAL ──────────────────────────────────────────── */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleRequestWithdraw} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
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
                  className="w-full h-11 px-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Payout Channel</label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value as any)}
                  className="w-full h-11 px-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-white font-bold"
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
                  className="w-full h-11 px-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-white font-bold"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={requestingWithdraw}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-xl flex items-center justify-center gap-2"
            >
              {requestingWithdraw && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Submit Payout Request</span>
            </button>
          </form>
        </div>
      )}

      {/* ── 5-TAB MOBILE BOTTOM NAVIGATION BAR (FIXED BOTTOM) ─────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-2 shadow-2xl">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] font-black">Orders</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px] font-black">History</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'wallet' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] font-black">Wallet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all relative ${
              activeTab === 'notifications' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BellRing className="w-5 h-5" />
            <span className="text-[10px] font-black">Alerts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-black">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
