'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '@/lib/api-client';
import { useAuthStore } from '@/store/useAuthStore';
import { useSocket } from '@/hooks/useSocket';
import { formatCurrency } from '@/utils/cn';
import {
  Wrench,
  Clock,
  Users,
  RefreshCw,
  MapPin,
  Calendar,
  Phone,
  X,
  Check,
  ChevronRight,
  AlertCircle,
  Plus,
  LayoutDashboard,
  UserCheck,
  Loader2,
  MessageCircle,
  Trash2,
} from 'lucide-react';
import {
  fetchProviderSlots,
  createServiceSlot,
  updateServiceSlot,
  toggleBlockServiceSlot,
  deleteServiceSlot,
  ServiceSlotItem,
} from '@/services/serviceSlot';

// ΓöÇΓöÇΓöÇ Design tokens ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const BG        = '#0a0b14';
const PANEL     = '#12131f';
const PANEL_ALT = '#171829';
const BORDER    = '#242539';
const PURPLE    = '#7c6ff0';

// ΓöÇΓöÇΓöÇ Status config ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const STATUS_CFG: Record<string, { label: string; pill: string }> = {
  PENDING:             { label: 'New',        pill: 'bg-amber-500/20 text-amber-300' },
  CONFIRMED:           { label: 'Confirmed',  pill: 'bg-blue-500/20 text-blue-300' },
  TECHNICIAN_ASSIGNED: { label: 'Assigned',   pill: 'bg-purple-500/20 text-purple-300' },
  TECHNICIAN_ON_THE_WAY:{ label: 'On The Way',pill: 'bg-indigo-500/20 text-indigo-300' },
  IN_PROGRESS:         { label: 'In Progress',pill: 'bg-sky-500/20 text-sky-300' },
  WORK_COMPLETED:      { label: 'Completed',  pill: 'bg-emerald-500/20 text-emerald-300' },
  CUSTOMER_CONFIRMED:  { label: 'Verified Γ£ô', pill: 'bg-emerald-500/20 text-emerald-300' },
  COMPLETED:           { label: 'Done',       pill: 'bg-emerald-500/20 text-emerald-300' },
  CANCELLED:           { label: 'Cancelled',  pill: 'bg-red-500/20 text-red-300' },
};

const STAGES = [
  { id: 'PENDING',             label: 'New' },
  { id: 'CONFIRMED',           label: 'Confirmed' },
  { id: 'TECHNICIAN_ASSIGNED', label: 'Assigned' },
  { id: 'IN_PROGRESS',         label: 'In progress' },
  { id: 'WORK_COMPLETED',      label: 'Compl.' },
];

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] || { label: status, pill: 'bg-slate-500/20 text-slate-300' };
  return <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${cfg.pill}`}>{cfg.label}</span>;
}

// ΓöÇΓöÇΓöÇ Mobile Booking Detail Bottom Sheet ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function MobileDetailSheet({
  booking,
  technicians,
  onClose,
  onStatusChange,
  onAssignTechnician,
  onDeleteBooking,
  updating,
  assigning,
}: {
  booking: any;
  technicians: any[];
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onAssignTechnician: (id: string, tech: any) => void;
  onDeleteBooking?: (id: string) => void;
  updating: boolean;
  assigning: boolean;
}) {
  const currentIdx = STAGES.findIndex((s) => s.id === booking.status);
  const techName   = booking.technicianName || booking.technician?.name;
  const techPhone  = booking.technicianPhone || booking.technician?.phone;
  const slotTime   = booking.slot ? `${booking.slot.startTime} ΓÇô ${booking.slot.endTime}` : '';

  // Next context-aware action
  const getNextAction = () => {
    if (booking.status === 'TECHNICIAN_ASSIGNED') return { label: 'Mark tech on the way', next: 'TECHNICIAN_ON_THE_WAY' };
    if (booking.status === 'TECHNICIAN_ON_THE_WAY') return { label: 'Mark work in progress', next: 'IN_PROGRESS' };
    if (booking.status === 'IN_PROGRESS') return { label: 'Mark work completed', next: 'WORK_COMPLETED' };
    if (booking.status === 'PENDING') return { label: 'Accept request', next: 'CONFIRMED' };
    if (booking.status === 'CONFIRMED') return { label: 'Ready to assign', next: null };
    return null;
  };
  const nextAction = getNextAction();

  return (
    <div className="fixed inset-0 z-[60] flex items-end" style={{ background: 'rgba(0,0,0,0.7)' }}>
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet */}
      <div
        className="relative w-full rounded-t-3xl overflow-y-auto max-h-[92vh] pb-6"
        style={{ background: PANEL, border: `1px solid ${BORDER}` }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: BORDER }} />
        </div>

        {/* Header */}
        <div className="px-4 pt-2 pb-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md" style={{ background: `${PURPLE}20`, color: PURPLE }}>
                #{booking.id.slice(-7).toUpperCase()}
              </span>
              <StatusPill status={booking.status} />
            </div>
            <div className="flex items-center gap-2">
              {onDeleteBooking && (
                <button
                  type="button"
                  onClick={() => onDeleteBooking(booking.id)}
                  className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 transition-all cursor-pointer"
                  title="Delete Request"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400" style={{ background: PANEL_ALT }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <h2 className="text-lg font-black text-white leading-tight mt-2">
            {booking.service?.title || 'Home Maintenance Service'}
          </h2>
        </div>

        {/* Status stepper */}
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-3">Update Status</p>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {STAGES.map((stage, idx) => {
              const isCurrent = booking.status === stage.id;
              const isPassed  = currentIdx > idx;
              let style: React.CSSProperties = { background: PANEL_ALT, borderColor: BORDER, color: '#94a3b8' };
              if (isCurrent) style = { background: PURPLE, borderColor: PURPLE, color: '#fff', fontWeight: 900 };
              else if (isPassed) style = { background: 'rgba(52,211,153,0.12)', borderColor: 'rgba(52,211,153,0.3)', color: '#34d399', fontWeight: 700 };

              return (
                <button
                  key={stage.id}
                  disabled={updating}
                  onClick={() => onStatusChange(booking.id, stage.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs shrink-0 cursor-pointer transition-all disabled:opacity-50"
                  style={style}
                >
                  {isPassed && <Check className="w-3 h-3 stroke-[3]" />}
                  {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  <span>{stage.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer & Location */}
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-3">Customer & Location</p>
          <div className="space-y-2 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0" style={{ color: PURPLE }} />
              <span>{booking.address?.line1 || 'Mohakhali DOHS Residence'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Scheduled {new Date(booking.scheduledAt).toLocaleDateString('en-BD', { month: 'numeric', day: 'numeric', year: 'numeric' })}, {new Date(booking.scheduledAt).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {slotTime && (
              <div className="flex items-center gap-2 font-bold" style={{ color: '#fb923c' }}>
                <Clock className="w-4 h-4 shrink-0" style={{ color: '#fb923c' }} />
                <span>Booked slot: {slotTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Assigned Rider / Technician list */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-3">Assigned Rider</p>
          <div className="space-y-2">
            {technicians.map((tech) => {
              const isAssigned =
                booking.technicianId === tech.id ||
                (booking.technicianName && tech.name && booking.technicianName.toLowerCase() === tech.name.toLowerCase());
              const initials = tech.name ? tech.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'TN';

              return (
                <div
                  key={tech.id}
                  onClick={() => { if (!assigning) onAssignTechnician(booking.id, tech); }}
                  className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all"
                  style={{
                    background: isAssigned ? `${PURPLE}20` : PANEL_ALT,
                    border: `1px solid ${isAssigned ? PURPLE + '50' : BORDER}`,
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold text-white shrink-0"
                    style={{ background: isAssigned ? PURPLE : '#242539' }}
                  >
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-sm text-white truncate">{tech.name}</p>
                    <p className="text-[11px] font-medium" style={{ color: isAssigned ? '#a78bfa' : '#64748b' }}>
                      {isAssigned ? 'On a job' : 'Available'}
                    </p>
                  </div>

                  {/* Checkmark */}
                  {isAssigned && (
                    <Check className="w-4 h-4 shrink-0" style={{ color: PURPLE }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-4 pt-4 flex items-center gap-3">
          <button
            className="flex-1 py-3.5 rounded-2xl border text-sm font-extrabold text-slate-200 transition-all"
            style={{ background: PANEL_ALT, borderColor: BORDER }}
            onClick={() => {
              if (booking.customer?.phone) window.location.href = `tel:${booking.customer.phone}`;
            }}
          >
            Contact customer
          </button>

          {nextAction && nextAction.next && (
            <button
              disabled={updating}
              onClick={() => onStatusChange(booking.id, nextAction.next!)}
              className="flex-1 py-3.5 rounded-2xl text-sm font-extrabold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              style={{ background: PURPLE }}
            >
              {updating && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{nextAction.label}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Mobile Dashboard Tab ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function DashboardTab({
  bookings, stats, slots, loading,
  onOpenSheet,
  setMobileTab,
}: {
  bookings: any[];
  stats: any;
  slots: ServiceSlotItem[];
  loading: boolean;
  onOpenSheet: (b: any) => void;
  setMobileTab: (t: string) => void;
}) {
  const totalAvailable = slots.reduce((a, s) => a + Math.max(0, s.maxCapacity - s.bookedCapacity), 0);
  const needsAttention = bookings.filter((b) => b.status === 'PENDING' || (b.status === 'CONFIRMED' && !b.technicianName && !b.technician?.name));

  return (
    <div className="space-y-6">
      {/* Service Operations Control info card */}
      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${PURPLE}25` }}>
          <Wrench className="w-5 h-5" style={{ color: PURPLE }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-white text-sm">Service Operations Control</p>
          <p className="text-xs text-slate-400 mt-0.5">Manage requests, time slots and technician assignments in real time.</p>
          <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-extrabold px-2.5 py-1 rounded-full" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Service Manager Portal
          </span>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMobileTab('requests')}
            className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
            style={{ background: PANEL, border: `1px solid ${BORDER}` }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${PURPLE}20` }}>
              <Wrench className="w-4 h-4" style={{ color: PURPLE }} />
            </div>
            <span className="font-extrabold text-sm text-white">Bookings queue</span>
          </button>

          <button
            onClick={() => setMobileTab('slots')}
            className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
            style={{ background: PANEL, border: `1px solid ${BORDER}` }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(251,146,60,0.15)' }}>
              <Clock className="w-4 h-4 text-orange-400" />
            </div>
            <span className="font-extrabold text-sm text-white">Time slots</span>
          </button>
        </div>
      </div>

      {/* Today at a glance ΓÇö 2├ù2 stat grid */}
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-3">Today at a glance</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'New requests',   value: stats.pendingCount,                    color: 'text-amber-400' },
            { label: 'Active jobs',    value: stats.activeCount,                     color: 'text-blue-400' },
            { label: 'Available slots',value: `${totalAvailable} techs`,             color: 'text-emerald-400' },
            { label: 'Total revenue',  value: formatCurrency(stats.totalEarnings),   color: 'text-white' },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-2xl space-y-1" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Needs attention */}
      {needsAttention.length > 0 && (
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-3">Needs Attention</p>
          <div className="space-y-3">
            {needsAttention.slice(0, 5).map((b) => {
              const techName = b.technicianName || b.technician?.name;
              const slotTime = b.slot ? `${b.slot.startTime} ΓÇô ${b.slot.endTime}` : '';
              return (
                <div
                  key={b.id}
                  onClick={() => onOpenSheet(b)}
                  className="p-4 rounded-2xl cursor-pointer transition-all"
                  style={{ background: PANEL, border: `1px solid ${BORDER}` }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md" style={{ background: `${PURPLE}20`, color: PURPLE }}>
                      #{b.id.slice(-7).toUpperCase()}
                    </span>
                    <StatusPill status={b.status} />
                  </div>
                  <p className="font-extrabold text-white text-sm leading-snug">
                    {b.service?.title || 'Home Maintenance Service'}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                    {slotTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-orange-400" />
                        {slotTime}
                      </span>
                    )}
                    {techName && (
                      <span className="flex items-center gap-1">
                        <span>┬╖</span>
                        <span>{techName}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Mobile Requests Tab ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function RequestsTab({
  bookings, loading, onOpenSheet, onDeleteBooking,
}: { bookings: any[]; loading: boolean; onOpenSheet: (b: any) => void; onDeleteBooking?: (id: string) => void }) {
  const [filter, setFilter] = useState('PENDING');
  const FILTERS = [
    { id: 'ALL',       label: 'All' },
    { id: 'PENDING',   label: 'New' },
    { id: 'CONFIRMED', label: 'Confirmed' },
    { id: 'ASSIGNED',  label: 'Assigned' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'CANCELLED', label: 'Cancelled' },
  ];

  const filtered = bookings.filter((b) => {
    if (filter === 'ALL') return true;
    if (filter === 'ASSIGNED') return b.status === 'TECHNICIAN_ASSIGNED' || b.status === 'TECHNICIAN_ON_THE_WAY';
    if (filter === 'COMPLETED') return ['WORK_COMPLETED', 'CUSTOMER_CONFIRMED', 'COMPLETED'].includes(b.status);
    return b.status === filter;
  });

  const count = (id: string) => {
    if (id === 'ALL') return bookings.length;
    if (id === 'ASSIGNED') return bookings.filter((b) => b.status === 'TECHNICIAN_ASSIGNED' || b.status === 'TECHNICIAN_ON_THE_WAY').length;
    if (id === 'COMPLETED') return bookings.filter((b) => ['WORK_COMPLETED', 'CUSTOMER_CONFIRMED', 'COMPLETED'].includes(b.status)).length;
    return bookings.filter((b) => b.status === id).length;
  };

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {FILTERS.map((f) => {
          const isActive = filter === f.id;
          const n = count(f.id);
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold shrink-0 transition-all"
              style={isActive
                ? { background: PURPLE, borderColor: PURPLE, color: '#fff' }
                : { background: PANEL_ALT, borderColor: BORDER, color: '#94a3b8' }}
            >
              <span>{f.label}</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ background: isActive ? 'rgba(255,255,255,0.2)' : BORDER }}>
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {/* Booking cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: PANEL }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <Wrench className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-slate-400 font-bold text-sm">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const slotTime = b.slot ? `${b.slot.startTime} ΓÇô ${b.slot.endTime}` : '';
            const techName = b.technicianName || b.technician?.name;
            return (
              <div
                key={b.id}
                onClick={() => onOpenSheet(b)}
                className="p-4 rounded-2xl cursor-pointer transition-all"
                style={{ background: PANEL, border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md mr-2" style={{ background: `${PURPLE}20`, color: PURPLE }}>
                      #{b.id.slice(-7).toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400">{b.customer?.name || 'Guest Customer'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusPill status={b.status} />
                    {onDeleteBooking && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBooking(b.id);
                        }}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                        title="Delete Request"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="font-extrabold text-white text-sm">{b.service?.title || 'Home Maintenance Service'}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 flex-wrap">
                  {slotTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-orange-400" />{slotTime}</span>}
                  {techName && <span>┬╖ {techName}</span>}
                </div>
                <div className="flex items-center justify-end mt-2">
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Mobile Slots Tab ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function SlotsTab({
  slots, slotsDate, setSlotsDate, slotsLoading, onLoadSlots,
  onToggleBlock, onDeleteSlot, onCreateSlot,
}: {
  slots: ServiceSlotItem[];
  slotsDate: string;
  setSlotsDate: (d: string) => void;
  slotsLoading: boolean;
  onLoadSlots: (d: string) => void;
  onToggleBlock: (id: string) => void;
  onDeleteSlot: (id: string) => void;
  onCreateSlot: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Date picker + create */}
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={slotsDate}
          onChange={(e) => { setSlotsDate(e.target.value); onLoadSlots(e.target.value); }}
          className="flex-1 h-10 px-3 rounded-xl text-xs font-bold text-slate-200 outline-none"
          style={{ background: PANEL, border: `1px solid ${BORDER}` }}
        />
        <button
          onClick={onCreateSlot}
          className="h-10 px-4 rounded-xl text-xs font-extrabold text-white flex items-center gap-1.5"
          style={{ background: PURPLE }}
        >
          <Plus className="w-3.5 h-3.5" /> New Slot
        </button>
      </div>

      {slotsLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: PANEL }} />)}</div>
      ) : slots.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Clock className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-slate-400 font-bold text-sm">No slots for {slotsDate}</p>
          <button onClick={onCreateSlot} className="px-4 py-2 rounded-xl text-xs font-extrabold text-white" style={{ background: PURPLE }}>
            Create First Slot
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => {
            const rem   = Math.max(0, slot.maxCapacity - slot.bookedCapacity);
            const pct   = Math.min(100, Math.round((slot.bookedCapacity / slot.maxCapacity) * 100));
            const barColor = slot.status === 'FULL' ? '#f87171' : slot.status === 'PARTIALLY_BOOKED' ? '#fb923c' : '#34d399';
            return (
              <div key={slot.id} className="p-4 rounded-2xl space-y-3" style={{ background: PANEL, border: `1px solid ${BORDER}`, opacity: slot.status === 'BLOCKED' ? 0.6 : 1 }}>
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-white text-sm">{slot.startTime} ΓÇô {slot.endTime}</p>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: barColor + '20', color: barColor }}>
                    {slot.status === 'BLOCKED' ? 'Blocked' : slot.status === 'FULL' ? 'Full' : slot.status === 'PARTIALLY_BOOKED' ? 'Partial' : 'Available'}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Capacity</span>
                    <span>{slot.bookedCapacity}/{slot.maxCapacity}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: PANEL_ALT }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onToggleBlock(slot.id)} className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-300 transition-all" style={{ background: PANEL_ALT, border: `1px solid ${BORDER}` }}>
                    {slot.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                  </button>
                  <button onClick={() => onDeleteSlot(slot.id)} disabled={slot.bookedCapacity > 0} className="flex-1 py-2 rounded-xl text-xs font-bold text-red-400 disabled:opacity-30 transition-all" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Mobile Team Tab ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function TeamTab({ technicians }: { technicians: any[] }) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Technician Roster</p>
      {technicians.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 font-bold text-sm">No technicians found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {technicians.map((tech) => {
            const initials = tech.name ? tech.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'TN';
            return (
              <div key={tech.id} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-sm text-white shrink-0" style={{ background: PURPLE }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-white text-sm truncate">{tech.name}</p>
                  <p className="text-xs text-slate-400">{tech.specialty || 'General Handyman'}</p>
                </div>
                <a href={`tel:${tech.phone}`} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${PURPLE}20` }}>
                  <Phone className="w-4 h-4" style={{ color: PURPLE }} />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Main Mobile Shell ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export default function MobileProviderDashboard() {
  const { user } = useAuthStore();
  const { socket } = useSocket();

  const [mobileTab, setMobileTab]     = useState('requests');
  const [loading, setLoading]         = useState(true);
  const [bookings, setBookings]       = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [slots, setSlots]             = useState<ServiceSlotItem[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsDate, setSlotsDate]     = useState(new Date().toISOString().split('T')[0]);
  const [updatingId, setUpdatingId]   = useState<string | null>(null);
  const [assigning, setAssigning]     = useState(false);
  const [sheetBooking, setSheetBooking] = useState<any | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [myServices, setMyServices]   = useState<any[]>([]);
  const [slotFormData, setSlotFormData] = useState({ serviceId: '', startTime: '10:00 AM', endTime: '11:00 AM', maxCapacity: 2 });
  const [slotSubmitting, setSlotSubmitting] = useState(false);

  const [stats, setStats] = useState({ todayEarnings: 0, totalJobsCompleted: 0, rating: 4.9, pendingCount: 0, activeCount: 0, assignedCount: 0, totalEarnings: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [br, sr, tr, srvr] = await Promise.all([
        fetchApi<any>('/bookings').catch(() => null),
        fetchApi<any>('/bookings/provider/stats').catch(() => null),
        fetchApi<any>('/technicians/active').catch(() => null),
        fetchApi<any>('/services').catch(() => null),
      ]);
      if (br?.success) setBookings(Array.isArray(br.data) ? br.data : (br.data?.bookings || []));
      if (sr?.success && sr.data) setStats(sr.data);
      if (srvr?.success && Array.isArray(srvr.data)) setMyServices(srvr.data);

      if (tr?.success && Array.isArray(tr.data) && tr.data.length > 0) {
        const unique = tr.data.filter((t: any, i: number, a: any[]) => a.findIndex((x: any) => (x.name || '').toLowerCase().trim() === (t.name || '').toLowerCase().trim()) === i);
        setTechnicians(unique);
      } else {
        setTechnicians([
          { id: 't1', name: 'Rakib Ahmed',    phone: '+880 1711-223344', specialty: 'Electrical & AC' },
          { id: 't2', name: 'Hasan Mahmud',   phone: '+880 1722-556677', specialty: 'Plumbing & Sanitary' },
          { id: 't3', name: 'Mahmudul Islam', phone: '+880 1733-889900', specialty: 'Appliance Repair' },
          { id: 't4', name: 'Sabbir Hossain', phone: '+880 1744-112233', specialty: 'General Handyman' },
        ]);
      }
    } finally { setLoading(false); }
  }, []);

  const loadSlots = useCallback(async (d?: string) => {
    setSlotsLoading(true);
    try {
      const res = await fetchProviderSlots(d || slotsDate);
      setSlots(res?.success && Array.isArray(res.data) ? res.data : []);
    } catch (_) { setSlots([]); } finally { setSlotsLoading(false); }
  }, [slotsDate]);

  useEffect(() => { load(); loadSlots(); }, [load, loadSlots]);

  useEffect(() => {
    if (!socket) return;
    const sync = () => { load(); loadSlots(); };
    const events = ['service:booking:created','service:booking:updated','service:booking:cancelled','service:technician:assigned','service:slot:created','service:slot:updated','service:slot:deleted','service:slot:availability_updated'];
    events.forEach((e) => socket.on(e, sync));
    return () => { events.forEach((e) => socket.off(e, sync)); };
  }, [socket, load, loadSlots]);

  const handleStatusUpdate = async (bookingId: string, nextStatus: string) => {
    setUpdatingId(bookingId);
    try {
      await fetchApi<any>(`/bookings/${bookingId}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) }).catch(() => null);
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: nextStatus } : b));
      setSheetBooking((prev: any) => prev?.id === bookingId ? { ...prev, status: nextStatus } : prev);
      load();
    } finally { setUpdatingId(null); }
  };

  const handleAssign = async (bookingId: string, tech: any) => {
    setAssigning(true);
    try {
      const res = await fetchApi<any>(`/bookings/${bookingId}/assign-technician`, {
        method: 'PATCH',
        body: JSON.stringify({ technicianId: tech.id, technicianName: tech.name, technicianPhone: tech.phone }),
      }).catch(() => null);
      if (res?.success) {
        const up = (b: any) => b.id === bookingId ? { ...b, technicianName: tech.name, technicianPhone: tech.phone, technicianId: tech.id, status: b.status === 'PENDING' || b.status === 'CONFIRMED' ? 'TECHNICIAN_ASSIGNED' : b.status } : b;
        setBookings((prev) => prev.map(up));
        setSheetBooking((prev: any) => prev?.id === bookingId ? up(prev) : prev);
        load();
      }
    } finally { setAssigning(false); }
  };

  const handleToggleBlock = async (id: string) => { try { await toggleBlockServiceSlot(id); loadSlots(); } catch (_) {} };
  const handleDeleteSlot  = async (id: string) => {
    if (!confirm('Delete this slot?')) return;
    try { await deleteServiceSlot(id); loadSlots(); } catch (_) {}
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking request?')) return;
    try {
      const res = await fetchApi<any>(`/bookings/${bookingId}`, { method: 'DELETE' }).catch(() => null);
      if (res?.success) {
        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
        setSheetBooking((prev: any) => (prev?.id === bookingId ? null : prev));
        load();
      } else {
        alert(res?.message || 'Failed to delete booking request');
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to delete booking request');
    }
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSlotSubmitting(true);
    try {
      const res = await createServiceSlot({ serviceId: slotFormData.serviceId || undefined, startTime: slotFormData.startTime, endTime: slotFormData.endTime, maxCapacity: slotFormData.maxCapacity });
      if (res?.success) { setShowSlotModal(false); loadSlots(); }
    } catch (_) {} finally { setSlotSubmitting(false); }
  };

  // Bottom tab config
  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'requests',  label: 'Requests',  icon: Wrench },
    { id: 'slots',     label: 'Slots',     icon: Clock },
    { id: 'team',      label: 'Team',      icon: Users },
  ];

  const initials = user?.name ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'P';

  return (
    <div className="flex flex-col min-h-screen" style={{ background: BG, color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      {/* ΓöÇΓöÇ Sticky Top Bar ΓöÇΓöÇ */}
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between" style={{ background: BG, borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm text-white" style={{ background: PURPLE }}>
            {initials}
          </div>
          <div>
            <p className="font-extrabold text-sm text-white leading-tight">DOHS Sheba</p>
            <p className="text-[10px] text-slate-500">Platform workspace</p>
          </div>
        </div>

        <button
          onClick={() => { load(); loadSlots(); }}
          disabled={loading}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ background: PANEL_ALT, border: `1px solid ${BORDER}` }}
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* ΓöÇΓöÇ Scrollable Content ΓöÇΓöÇ */}
      <main className="flex-1 overflow-y-auto px-4 pt-5 pb-28">
        {mobileTab === 'dashboard' && (
          <DashboardTab bookings={bookings} stats={stats} slots={slots} loading={loading} onOpenSheet={setSheetBooking} setMobileTab={setMobileTab} />
        )}
        {mobileTab === 'requests' && (
          <RequestsTab bookings={bookings} loading={loading} onOpenSheet={setSheetBooking} onDeleteBooking={handleDeleteBooking} />
        )}
        {mobileTab === 'slots' && (
          <SlotsTab
            slots={slots} slotsDate={slotsDate} setSlotsDate={setSlotsDate}
            slotsLoading={slotsLoading} onLoadSlots={loadSlots}
            onToggleBlock={handleToggleBlock} onDeleteSlot={handleDeleteSlot}
            onCreateSlot={() => { setSlotFormData({ serviceId: '', startTime: '10:00 AM', endTime: '11:00 AM', maxCapacity: 2 }); setShowSlotModal(true); }}
          />
        )}
        {mobileTab === 'team' && <TeamTab technicians={technicians} />}
      </main>

      {/* ΓöÇΓöÇ Floating Action Button ΓöÇΓöÇ */}
      <button
        onClick={() => setSheetBooking(null)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all"
        style={{ background: '#25D366', boxShadow: '0 8px 32px rgba(37,211,102,0.4)' }}
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      {/* ΓöÇΓöÇ Bottom Tab Bar ΓöÇΓöÇ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 px-2 pb-safe" style={{ background: PANEL, borderTop: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-around">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = mobileTab === id;
            return (
              <button
                key={id}
                onClick={() => setMobileTab(id)}
                className="flex flex-col items-center py-3 px-4 transition-all"
              >
                <Icon className="w-5 h-5 mb-1" style={{ color: isActive ? PURPLE : '#64748b' }} />
                <span className="text-[10px] font-extrabold" style={{ color: isActive ? PURPLE : '#64748b' }}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ΓöÇΓöÇ Mobile Detail Bottom Sheet ΓöÇΓöÇ */}
      {sheetBooking && (
        <MobileDetailSheet
          booking={sheetBooking}
          technicians={technicians.filter((t, i, a) => a.findIndex((x) => (x.name || '').toLowerCase().trim() === (t.name || '').toLowerCase().trim()) === i)}
          onClose={() => setSheetBooking(null)}
          onStatusChange={handleStatusUpdate}
          onAssignTechnician={handleAssign}
          onDeleteBooking={handleDeleteBooking}
          updating={!!updatingId}
          assigning={assigning}
        />
      )}

      {/* ΓöÇΓöÇ Create Slot Mini Modal ΓöÇΓöÇ */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="absolute inset-0" onClick={() => setShowSlotModal(false)} />
          <div className="relative w-full rounded-t-3xl p-5 space-y-4" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between">
              <p className="font-extrabold text-white">Create Time Slot</p>
              <button onClick={() => setShowSlotModal(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400" style={{ background: PANEL_ALT }}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveSlot} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Start *</label>
                  <input type="text" placeholder="10:00 AM" value={slotFormData.startTime} onChange={(e) => setSlotFormData({ ...slotFormData, startTime: e.target.value })} className="w-full h-10 px-3 rounded-xl text-slate-200 outline-none" style={{ background: PANEL_ALT, border: `1px solid ${BORDER}` }} required />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">End *</label>
                  <input type="text" placeholder="11:00 AM" value={slotFormData.endTime} onChange={(e) => setSlotFormData({ ...slotFormData, endTime: e.target.value })} className="w-full h-10 px-3 rounded-xl text-slate-200 outline-none" style={{ background: PANEL_ALT, border: `1px solid ${BORDER}` }} required />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Max Technicians *</label>
                <input type="number" min={1} max={20} value={slotFormData.maxCapacity} onChange={(e) => setSlotFormData({ ...slotFormData, maxCapacity: parseInt(e.target.value) || 1 })} className="w-full h-10 px-3 rounded-xl text-slate-200 outline-none" style={{ background: PANEL_ALT, border: `1px solid ${BORDER}` }} required />
              </div>
              <button type="submit" disabled={slotSubmitting} className="w-full py-3 rounded-xl text-sm font-extrabold text-white flex items-center justify-center gap-2" style={{ background: PURPLE }}>
                {slotSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Create Slot
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}




