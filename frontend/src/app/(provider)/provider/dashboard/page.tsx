'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api-client';
import { useAuthStore } from '@/store/useAuthStore';
import { useSocket } from '@/hooks/useSocket';
import { formatCurrency } from '@/utils/cn';
import {
  Wrench,
  ShieldCheck,
  MapPin,
  Calendar,
  UserCheck,
  Loader2,
  RefreshCw,
  PhoneCall,
  XCircle,
  Clock,
  User,
  X,
  CheckCircle2,
  Phone,
  Plus,
  Trash2,
  Edit3,
  Lock,
  Unlock,
  Users,
  AlertCircle,
  BarChart2,
  Activity,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import {
  fetchProviderSlots,
  createServiceSlot,
  updateServiceSlot,
  toggleBlockServiceSlot,
  deleteServiceSlot,
  ServiceSlotItem,
} from '@/services/serviceSlot';
import { DetailBottomSheet } from '@/components/dashboard/DetailBottomSheet';

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING:            { label: 'New Request',        bg: 'bg-amber-500/10',  text: 'text-amber-400',  dot: 'bg-amber-400' },
  CONFIRMED:          { label: 'Confirmed',           bg: 'bg-blue-500/10',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  TECHNICIAN_ASSIGNED:{ label: 'Tech Assigned',       bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
  TECHNICIAN_ON_THE_WAY:{ label: 'On The Way',        bg: 'bg-indigo-500/10', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  IN_PROGRESS:        { label: 'In Progress',         bg: 'bg-sky-500/10',    text: 'text-sky-400',    dot: 'bg-sky-400' },
  WORK_COMPLETED:     { label: 'Completed',           bg: 'bg-emerald-500/10',text: 'text-emerald-400',dot: 'bg-emerald-400' },
  CUSTOMER_CONFIRMED: { label: 'Confirmed ✓',        bg: 'bg-emerald-500/10',text: 'text-emerald-400',dot: 'bg-emerald-400' },
  COMPLETED:          { label: 'Done',                bg: 'bg-emerald-500/10',text: 'text-emerald-400',dot: 'bg-emerald-400' },
  CANCELLED:          { label: 'Cancelled',           bg: 'bg-red-500/10',    text: 'text-red-400',    dot: 'bg-red-400' },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {cfg.label}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent }: { label: string; value: React.ReactNode; icon: any; accent: string }) {
  return (
    <div className={`p-5 rounded-2xl border border-[#242539] bg-[#12131f] space-y-2 hover:border-[#7c6ff0]/30 transition-all group`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-xl ${accent} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="text-2xl font-black text-white tracking-tight">{value}</div>
    </div>
  );
}

// ─── Booking Job Card ─────────────────────────────────────────────────────────
function BookingJobCard({
  booking,
  onOpenSheet,
}: {
  booking: any;
  onOpenSheet: (b: any) => void;
}) {
  const ticketId = `#${booking.id.slice(-7).toUpperCase()}`;
  const customerName = booking.customer?.name || 'Guest Customer';
  const customerPhone = booking.customer?.phone || booking.notes?.match(/Phone:\s*([\d\+\-\s]+)/)?.[1] || '';
  const serviceName = booking.service?.title || 'Home Maintenance Service';
  const slotTime = booking.slot ? `${booking.slot.startTime} – ${booking.slot.endTime}` : '';
  const address = booking.address?.line1 || 'Mohakhali DOHS Residence';
  const techName = booking.technicianName || booking.technician?.name;
  const techPhone = booking.technicianPhone || booking.technician?.phone;

  return (
    <div
      onClick={() => onOpenSheet(booking)}
      className="group p-5 rounded-2xl bg-[#12131f] border border-[#242539] hover:border-[#7c6ff0]/50 transition-all cursor-pointer space-y-4 hover:shadow-xl hover:shadow-[#7c6ff0]/5"
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] font-extrabold text-[#7c6ff0] bg-[#7c6ff0]/10 border border-[#7c6ff0]/20 px-2.5 py-0.5 rounded-lg">
              {ticketId}
            </span>
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <User className="w-3 h-3" /> {customerName} {customerPhone && `(${customerPhone})`}
            </span>
          </div>
          <h3 className="font-extrabold text-base text-white group-hover:text-[#7c6ff0] transition-colors leading-tight">
            {serviceName}
          </h3>
        </div>
        <StatusPill status={booking.status} />
      </div>

      {/* Card Body */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1.5 text-slate-400">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 block">Customer & Location</span>
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#7c6ff0] shrink-0 mt-0.5" />
            <span className="text-slate-300">{address}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{new Date(booking.scheduledAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          {slotTime && (
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Booked Slot: {slotTime}</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 block">Assigned Technician</span>
          {techName ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#7c6ff0] flex items-center justify-center text-[10px] font-extrabold text-white">
                  {techName.slice(0, 2).toUpperCase()}
                </div>
                <span className="font-extrabold text-xs text-purple-200">{techName}</span>
              </div>
              <span className="text-[10px] text-purple-400 font-mono">{techPhone}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>No technician assigned yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer hint */}
      <div className="pt-3 border-t border-[#242539] text-[10px] text-slate-500 flex items-center gap-1 group-hover:text-slate-400 transition-colors">
        <Zap className="w-3 h-3 text-[#7c6ff0]" />
        <span>Click to open detail panel — assign technician, update status, view contact</span>
      </div>
    </div>
  );
}

// ─── Main Dashboard Component ──────────────────────────────────────────────────

export default function ServiceOperationsDashboard() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const { socket } = useSocket();

  const [activeMainTab, setActiveMainTab] = useState<'BOOKINGS' | 'SLOTS'>('BOOKINGS');
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<
    'ALL' | 'PENDING' | 'CONFIRMED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  >('ALL');

  useEffect(() => {
    if (statusParam) {
      setFilterTab(statusParam.toUpperCase() as any);
    }
  }, [statusParam]);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [assigning, setAssigning] = useState<boolean>(false);

  // Bottom sheet state
  const [sheetBooking, setSheetBooking] = useState<any | null>(null);

  // Customer Contact Modal
  const [contactModalBooking, setContactModalBooking] = useState<any | null>(null);

  // ── Time Slots Management State ─────────────────────────────────────────────
  const [slotsDate, setSlotsDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<ServiceSlotItem[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ServiceSlotItem | null>(null);
  const [slotSubmitting, setSlotSubmitting] = useState(false);

  const [slotFormData, setSlotFormData] = useState({
    serviceId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    maxCapacity: 2,
  });

  const [myServices, setMyServices] = useState<any[]>([]);

  const [stats, setStats] = useState({
    todayEarnings: 0,
    totalJobsCompleted: 0,
    rating: 4.9,
    pendingCount: 0,
    activeCount: 0,
    assignedCount: 0,
    totalEarnings: 0,
  });

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsRes, statsRes, techRes, servicesRes] = await Promise.all([
        fetchApi<any>('/bookings').catch(() => null),
        fetchApi<any>('/bookings/provider/stats').catch(() => null),
        fetchApi<any>('/technicians/active').catch(() => null),
        fetchApi<any>('/services').catch(() => null),
      ]);

      if (bookingsRes?.success) {
        if (Array.isArray(bookingsRes.data)) {
          setBookings(bookingsRes.data);
        } else if (Array.isArray(bookingsRes.data?.bookings)) {
          setBookings(bookingsRes.data.bookings);
        }
      }

      if (statsRes?.success && statsRes.data) {
        setStats(statsRes.data);
      }

      if (servicesRes?.success && Array.isArray(servicesRes.data)) {
        setMyServices(servicesRes.data);
      }

      if (techRes?.success && Array.isArray(techRes.data) && techRes.data.length > 0) {
        // Deduplicate by id to prevent double-rendering in the selector grid
        const unique = techRes.data.filter(
          (t: any, idx: number, arr: any[]) => arr.findIndex((x: any) => x.id === t.id) === idx
        );
        setTechnicians(unique);
      } else {
        setTechnicians([
          { id: 't1', name: 'Rakib Ahmed',     phone: '+880 1711-223344', specialty: 'Electrical & AC' },
          { id: 't2', name: 'Hasan Mahmud',    phone: '+880 1722-556677', specialty: 'Plumbing & Sanitary' },
          { id: 't3', name: 'Mahmudul Islam',  phone: '+880 1733-889900', specialty: 'Appliance Repair' },
          { id: 't4', name: 'Sabbir Hossain',  phone: '+880 1744-112233', specialty: 'General Handyman' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSlots = useCallback(async (dateToFetch?: string) => {
    setSlotsLoading(true);
    try {
      const res = await fetchProviderSlots(dateToFetch || slotsDate);
      if (res?.success && Array.isArray(res.data)) {
        setSlots(res.data);
      } else {
        setSlots([]);
      }
    } catch (_) {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [slotsDate]);

  useEffect(() => {
    loadDashboardData();
    loadSlots();
  }, [loadDashboardData, loadSlots]);

  // Real-time Socket.IO Sync
  useEffect(() => {
    if (!socket) return;
    const handleSync = () => { loadDashboardData(); loadSlots(); };
    socket.on('service:slot:created',              handleSync);
    socket.on('service:slot:updated',              handleSync);
    socket.on('service:slot:deleted',              handleSync);
    socket.on('service:slot:availability_updated', handleSync);
    socket.on('service:booking:created',           handleSync);
    socket.on('service:booking:updated',           handleSync);
    socket.on('service:booking:cancelled',         handleSync);
    socket.on('service:technician:assigned',       handleSync);
    return () => {
      socket.off('service:slot:created',              handleSync);
      socket.off('service:slot:updated',              handleSync);
      socket.off('service:slot:deleted',              handleSync);
      socket.off('service:slot:availability_updated', handleSync);
      socket.off('service:booking:created',           handleSync);
      socket.off('service:booking:updated',           handleSync);
      socket.off('service:booking:cancelled',         handleSync);
      socket.off('service:technician:assigned',       handleSync);
    };
  }, [socket, loadDashboardData, loadSlots]);

  // Status update — also syncs open sheet booking
  const handleStatusUpdate = async (bookingId: string, nextStatus: string) => {
    setUpdatingId(bookingId);
    try {
      await fetchApi<any>(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      }).catch(() => null);

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: nextStatus } : b))
      );
      // Sync sheet booking too
      setSheetBooking((prev: any) => prev?.id === bookingId ? { ...prev, status: nextStatus } : prev);
      loadDashboardData();
    } finally {
      setUpdatingId(null);
    }
  };

  // Assign Technician — used from both card and bottom sheet
  const handleAssignTechnicianDirect = async (bookingId: string, tech: any) => {
    setAssigning(true);
    try {
      const res = await fetchApi<any>(`/bookings/${bookingId}/assign-technician`, {
        method: 'PATCH',
        body: JSON.stringify({
          technicianId:    tech.id,
          technicianName:  tech.name,
          technicianPhone: tech.phone,
        }),
      }).catch(() => null);

      if (res?.success) {
        const techName  = tech.name;
        const techPhone = tech.phone;
        const techId    = tech.id;
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId
              ? { ...b, technicianName: techName, technicianPhone: techPhone, technicianId: techId, status: b.status === 'PENDING' || b.status === 'CONFIRMED' ? 'TECHNICIAN_ASSIGNED' : b.status }
              : b
          )
        );
        setSheetBooking((prev: any) =>
          prev?.id === bookingId
            ? { ...prev, technicianName: techName, technicianPhone: techPhone, technicianId: techId, status: prev.status === 'PENDING' || prev.status === 'CONFIRMED' ? 'TECHNICIAN_ASSIGNED' : prev.status }
            : prev
        );
        loadDashboardData();
      }
    } finally {
      setAssigning(false);
    }
  };

  // Legacy assign handler (used by form modal kept for custom tech)
  const handleAssignTechnicianSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const booking = sheetBooking;
    if (!booking) return;
    setAssigning(true);
    try {
      const res = await fetchApi<any>(`/bookings/${booking.id}/assign-technician`, {
        method: 'PATCH',
        body: JSON.stringify({
          technicianName:  customTechName,
          technicianPhone: customTechPhone,
        }),
      }).catch(() => null);
      if (res?.success) {
        setCustomTechName('');
        setCustomTechPhone('');
        loadDashboardData();
      }
    } finally {
      setAssigning(false);
    }
  };

  const [customTechName,  setCustomTechName]  = useState('');
  const [customTechPhone, setCustomTechPhone] = useState('');

  // Slot Handlers
  const handleSaveSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSlotSubmitting(true);
    try {
      if (editingSlot) {
        const res = await updateServiceSlot(editingSlot.id, {
          startTime:   slotFormData.startTime,
          endTime:     slotFormData.endTime,
          maxCapacity: slotFormData.maxCapacity,
          serviceId:   slotFormData.serviceId || undefined,
        });
        if (res?.success) { setShowSlotModal(false); setEditingSlot(null); loadSlots(); }
      } else {
        const res = await createServiceSlot({
          serviceId:   slotFormData.serviceId || undefined,
          startTime:   slotFormData.startTime,
          endTime:     slotFormData.endTime,
          maxCapacity: slotFormData.maxCapacity,
        });
        if (res?.success) { setShowSlotModal(false); loadSlots(); }
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to save slot');
    } finally {
      setSlotSubmitting(false);
    }
  };

  const handleToggleBlock = async (slotId: string) => {
    try { await toggleBlockServiceSlot(slotId); loadSlots(); }
    catch (err: any) { alert(err?.message || 'Failed'); }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Delete this time slot?')) return;
    try { await deleteServiceSlot(slotId); loadSlots(); }
    catch (err: any) { alert(err?.message || 'Failed'); }
  };

  // ── Derived data ──────────────────────────────────────────────────────────────
  const filteredBookings = bookings.filter((b) => {
    if (filterTab === 'ALL') return true;
    if (filterTab === 'ASSIGNED') return b.status === 'TECHNICIAN_ASSIGNED' || b.status === 'TECHNICIAN_ON_THE_WAY';
    if (filterTab === 'COMPLETED') return b.status === 'WORK_COMPLETED' || b.status === 'CUSTOMER_CONFIRMED' || b.status === 'COMPLETED';
    return b.status === filterTab;
  });

  const getTabCount = (tabId: string) => {
    if (tabId === 'ALL') return bookings.length;
    if (tabId === 'ASSIGNED') return bookings.filter((b) => b.status === 'TECHNICIAN_ASSIGNED' || b.status === 'TECHNICIAN_ON_THE_WAY').length;
    if (tabId === 'COMPLETED') return bookings.filter((b) => b.status === 'WORK_COMPLETED' || b.status === 'CUSTOMER_CONFIRMED' || b.status === 'COMPLETED').length;
    return bookings.filter((b) => b.status === tabId).length;
  };

  const totalCapacityCount  = slots.reduce((acc, s) => acc + s.maxCapacity, 0);
  const totalBookedCount    = slots.reduce((acc, s) => acc + s.bookedCapacity, 0);
  const totalAvailableCount = slots.reduce((acc, s) => acc + Math.max(0, s.maxCapacity - s.bookedCapacity), 0);

  const FILTER_TABS = [
    { id: 'ALL',       label: 'All Requests'   },
    { id: 'PENDING',   label: 'New Requests'   },
    { id: 'CONFIRMED', label: 'Confirmed Jobs' },
    { id: 'ASSIGNED',  label: 'Assigned Jobs'  },
    { id: 'IN_PROGRESS', label: 'In Progress'  },
    { id: 'COMPLETED', label: 'Completed Jobs' },
    { id: 'CANCELLED', label: 'Cancelled Jobs' },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0b14] font-sans pb-20 space-y-6">

      {/* ── Top Hero Banner ── */}
      <div className="rounded-3xl bg-[#12131f] border border-[#242539] shadow-2xl overflow-hidden">
        {/* Glow line */}
        <div className="h-1 bg-gradient-to-r from-[#7c6ff0] via-purple-400 to-blue-500 opacity-80" />

        <div className="p-6 md:p-8 space-y-6">
          {/* Title row */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#7c6ff0] flex items-center justify-center font-black text-white text-xl shadow-lg shadow-[#7c6ff0]/30 shrink-0">
                🛡️
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black text-white">
                    DOHS Sheba Service Operations Control
                  </h1>
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3 h-3" /> Service Manager Portal
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Manage service requests, create time slots, set technician capacity per slot, and assign technicians in real time.
                </p>
              </div>
            </div>

            <button
              onClick={() => { loadDashboardData(); loadSlots(); }}
              disabled={loading || slotsLoading}
              className="px-4 py-2.5 rounded-xl bg-[#171829] hover:bg-[#1e1f36] text-white font-bold text-xs border border-[#242539] transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#7c6ff0] ${loading || slotsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Main Nav Tabs */}
          <div className="flex items-center gap-3 pt-4 border-t border-[#242539]">
            <button
              onClick={() => setActiveMainTab('BOOKINGS')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer border ${
                activeMainTab === 'BOOKINGS'
                  ? 'bg-[#7c6ff0] text-white border-[#7c6ff0] shadow-lg shadow-[#7c6ff0]/25'
                  : 'bg-[#171829] text-slate-300 border-[#242539] hover:border-[#7c6ff0]/30'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              Service Bookings Queue ({bookings.length})
            </button>

            <button
              onClick={() => setActiveMainTab('SLOTS')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer border ${
                activeMainTab === 'SLOTS'
                  ? 'bg-[#7c6ff0] text-white border-[#7c6ff0] shadow-lg shadow-[#7c6ff0]/25'
                  : 'bg-[#171829] text-slate-300 border-[#242539] hover:border-[#7c6ff0]/30'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Time Slots & Technician Capacity ({slots.length})
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <StatCard label="New Requests"        value={<span className="text-amber-400">{stats.pendingCount}</span>}          icon={AlertCircle}  accent="bg-amber-500/20" />
            <StatCard label="Active Jobs"         value={<span className="text-blue-400">{stats.activeCount}</span>}             icon={Activity}     accent="bg-blue-500/20" />
            <StatCard label="Today Available Slots" value={<span className="text-emerald-400">{totalAvailableCount} Techs</span>} icon={Users}        accent="bg-emerald-500/20" />
            <StatCard label="Total Revenue"       value={formatCurrency(stats.totalEarnings)}                                    icon={TrendingUp}   accent="bg-[#7c6ff0]/30" />
          </div>
        </div>
      </div>

      {/* ── TAB 1: SERVICE BOOKINGS QUEUE ── */}
      {activeMainTab === 'BOOKINGS' && (
        <div className="space-y-5">
          {/* Horizontal Scrollable Filter Tabs */}
          <div className="p-2 bg-[#12131f] rounded-2xl border border-[#242539] overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 min-w-max">
              {FILTER_TABS.map((tab) => {
                const count    = getTabCount(tab.id);
                const isActive = filterTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilterTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer border ${
                      isActive
                        ? 'bg-[#7c6ff0] text-white border-[#7c6ff0] shadow-md shadow-[#7c6ff0]/20'
                        : 'bg-transparent text-slate-400 border-transparent hover:bg-[#171829] hover:text-slate-200 hover:border-[#242539]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-white/20 text-white' : count > 0 ? 'bg-[#7c6ff0]/15 text-[#7c6ff0]' : 'bg-[#242539] text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bookings List */}
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-40 rounded-2xl bg-[#12131f] border border-[#242539] animate-pulse" />
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-14 text-center border border-dashed border-[#242539] rounded-2xl bg-[#12131f] space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#171829] border border-[#242539] flex items-center justify-center mx-auto">
                  <Wrench className="w-6 h-6 text-slate-500" />
                </div>
                <p className="font-extrabold text-lg text-slate-300">No Service Requests Found</p>
                <p className="text-xs text-slate-500">There are no bookings matching this status filter.</p>
              </div>
            ) : (
              filteredBookings.map((b) => (
                <BookingJobCard
                  key={b.id}
                  booking={b}
                  onOpenSheet={(booking) => setSheetBooking(booking)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: TIME SLOTS & TECHNICIAN CAPACITY MANAGEMENT ── */}
      {activeMainTab === 'SLOTS' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="p-4 bg-[#12131f] rounded-2xl border border-[#242539] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 shrink-0">Filter Date:</span>
              <input
                type="date"
                value={slotsDate}
                onChange={(e) => { setSlotsDate(e.target.value); loadSlots(e.target.value); }}
                className="h-10 px-3 rounded-xl border border-[#242539] text-xs font-bold bg-[#171829] text-slate-200 focus:ring-2 focus:ring-[#7c6ff0] w-full sm:w-auto outline-none"
              />
            </div>
            <button
              onClick={() => {
                setEditingSlot(null);
                setSlotFormData({ serviceId: '', date: slotsDate, startTime: '10:00 AM', endTime: '11:00 AM', maxCapacity: 2 });
                setShowSlotModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#7c6ff0] hover:bg-[#695bdc] text-white font-extrabold text-xs shadow-md shadow-[#7c6ff0]/20 flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Time Slot
            </button>
          </div>

          {/* Capacity Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Remaining Capacity"   value={<span className="text-emerald-400">{totalAvailableCount} Techs</span>}    icon={Users}       accent="bg-emerald-500/20" />
            <StatCard label="Booked Tech Jobs"      value={<span className="text-amber-400">{totalBookedCount} Bookings</span>}     icon={Activity}    accent="bg-amber-500/20" />
            <StatCard label="Max Roster Capacity"   value={<span className="text-[#7c6ff0]">{totalCapacityCount} Total</span>}      icon={BarChart2}   accent="bg-[#7c6ff0]/25" />
          </div>

          {/* Slots Grid */}
          <div className="space-y-4">
            <h3 className="font-black text-slate-200 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Created Availability Time Slots ({slots.length})
            </h3>

            {slotsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-44 rounded-2xl bg-[#12131f] border border-[#242539] animate-pulse" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-[#242539] rounded-2xl bg-[#12131f] space-y-3">
                <Clock className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="font-extrabold text-lg text-slate-300">No Time Slots Created for {slotsDate}</p>
                <p className="text-xs text-slate-500">Create time slots with technician capacity so residents can book your service.</p>
                <button
                  onClick={() => { setEditingSlot(null); setSlotFormData({ serviceId: '', date: slotsDate, startTime: '10:00 AM', endTime: '11:00 AM', maxCapacity: 2 }); setShowSlotModal(true); }}
                  className="px-5 py-2.5 rounded-xl bg-[#7c6ff0] text-white font-black text-xs inline-flex items-center gap-1.5 cursor-pointer hover:bg-[#695bdc] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create First Slot
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {slots.map((slot) => {
                  const remCap = Math.max(0, slot.maxCapacity - slot.bookedCapacity);
                  const pct    = Math.min(100, Math.round((slot.bookedCapacity / slot.maxCapacity) * 100));
                  const barColor = slot.status === 'FULL' ? 'bg-red-500' : slot.status === 'PARTIALLY_BOOKED' ? 'bg-amber-500' : 'bg-emerald-500';
                  let statusBadgeCls = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                  let statusLabel   = `${remCap} Available`;
                  if (slot.status === 'BLOCKED')          { statusBadgeCls = 'bg-slate-500/10 text-slate-400 border-slate-500/20'; statusLabel = 'BLOCKED'; }
                  else if (slot.status === 'FULL')         { statusBadgeCls = 'bg-red-500/10 text-red-400 border-red-500/20';       statusLabel = 'FULLY BOOKED'; }
                  else if (slot.status === 'PARTIALLY_BOOKED') { statusBadgeCls = 'bg-amber-500/10 text-amber-400 border-amber-500/20'; statusLabel = `PARTIAL (${remCap} left)`; }

                  return (
                    <div
                      key={slot.id}
                      className={`p-5 rounded-2xl bg-[#12131f] border border-[#242539] space-y-4 transition-all ${slot.status === 'BLOCKED' ? 'opacity-60' : 'hover:border-[#7c6ff0]/30'}`}
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-[#242539] pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{slot.service?.title || 'All Provider Services'}</span>
                          <h4 className="font-black text-slate-100 text-base flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-4 h-4 text-[#7c6ff0]" />
                            {slot.startTime} – {slot.endTime}
                          </h4>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${statusBadgeCls}`}>{slot.status}</span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-300 font-bold">
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-[#7c6ff0]" /> Technician Capacity:</span>
                          <span className="font-mono">{slot.bookedCapacity} / {slot.maxCapacity} Booked</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#171829] overflow-hidden border border-[#242539]">
                          <div className={`h-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[11px] font-semibold text-slate-500">{statusLabel}</p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#242539] text-xs">
                        <button
                          onClick={() => handleToggleBlock(slot.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold border flex items-center gap-1 cursor-pointer transition-all text-[11px] ${slot.status === 'BLOCKED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-[#171829] text-slate-400 border-[#242539] hover:bg-[#1e1f36]'}`}
                        >
                          {slot.status === 'BLOCKED' ? <><Unlock className="w-3.5 h-3.5" /><span>Unblock</span></> : <><Lock className="w-3.5 h-3.5" /><span>Block Slot</span></>}
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingSlot(slot); setSlotFormData({ serviceId: slot.serviceId || '', date: new Date(slot.date).toISOString().split('T')[0], startTime: slot.startTime, endTime: slot.endTime, maxCapacity: slot.maxCapacity }); setShowSlotModal(true); }}
                            className="p-2 rounded-xl bg-[#171829] hover:bg-[#1e1f36] text-slate-400 border border-[#242539] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            disabled={slot.bookedCapacity > 0}
                            className={`p-2 rounded-xl border cursor-pointer ${slot.bookedCapacity > 0 ? 'bg-[#12131f] text-slate-600 border-[#242539] cursor-not-allowed' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Detail Bottom Sheet ── */}
      <DetailBottomSheet
        booking={sheetBooking}
        isOpen={!!sheetBooking}
        onClose={() => setSheetBooking(null)}
        technicians={technicians}
        onStatusChange={handleStatusUpdate}
        onAssignTechnician={handleAssignTechnicianDirect}
        updating={!!updatingId}
        assigning={assigning}
      />

      {/* ── Create / Edit Time Slot Modal ── */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-[#0a0b14]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#12131f] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-[#242539]">
            <div className="flex items-center justify-between border-b border-[#242539] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#7c6ff0]" />
                <h3 className="font-extrabold text-base text-white">{editingSlot ? 'Edit Time Slot' : 'Create New Time Slot'}</h3>
              </div>
              <button onClick={() => { setShowSlotModal(false); setEditingSlot(null); }} className="w-8 h-8 rounded-full bg-[#171829] flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#242539] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlotSubmit} className="space-y-4 text-xs font-semibold text-slate-300">
              <div>
                <label className="block text-slate-400 mb-1">Service (Optional)</label>
                <select value={slotFormData.serviceId} onChange={(e) => setSlotFormData({ ...slotFormData, serviceId: e.target.value })} className="w-full h-11 px-3.5 rounded-xl border border-[#242539] bg-[#171829] text-slate-200 font-medium focus:ring-2 focus:ring-[#7c6ff0] outline-none">
                  <option value="">-- All Provider Services --</option>
                  {myServices.map((srv) => <option key={srv.id} value={srv.id}>{srv.title}</option>)}
                </select>
              </div>

              {!editingSlot && (
                <div>
                  <label className="block text-slate-400 mb-1">Date *</label>
                  <input type="date" value={slotFormData.date} onChange={(e) => setSlotFormData({ ...slotFormData, date: e.target.value })} className="w-full h-11 px-3.5 rounded-xl border border-[#242539] bg-[#171829] text-slate-200 font-medium focus:ring-2 focus:ring-[#7c6ff0] outline-none" required />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Start Time *</label>
                  <input type="text" placeholder="10:00 AM" value={slotFormData.startTime} onChange={(e) => setSlotFormData({ ...slotFormData, startTime: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-[#242539] bg-[#171829] text-slate-200 font-medium outline-none focus:ring-2 focus:ring-[#7c6ff0]" required />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">End Time *</label>
                  <input type="text" placeholder="11:00 AM" value={slotFormData.endTime} onChange={(e) => setSlotFormData({ ...slotFormData, endTime: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-[#242539] bg-[#171829] text-slate-200 font-medium outline-none focus:ring-2 focus:ring-[#7c6ff0]" required />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Available Technician Capacity *</label>
                <input type="number" min={1} max={20} value={slotFormData.maxCapacity} onChange={(e) => setSlotFormData({ ...slotFormData, maxCapacity: parseInt(e.target.value) || 1 })} className="w-full h-11 px-3.5 rounded-xl border border-[#242539] bg-[#171829] text-slate-200 font-medium focus:ring-2 focus:ring-[#7c6ff0] outline-none" required />
                <p className="text-[11px] text-slate-500 font-normal mt-1">How many technicians can be assigned during this timeframe.</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#242539]">
                <button type="button" onClick={() => { setShowSlotModal(false); setEditingSlot(null); }} className="px-4 py-2.5 rounded-xl border border-[#242539] text-slate-300 font-bold hover:bg-[#171829] cursor-pointer">Cancel</button>
                <button type="submit" disabled={slotSubmitting} className="px-6 py-2.5 rounded-xl bg-[#7c6ff0] hover:bg-[#695bdc] text-white font-black shadow-md shadow-[#7c6ff0]/20 flex items-center gap-1.5 cursor-pointer transition-all">
                  {slotSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingSlot ? 'Update Slot' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Customer Contact Modal ── */}
      {contactModalBooking && (
        <div className="fixed inset-0 bg-[#0a0b14]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#12131f] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-[#242539]">
            <div className="flex items-center justify-between border-b border-[#242539] pb-3">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-[#7c6ff0]" />
                <h3 className="font-extrabold text-base text-white">Customer Details</h3>
              </div>
              <button onClick={() => setContactModalBooking(null)} className="w-8 h-8 rounded-full bg-[#171829] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              {[
                { label: 'Resident Name',    value: contactModalBooking.customer?.name  || 'Guest Customer' },
                { label: 'Contact Phone',    value: contactModalBooking.customer?.phone || 'No phone provided', isPhone: true },
                { label: 'Location Address', value: contactModalBooking.address?.line1  || contactModalBooking.notes || 'DOHS Residence' },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-2xl bg-[#171829] border border-[#242539] space-y-1">
                  <div className="text-slate-500 uppercase text-[10px] font-bold">{item.label}</div>
                  <div className={`text-sm font-extrabold ${(item as any).isPhone ? 'text-[#7c6ff0]' : 'text-slate-200'}`}>{item.value}</div>
                </div>
              ))}
            </div>

            <a href={`tel:${contactModalBooking.customer?.phone || ''}`} className="w-full py-3 rounded-xl bg-[#7c6ff0] hover:bg-[#695bdc] text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all block">
              <Phone className="w-4 h-4" />
              Call Resident Directly
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
