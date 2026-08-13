'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api-client';
import { useSocket } from '@/hooks/useSocket';
import { formatCurrency } from '@/utils/cn';
import {
  Phone,
  CheckCircle2,
  Package,
  MapPin,
  Wifi,
  WifiOff,
  Loader2,
  Tag,
  ShoppingBag,
  User,
  ChevronDown,
  Navigation,
  Eye,
  Truck,
  Check,
  X,
  Printer,
} from 'lucide-react';
import { PosReceiptPrinter } from '@/components/common/PosReceiptPrinter';

interface CurrentMissionViewProps {
  mission: any;
  onMissionUpdate: () => void;
  onOpenDetails?: (order: any) => void;
  isPinned?: boolean;
}

export function CurrentMissionView({ mission: initialMission, onMissionUpdate, onOpenDetails, isPinned = true }: CurrentMissionViewProps) {
  const { socket } = useSocket();

  const [currentMission, setCurrentMission] = useState(initialMission);
  const mission = currentMission;

  useEffect(() => {
    setCurrentMission(initialMission);
  }, [initialMission]);

  const [isOnline, setIsOnline] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [showProductDetails, setShowProductDetails] = useState(false);

  const customerName =
    (currentMission.notes && currentMission.notes.match(/Name:\s*([^.\n]+)/i)?.[1]?.trim()) ||
    (currentMission.customerName && currentMission.customerName !== 'Guest Customer' ? currentMission.customerName : null) ||
    (currentMission.customer?.name && currentMission.customer.name !== 'Guest Customer' ? currentMission.customer.name : null) ||
    currentMission.guestName ||
    currentMission.customerName ||
    currentMission.customer?.name ||
    'Resident Customer';

  const customerPhone =
    currentMission.customerPhone ||
    currentMission.customer?.phone ||
    currentMission.phone ||
    currentMission.address?.phone ||
    currentMission.user?.phone ||
    (currentMission.notes && currentMission.notes.match(/Phone:\s*([0-9\+\-\s]+)/i)?.[1]?.trim()) ||
    'N/A';

  const customerAddressText =
    currentMission.guestAddress ||
    currentMission.deliveryAddress ||
    currentMission.address?.line1 ||
    (currentMission.notes && currentMission.notes.match(/Address:\s*([^.\n]+)/i)?.[1]?.trim()) ||
    '';

  // Products & Financial Breakdown
  const items = currentMission.items || currentMission.orderItems || currentMission.cartItems || [];
  
  const subTotal =
    currentMission.subTotal ||
    currentMission.subtotal ||
    items.reduce((sum: number, i: any) => sum + Number(i.price || i.unitPrice || 0) * Number(i.quantity || 1), 0);

  const deliveryFee = currentMission.deliveryFee ?? currentMission.deliveryCharge ?? 50;
  const commPercent = currentMission.riderCommissionPercent ?? 80;
  const riderIncome = currentMission.netEarning ?? currentMission.earnings ?? Math.round((deliveryFee * commPercent) / 100);
  const discount = currentMission.discount ?? currentMission.couponDiscount ?? 0;
  const couponCode = currentMission.couponCode || currentMission.coupon?.code || null;
  const totalAmount = currentMission.totalAmount || subTotal + deliveryFee - discount;

  // Real-Time Socket Listener
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

  // Offline Network Monitor
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

  // Direct Status Update Function
  const handleUpdateStatus = async (targetStatus: string, note?: string) => {
    setActionLoading(true);
    setStatusMsg('');
    try {
      const res = await fetchApi<any>(`/rider/orders/${mission.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: targetStatus, note }),
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

  const handleCancelMission = async () => {
    const reason = window.prompt('Please enter the reason for cancelling this order (e.g. Customer unreachable / Wrong address):');
    if (reason === null) return;
    const note = reason.trim() || 'Rider cancelled order without extra notes.';
    await handleUpdateStatus('CANCELLED', note);
  };

  // 4 Milestone Progression Sequence
  const handleNextMilestone = async () => {
    const statusSequence: Record<string, string> = {
      RIDER_ASSIGNED: 'PICKED_UP',
      ARRIVED_AT_STORE: 'PICKED_UP',
      PICKUP_STARTED: 'PICKED_UP',
      ACCEPTED: 'PICKED_UP',
      PICKED_UP: 'ON_THE_WAY',
      ON_THE_WAY: 'DELIVERED',
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
      case 'ARRIVED_AT_STORE':
      case 'ACCEPTED':
        return '→ Mark Picked Up';
      case 'PICKUP_STARTED':
      case 'PICKED_UP':
        return '→ Mark On the way';
      case 'ON_THE_WAY':
      case 'ARRIVED':
      case 'ARRIVED_DESTINATION':
        return '→ Mark Delivered';
      default:
        return '✓ Delivered';
    }
  };

  const getStageLabel = (status: string) => {
    if (status === 'RIDER_ASSIGNED' || status === 'ACCEPTED' || status === 'ARRIVED_AT_STORE') return 'Accepted';
    if (status === 'PICKED_UP' || status === 'PICKUP_STARTED') return 'Picked Up';
    if (status === 'ON_THE_WAY' || status === 'ARRIVED' || status === 'ARRIVED_DESTINATION' || status === 'DELIVERING') return 'On the way';
    return 'Delivered';
  };

  const currentStageIndex = (() => {
    const st = getStageLabel(mission.status);
    if (st === 'Accepted') return 0;
    if (st === 'Picked Up') return 1;
    if (st === 'On the way') return 2;
    return 3;
  })();

  return (
    <div className="bg-[#0F172A] border border-blue-500/40 rounded-3xl p-5 space-y-4 shadow-2xl relative">
      
      {/* Card Top Header: PINNED #1 | ORDER #ID | Earnings */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPinned && (
            <span className="px-2.5 py-1 rounded-md bg-blue-600/30 text-blue-400 font-extrabold text-[10px] uppercase tracking-wider border border-blue-500/40">
              PINNED #1
            </span>
          )}
          <span className="text-xs font-mono font-bold text-slate-400">
            ORDER #{mission.id?.slice(-6).toUpperCase() || 'S3107C'}
          </span>
        </div>

        <span className="text-base font-black text-emerald-400 font-mono">
          +৳{riderIncome}
        </span>
      </div>

      {/* Customer Information Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base leading-snug">{customerName}</h3>
            <p className="text-xs font-mono text-slate-400">{customerPhone}</p>
          </div>
        </div>

        {/* Action Buttons: Phone Call, POS Print & Eye Details Icon */}
        <div className="flex items-center gap-2">
          <a
            href={`tel:${customerPhone}`}
            className="w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700/80 flex items-center justify-center transition-all active:scale-95"
            title="Call Customer"
          >
            <Phone className="w-4 h-4" />
          </a>
          <PosReceiptPrinter
            order={mission}
            buttonText="🖨️"
            buttonClassName="w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700/80 flex items-center justify-center transition-all active:scale-95"
          />
          <button
            type="button"
            onClick={() => onOpenDetails?.(mission)}
            className="w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700/80 flex items-center justify-center transition-all active:scale-95"
            title="View Order Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleCancelMission}
            disabled={actionLoading}
            className="w-9 h-9 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 flex items-center justify-center transition-all active:scale-95"
            title="Cancel Order"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delivery Address Box */}
      <div className="p-3.5 rounded-2xl bg-[#0B1120] border border-slate-800/80 text-xs flex items-start gap-2.5">
        <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-slate-300 font-medium leading-relaxed">
          <strong className="text-slate-200 font-bold">Delivery address — </strong>
          {customerAddressText}
        </p>
      </div>

      {/* TRACKING STATUS STEPPER (4 STAGES ONLY) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">TRACKING STATUS</span>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-extrabold border border-blue-500/30">
            {getStageLabel(mission.status)}
          </span>
        </div>

        {/* Stepper Progress Bar */}
        <div className="flex items-center justify-between relative px-2 py-2">
          {/* Connector Line */}
          <div className="absolute left-6 right-6 top-5 h-0.5 bg-slate-800 -z-0" />
          <div
            className="absolute left-6 top-5 h-0.5 bg-blue-500 -z-0 transition-all duration-500"
            style={{ width: `${(currentStageIndex / 3) * 100}%` }}
          />

          {[
            { id: 'ACCEPTED', label: 'Accepted' },
            { id: 'PICKED_UP', label: 'Picked Up' },
            { id: 'ON_THE_WAY', label: 'On the way' },
            { id: 'DELIVERED', label: 'Delivered' },
          ].map((step, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(step.id)}
                  disabled={actionLoading}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
                      : isCurrent
                      ? 'bg-[#0F172A] border-2 border-blue-500 text-blue-400 ring-4 ring-blue-500/20'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                </button>
                <span className={`text-[10px] font-bold ${isCurrent ? 'text-blue-400 font-extrabold' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mark Next Stage Button */}
        {mission.status !== 'DELIVERED' && mission.status !== 'COMPLETED' && (
          <button
            type="button"
            onClick={handleNextMilestone}
            disabled={actionLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-xl shadow-blue-950/80 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            <span>{getMilestoneButtonLabel(mission.status)}</span>
          </button>
        )}

        {statusMsg && <p className="text-xs text-rose-400 font-bold text-center mt-1">{statusMsg}</p>}
      </div>

    </div>
  );
}
