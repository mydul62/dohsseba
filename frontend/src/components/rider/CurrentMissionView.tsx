'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '@/lib/api-client';
import { useSocket } from '@/hooks/useSocket';
import { formatCurrency } from '@/utils/cn';
import {
  Phone,
  CheckCircle2,
  Package,
  MapPin,
  ShieldCheck,
  Wifi,
  WifiOff,
  Loader2,
  Store,
  Tag,
  ShoppingBag,
  User,
  ChevronDown,
  Navigation,
} from 'lucide-react';

interface CurrentMissionViewProps {
  mission: any;
  onMissionUpdate: () => void;
}

export function CurrentMissionView({ mission: initialMission, onMissionUpdate }: CurrentMissionViewProps) {
  const { socket } = useSocket();

  const [currentMission, setCurrentMission] = useState(initialMission);
  const mission = currentMission;

  useEffect(() => {
    setCurrentMission(initialMission);
  }, [initialMission]);

  // ── States ──────────────────────────────────────────────────────────────────
  const [isOnline, setIsOnline] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [showProductDetails, setShowProductDetails] = useState(true);

  // Offline GPS Queue Key
  const QUEUE_KEY = `gps_queue_${currentMission.id}`;

  // Customer Information
  const customerName =
    currentMission.customer?.name ||
    currentMission.guestName ||
    currentMission.user?.name ||
    'Resident Customer';

  const customerPhone =
    currentMission.customerPhone ||
    currentMission.customer?.phone ||
    currentMission.phone ||
    currentMission.address?.phone ||
    '01700000000';

  const customerAddressText =
    currentMission.deliveryAddress ||
    currentMission.guestAddress ||
    [
      currentMission.address?.line1,
      currentMission.address?.line2,
      currentMission.address?.area,
      currentMission.address?.city,
    ]
      .filter(Boolean)
      .join(', ') ||
    'Savar DOHS, Dhaka';

  // Products & Financial Breakdown
  const items = currentMission.items || currentMission.orderItems || currentMission.cartItems || [];
  
  const subTotal =
    currentMission.subTotal ||
    currentMission.subtotal ||
    items.reduce((sum: number, i: any) => sum + Number(i.price || i.unitPrice || 0) * Number(i.quantity || 1), 0);

  const deliveryFee = currentMission.deliveryFee ?? currentMission.deliveryCharge ?? 50;
  const discount = currentMission.discount ?? currentMission.couponDiscount ?? 0;
  const couponCode = currentMission.couponCode || currentMission.coupon?.code || null;
  const totalAmount = currentMission.totalAmount || subTotal + deliveryFee - discount;

  // ── Real-Time Socket Listener ───────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleLocationUpdate = (payload: any) => {
      if (!payload) return;
      const targetId = payload.orderId || payload.order?.id;
      if (targetId && (targetId === currentMission.id || targetId === initialMission.id)) {
        setCurrentMission((prev: any) => ({
          ...prev,
          ...payload.order,
          status: payload.status || payload.order?.status || prev.status,
        }));

        if (onMissionUpdate) {
          onMissionUpdate();
        }
      }
    };

    socket.on('ORDER_LOCATION_UPDATED', handleLocationUpdate);
    socket.on('ORDER_UPDATED', handleLocationUpdate);

    return () => {
      socket.off('ORDER_LOCATION_UPDATED', handleLocationUpdate);
      socket.off('ORDER_UPDATED', handleLocationUpdate);
    };
  }, [socket, currentMission.id, initialMission.id, onMissionUpdate]);

  // ── Offline Network Monitor ─────────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Direct Status Update Function ────────────────────────────────────────────
  const handleUpdateStatus = async (targetStatus: string) => {
    setActionLoading(true);
    setStatusMsg('');
    try {
      const res = await fetchApi<any>(`/rider/orders/${mission.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: targetStatus }),
      });
      if (res?.success) {
        setCurrentMission((prev: any) => ({ ...prev, status: targetStatus }));
        onMissionUpdate();
      } else {
        setStatusMsg(res?.message || 'Could not update status');
      }
    } catch (e: any) {
      setStatusMsg(e?.message || 'Failed to update mission status');
    } finally {
      setActionLoading(false);
    }
  };

  // Milestone Progression Sequence
  const handleNextMilestone = async () => {
    const statusSequence: Record<string, string> = {
      RIDER_ASSIGNED: 'ARRIVED_AT_STORE',
      ARRIVED_AT_STORE: 'PICKED_UP',
      PICKUP_STARTED: 'PICKED_UP',
      PICKED_UP: 'ON_THE_WAY',
      ON_THE_WAY: 'ARRIVED_DESTINATION',
      ARRIVED: 'DELIVERED',
      ARRIVED_DESTINATION: 'DELIVERED',
    };

    const nextStatus = statusSequence[mission.status];
    if (!nextStatus) return;
    await handleUpdateStatus(nextStatus);
  };

  const getMilestoneButtonLabel = (status: string) => {
    switch (status) {
      case 'RIDER_ASSIGNED':
        return '1. Arrived at Merchant Store';
      case 'ARRIVED_AT_STORE':
      case 'PICKUP_STARTED':
        return '2. Picked Up Order Package';
      case 'PICKED_UP':
        return '3. Start On The Way To Customer';
      case 'ON_THE_WAY':
        return '4. Arrived at Customer Doorstep';
      case 'ARRIVED':
      case 'ARRIVED_DESTINATION':
        return '5. Confirm Order Delivered & Paid';
      default:
        return 'Complete Mission Step';
    }
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-24 animate-in fade-in duration-300">

      {/* ── Status Bar ── */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-xs">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Wifi className="w-4 h-4" /> Real-time Dispatch Online
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-rose-400 font-bold">
              <WifiOff className="w-4 h-4 animate-pulse" /> Offline Mode
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-extrabold text-indigo-400 font-mono">
            ID: #{mission.id?.slice(-6).toUpperCase()}
          </span>
        </div>
      </div>

      {/* ── Main Mission Card ── */}
      <div className="bg-slate-900/95 border border-white/10 rounded-3xl p-5 md:p-6 space-y-5 shadow-2xl">

        {/* ── 1. CUSTOMER DETAILS CARD ── */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-black text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-400" /> Customer Information
            </span>
            <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              COD Cash on Delivery
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              <strong className="text-white text-base font-bold block">{customerName}</strong>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Phone: <span className="font-mono text-slate-200">{customerPhone}</span></p>
            </div>
            <a
              href={`tel:${customerPhone}`}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95 shrink-0"
            >
              <Phone className="w-4 h-4" /> Call Customer
            </a>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-xs flex items-start gap-2">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] text-slate-400 font-extrabold block">Delivery Address:</span>
              <p className="text-slate-200 font-bold text-xs mt-0.5">{customerAddressText}</p>
            </div>
          </div>
        </div>

        {/* ── 2. PRODUCT & FINANCIAL DETAILS CARD ── */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
          <button
            type="button"
            onClick={() => setShowProductDetails(!showProductDetails)}
            className="w-full flex items-center justify-between text-xs font-black text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-2"
          >
            <span className="flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-indigo-400" /> Order Products ({items.length} items)
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showProductDetails ? 'rotate-180' : ''}`} />
          </button>

          {/* Product Items List */}
          {showProductDetails && (
            <div className="space-y-2 pt-1">
              {items.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-2">No detailed product items available.</p>
              ) : (
                items.map((item: any, idx: number) => {
                  const pName = item.product?.name || item.name || item.title || `Item #${idx + 1}`;
                  const pImg = item.product?.images?.[0] || item.image || item.images?.[0];
                  const qty = Number(item.quantity || 1);
                  const price = Number(item.price || item.unitPrice || 0);
                  const itemTotal = qty * price;

                  return (
                    <div key={item.id || idx} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {pImg ? (
                          <img src={pImg} alt={pName} className="w-9 h-9 rounded-lg object-cover bg-slate-800 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate text-xs">{pName}</p>
                          <p className="text-[11px] text-slate-400">
                            {qty} x {formatCurrency(price)}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-white shrink-0 font-mono">{formatCurrency(itemTotal)}</span>
                    </div>
                  );
                })
              )}

              {/* Financial Breakdown Table */}
              <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Items Subtotal:</span>
                  <span className="font-semibold text-slate-200 font-mono">{formatCurrency(subTotal)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Delivery Charge:</span>
                  <span className="font-semibold text-emerald-400 font-mono">+{formatCurrency(deliveryFee)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-amber-400 font-bold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Coupon Discount {couponCode ? `(${couponCode})` : ''}:
                    </span>
                    <span className="font-mono">-{formatCurrency(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-white font-black text-sm pt-2 border-t border-slate-800">
                  <span>Total Cash to Collect:</span>
                  <span className="text-emerald-400 font-mono text-base">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 3. TRACKING STATUS UPDATE CONTROLS ── */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs font-black text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            <span>Tracking Status Update</span>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">Current: {mission.status}</span>
          </div>

          {/* Milestone Stepper */}
          <div className="grid grid-cols-5 gap-1.5 text-center">
            {[
              { id: 'RIDER_ASSIGNED', label: 'Accepted', icon: ShieldCheck },
              { id: 'ARRIVED_AT_STORE', label: 'At Store', icon: Store },
              { id: 'PICKED_UP', label: 'Picked Up', icon: Package },
              { id: 'ON_THE_WAY', label: 'On Way', icon: Navigation },
              { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
            ].map((step, idx) => {
              const currentStepIdx = (
                mission.status === 'RIDER_ASSIGNED' ? 0 :
                mission.status === 'ARRIVED_AT_STORE' || mission.status === 'PICKUP_STARTED' ? 1 :
                mission.status === 'PICKED_UP' ? 2 :
                mission.status === 'ON_THE_WAY' || mission.status === 'ARRIVED' || mission.status === 'ARRIVED_DESTINATION' ? 3 : 4
              );
              const isCompleted = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const StepIcon = step.icon;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleUpdateStatus(step.id)}
                  disabled={actionLoading}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-black'
                      : isCompleted
                      ? 'bg-slate-900 border-slate-700 text-slate-300'
                      : 'bg-slate-950 border-slate-850 text-slate-600 hover:text-slate-400'
                  }`}
                >
                  <StepIcon className="w-4 h-4" />
                  <span className="text-[9px] font-bold truncate w-full">{step.label}</span>
                </button>
              );
            })}
          </div>

          {/* Primary Action Next Step Button */}
          <button
            type="button"
            onClick={handleNextMilestone}
            disabled={actionLoading}
            className={`w-full py-4 px-6 font-black text-sm rounded-2xl shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 tracking-wide uppercase cursor-pointer ${
              mission.status === 'RIDER_ASSIGNED'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-950/80'
                : mission.status === 'ARRIVED_AT_STORE' || mission.status === 'PICKUP_STARTED'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-950/80'
                : mission.status === 'PICKED_UP'
                ? 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white shadow-blue-950/80'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-950/90 animate-pulse'
            }`}
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            <span>{getMilestoneButtonLabel(mission.status)}</span>
          </button>

          {statusMsg && <p className="text-xs text-rose-400 font-bold text-center">{statusMsg}</p>}
        </div>

      </div>
    </div>
  );
}
