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
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState<any | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [customTechName, setCustomTechName] = useState<string>('');
  const [customTechPhone, setCustomTechPhone] = useState<string>('');
  const [assigning, setAssigning] = useState<boolean>(false);

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
        setTechnicians(techRes.data);
      } else {
        setTechnicians([
          { id: 't1', name: 'Rakib Ahmed', phone: '+880 1711-223344', specialty: 'Electrical & AC' },
          { id: 't2', name: 'Hasan Mahmud', phone: '+880 1722-556677', specialty: 'Plumbing & Sanitary' },
          { id: 't3', name: 'Mahmudul Islam', phone: '+880 1733-889900', specialty: 'Appliance Repair' },
          { id: 't4', name: 'Sabbir Hossain', phone: '+880 1744-112233', specialty: 'General Handyman' },
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

  const [stats, setStats] = useState({
    todayEarnings: 0,
    totalJobsCompleted: 0,
    rating: 4.9,
    pendingCount: 0,
    activeCount: 0,
    assignedCount: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    loadDashboardData();
    loadSlots();
  }, [loadDashboardData, loadSlots]);

  // Real-time Socket.IO Sync
  useEffect(() => {
    if (!socket) return;

    const handleSync = () => {
      loadDashboardData();
      loadSlots();
    };

    socket.on('service:slot:created', handleSync);
    socket.on('service:slot:updated', handleSync);
    socket.on('service:slot:deleted', handleSync);
    socket.on('service:slot:availability_updated', handleSync);
    socket.on('service:booking:created', handleSync);
    socket.on('service:booking:updated', handleSync);
    socket.on('service:booking:cancelled', handleSync);
    socket.on('service:technician:assigned', handleSync);

    return () => {
      socket.off('service:slot:created', handleSync);
      socket.off('service:slot:updated', handleSync);
      socket.off('service:slot:deleted', handleSync);
      socket.off('service:slot:availability_updated', handleSync);
      socket.off('service:booking:created', handleSync);
      socket.off('service:booking:updated', handleSync);
      socket.off('service:booking:cancelled', handleSync);
      socket.off('service:technician:assigned', handleSync);
    };
  }, [socket, loadDashboardData, loadSlots]);

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
      loadDashboardData();
      loadSlots();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignTechnicianSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForAssign) return;

    setAssigning(true);
    try {
      let techObj = technicians.find((t) => t.id === selectedTechId);

      const res = await fetchApi<any>(`/bookings/${selectedBookingForAssign.id}/assign-technician`, {
        method: 'PATCH',
        body: JSON.stringify({
          technicianId: techObj ? techObj.id : undefined,
          technicianName: techObj ? techObj.name : customTechName,
          technicianPhone: techObj ? techObj.phone : customTechPhone,
        }),
      }).catch(() => null);

      if (res?.success) {
        setSelectedBookingForAssign(null);
        setSelectedTechId('');
        setCustomTechName('');
        setCustomTechPhone('');
        loadDashboardData();
      }
    } finally {
      setAssigning(false);
    }
  };

  // Slot Handlers
  const handleSaveSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSlotSubmitting(true);
    try {
      if (editingSlot) {
        const res = await updateServiceSlot(editingSlot.id, {
          startTime: slotFormData.startTime,
          endTime: slotFormData.endTime,
          maxCapacity: slotFormData.maxCapacity,
          serviceId: slotFormData.serviceId || undefined,
        });
        if (res?.success) {
          setShowSlotModal(false);
          setEditingSlot(null);
          loadSlots();
        }
      } else {
        const res = await createServiceSlot({
          serviceId: slotFormData.serviceId || undefined,
          date: slotFormData.date,
          startTime: slotFormData.startTime,
          endTime: slotFormData.endTime,
          maxCapacity: slotFormData.maxCapacity,
        });
        if (res?.success) {
          setShowSlotModal(false);
          loadSlots();
        }
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to save slot');
    } finally {
      setSlotSubmitting(false);
    }
  };

  const handleToggleBlock = async (slotId: string) => {
    try {
      await toggleBlockServiceSlot(slotId);
      loadSlots();
    } catch (err: any) {
      alert(err?.message || 'Failed to toggle block status');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this time slot?')) return;
    try {
      await deleteServiceSlot(slotId);
      loadSlots();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete slot');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterTab === 'ALL') return true;
    if (filterTab === 'ASSIGNED') return b.status === 'TECHNICIAN_ASSIGNED' || b.status === 'TECHNICIAN_ON_THE_WAY';
    if (filterTab === 'COMPLETED')
      return b.status === 'WORK_COMPLETED' || b.status === 'CUSTOMER_CONFIRMED' || b.status === 'COMPLETED';
    return b.status === filterTab;
  });

  const getTabCount = (tabId: string) => {
    if (tabId === 'ALL') return bookings.length;
    if (tabId === 'ASSIGNED') {
      return bookings.filter((b) => b.status === 'TECHNICIAN_ASSIGNED' || b.status === 'TECHNICIAN_ON_THE_WAY').length;
    }
    if (tabId === 'COMPLETED') {
      return bookings.filter((b) => b.status === 'WORK_COMPLETED' || b.status === 'CUSTOMER_CONFIRMED' || b.status === 'COMPLETED').length;
    }
    return bookings.filter((b) => b.status === tabId).length;
  };

  // Slot capacity calculations
  const totalCapacityCount = slots.reduce((acc, s) => acc + s.maxCapacity, 0);
  const totalBookedCount = slots.reduce((acc, s) => acc + s.bookedCapacity, 0);
  const totalAvailableCount = slots.reduce((acc, s) => acc + Math.max(0, s.maxCapacity - s.bookedCapacity), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 border border-blue-500/20 shadow-xl text-white space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white text-2xl shadow-md border border-blue-400/30 shrink-0">
              🛡️
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black text-white">
                  DOHS Sheba Service Operations Control
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Service Manager Portal
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-1">
                Manage service requests, create time slots, set technician capacity per slot, and assign technicians in real time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadDashboardData();
                loadSlots();
              }}
              disabled={loading || slotsLoading}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading || slotsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 pt-2 border-t border-white/10">
          <button
            onClick={() => setActiveMainTab('BOOKINGS')}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'BOOKINGS'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/10 text-blue-100 hover:bg-white/20'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Service Bookings Queue ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('SLOTS')}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'SLOTS'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/10 text-blue-100 hover:bg-white/20'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Time Slots & Technician Capacity ({slots.length})</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10 text-xs">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-blue-200/70 font-semibold">New Requests</span>
            <div className="text-2xl font-black text-amber-400">{stats.pendingCount}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-blue-200/70 font-semibold">Active Jobs</span>
            <div className="text-2xl font-black text-blue-400">{stats.activeCount}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-blue-200/70 font-semibold">Today Available Slots</span>
            <div className="text-2xl font-black text-emerald-400">{totalAvailableCount} Techs</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-blue-200/70 font-semibold">Total Revenue</span>
            <div className="text-2xl font-black text-white">{formatCurrency(stats.totalEarnings)}</div>
          </div>
        </div>
      </div>

      {/* ── TAB 1: SERVICE BOOKINGS QUEUE ── */}
      {activeMainTab === 'BOOKINGS' && (
        <div className="space-y-6">
          {/* Filter Tabs */}
          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              {[
                { id: 'ALL', label: 'All Requests' },
                { id: 'PENDING', label: 'New Requests' },
                { id: 'CONFIRMED', label: 'Confirmed Jobs' },
                { id: 'ASSIGNED', label: 'Assigned Jobs' },
                { id: 'IN_PROGRESS', label: 'In Progress' },
                { id: 'COMPLETED', label: 'Completed Jobs' },
                { id: 'CANCELLED', label: 'Cancelled Jobs' },
              ].map((tab) => {
                const count = getTabCount(tab.id);
                const isActive = filterTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilterTab(tab.id as any)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : count > 0
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-200/80 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bookings Queue */}
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-44 rounded-3xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl bg-white space-y-2">
                <Wrench className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="font-extrabold text-lg text-slate-800">No Service Requests Found</p>
                <p className="text-xs text-slate-500">There are no bookings matching this status filter.</p>
              </div>
            ) : (
              filteredBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                          #{b.id.slice(-8).toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-700 font-bold flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                          {b.customer?.name || 'Resident Customer'} ({b.customer?.phone || 'No Phone'})
                        </span>
                      </div>
                      <h3 className="font-extrabold text-lg text-slate-900 mt-1">
                        {b.service?.title || 'Home Maintenance Service'}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        Status: {b.status}
                      </span>
                    </div>
                  </div>

                  {/* Details & Address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        Customer Information & Location
                      </span>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{b.address?.line1 || b.notes || 'Mohakhali DOHS Residence'}</span>
                      </div>
                      <div className="text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Scheduled: {new Date(b.scheduledAt).toLocaleString()}</span>
                      </div>
                      {b.slot && (
                        <div className="text-amber-700 font-bold flex items-center gap-1.5 pt-0.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>
                            Booked Slot: {b.slot.startTime} – {b.slot.endTime}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        Assigned Internal Technician
                      </span>
                      {b.technicianName || b.technician?.name ? (
                        <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 font-bold flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-purple-600" />
                            <span>{b.technicianName || b.technician?.name}</span>
                          </div>
                          <span className="text-[11px] text-purple-700 font-medium">
                            {b.technicianPhone || b.technician?.phone}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold flex items-center justify-between">
                          <span>No technician assigned yet</span>
                          <button
                            onClick={() => {
                              setSelectedBookingForAssign(b);
                              setSelectedTechId(technicians[0]?.id || '');
                            }}
                            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-xs cursor-pointer"
                          >
                            Assign Now
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setContactModalBooking(b)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                        <span>Contact Customer</span>
                      </button>

                      {b.notes && <span className="text-slate-500 text-[11px]">"{b.notes}"</span>}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {b.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(b.id, 'CONFIRMED')}
                            disabled={updatingId === b.id}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            {updatingId === b.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Accept Request</span>
                          </button>

                          <button
                            onClick={() => handleStatusUpdate(b.id, 'CANCELLED')}
                            disabled={updatingId === b.id}
                            className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {['PENDING', 'CONFIRMED'].includes(b.status) && (
                        <button
                          onClick={() => {
                            setSelectedBookingForAssign(b);
                            setSelectedTechId(technicians[0]?.id || '');
                          }}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Assign Technician</span>
                        </button>
                      )}

                      {b.status === 'TECHNICIAN_ASSIGNED' && (
                        <button
                          onClick={() => handleStatusUpdate(b.id, 'TECHNICIAN_ON_THE_WAY')}
                          disabled={updatingId === b.id}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          {updatingId === b.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Mark Tech On The Way</span>
                        </button>
                      )}

                      {b.status === 'TECHNICIAN_ON_THE_WAY' && (
                        <button
                          onClick={() => handleStatusUpdate(b.id, 'IN_PROGRESS')}
                          disabled={updatingId === b.id}
                          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          {updatingId === b.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Mark Work In Progress</span>
                        </button>
                      )}

                      {b.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleStatusUpdate(b.id, 'WORK_COMPLETED')}
                          disabled={updatingId === b.id}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          {updatingId === b.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Mark Work Completed</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: TIME SLOTS & TECHNICIAN CAPACITY MANAGEMENT ── */}
      {activeMainTab === 'SLOTS' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-700 shrink-0">Filter Date:</span>
              <input
                type="date"
                value={slotsDate}
                onChange={(e) => {
                  setSlotsDate(e.target.value);
                  loadSlots(e.target.value);
                }}
                className="h-10 px-3 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  setEditingSlot(null);
                  setSlotFormData({
                    serviceId: '',
                    date: slotsDate,
                    startTime: '10:00 AM',
                    endTime: '11:00 AM',
                    maxCapacity: 2,
                  });
                  setShowSlotModal(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>Create Time Slot</span>
              </button>
            </div>
          </div>

          {/* Slots Capacity Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Remaining Capacity</span>
              <div className="text-3xl font-black text-emerald-800">{totalAvailableCount} Techs</div>
              <p className="text-[11px] text-emerald-600">Available across all active slots for {slotsDate}</p>
            </div>

            <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Booked Tech Jobs</span>
              <div className="text-3xl font-black text-amber-800">{totalBookedCount} Bookings</div>
              <p className="text-[11px] text-amber-600">Capacity currently occupied by customers</p>
            </div>

            <div className="p-5 rounded-3xl bg-blue-50 border border-blue-200 text-blue-950 space-y-1">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Max Roster Capacity</span>
              <div className="text-3xl font-black text-blue-800">{totalCapacityCount} Total</div>
              <p className="text-[11px] text-blue-600">Total technician capacity allocated</p>
            </div>
          </div>

          {/* Time Slots Cards Grid */}
          <div className="space-y-4">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Created Availability Time Slots ({slots.length})</span>
            </h3>

            {slotsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-44 rounded-3xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl bg-white space-y-3">
                <Clock className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="font-extrabold text-lg text-slate-800">No Time Slots Created for {slotsDate}</p>
                <p className="text-xs text-slate-500">
                  Create time slots with technician capacity so residents can book your service.
                </p>
                <button
                  onClick={() => {
                    setEditingSlot(null);
                    setSlotFormData({
                      serviceId: '',
                      date: slotsDate,
                      startTime: '10:00 AM',
                      endTime: '11:00 AM',
                      maxCapacity: 2,
                    });
                    setShowSlotModal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-black text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Slot</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {slots.map((slot) => {
                  const remCap = Math.max(0, slot.maxCapacity - slot.bookedCapacity);

                  let statusBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  let statusText = `${remCap} Technicians Available`;

                  if (slot.status === 'BLOCKED') {
                    statusBadgeClass = 'bg-slate-200 text-slate-800 border-slate-300';
                    statusText = 'BLOCKED (MANUAL)';
                  } else if (slot.status === 'FULL') {
                    statusBadgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
                    statusText = 'FULLY BOOKED';
                  } else if (slot.status === 'PARTIALLY_BOOKED') {
                    statusBadgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
                    statusText = `PARTIALLY BOOKED (${remCap} Tech Remaining)`;
                  }

                  return (
                    <div
                      key={slot.id}
                      className={`p-5 rounded-3xl bg-white border shadow-xs space-y-4 transition-all ${
                        slot.status === 'BLOCKED'
                          ? 'border-slate-300 opacity-75'
                          : slot.status === 'FULL'
                          ? 'border-rose-200'
                          : 'border-slate-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {slot.service?.title || 'All Provider Services'}
                          </span>
                          <h4 className="font-black text-slate-900 text-base flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span>
                              {slot.startTime} – {slot.endTime}
                            </span>
                          </h4>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${statusBadgeClass}`}>
                          {slot.status}
                        </span>
                      </div>

                      {/* Capacity Bar */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-700 font-bold">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            Technician Capacity:
                          </span>
                          <span className="font-mono">
                            {slot.bookedCapacity} / {slot.maxCapacity} Booked
                          </span>
                        </div>

                        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                          <div
                            className={`h-full transition-all duration-500 ${
                              slot.status === 'FULL'
                                ? 'bg-rose-500'
                                : slot.status === 'PARTIALLY_BOOKED'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.round((slot.bookedCapacity / slot.maxCapacity) * 100))}%`,
                            }}
                          />
                        </div>

                        <p className="text-[11px] font-semibold text-slate-500 pt-0.5">{statusText}</p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                        <button
                          onClick={() => handleToggleBlock(slot.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold border flex items-center gap-1 cursor-pointer transition-all ${
                            slot.status === 'BLOCKED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {slot.status === 'BLOCKED' ? (
                            <>
                              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Unblock</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <span>Block Slot</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingSlot(slot);
                              setSlotFormData({
                                serviceId: slot.serviceId || '',
                                date: new Date(slot.date).toISOString().split('T')[0],
                                startTime: slot.startTime,
                                endTime: slot.endTime,
                                maxCapacity: slot.maxCapacity,
                              });
                              setShowSlotModal(true);
                            }}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            disabled={slot.bookedCapacity > 0}
                            className={`p-2 rounded-xl border cursor-pointer ${
                              slot.bookedCapacity > 0
                                ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
                            }`}
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

      {/* ── Create / Edit Time Slot Modal ── */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingSlot ? 'Edit Time Slot' : 'Create New Time Slot'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowSlotModal(false);
                  setEditingSlot(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlotSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 mb-1">Service (Optional - Default All Services)</label>
                <select
                  value={slotFormData.serviceId}
                  onChange={(e) => setSlotFormData({ ...slotFormData, serviceId: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- All Provider Services --</option>
                  {myServices.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.title}
                    </option>
                  ))}
                </select>
              </div>

              {!editingSlot && (
                <div>
                  <label className="block text-slate-600 mb-1">Date *</label>
                  <input
                    type="date"
                    value={slotFormData.date}
                    onChange={(e) => setSlotFormData({ ...slotFormData, date: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Start Time *</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM"
                    value={slotFormData.startTime}
                    onChange={(e) => setSlotFormData({ ...slotFormData, startTime: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">End Time *</label>
                  <input
                    type="text"
                    placeholder="e.g. 11:00 AM"
                    value={slotFormData.endTime}
                    onChange={(e) => setSlotFormData({ ...slotFormData, endTime: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Available Technicians Capacity *</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={slotFormData.maxCapacity}
                  onChange={(e) => setSlotFormData({ ...slotFormData, maxCapacity: parseInt(e.target.value) || 1 })}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-[11px] text-slate-400 font-normal mt-1">
                  How many technicians can be assigned during this timeframe (e.g. 3 technicians).
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowSlotModal(false);
                    setEditingSlot(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={slotSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {slotSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingSlot ? 'Update Slot' : 'Create Slot'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Technician Assignment Modal */}
      {selectedBookingForAssign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-base text-slate-900">Assign Technician from Roster</h3>
              </div>
              <button
                onClick={() => setSelectedBookingForAssign(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50 text-blue-900 text-xs border border-blue-200 space-y-1">
              <div className="font-bold">Booking #{selectedBookingForAssign.id.slice(-8).toUpperCase()}</div>
              <div>{selectedBookingForAssign.service?.title}</div>
            </div>

            <form onSubmit={handleAssignTechnicianSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 mb-1">Select Technician Created By Admin</label>
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Custom Technician Below --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.specialty || 'General'}) - {t.phone}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedTechId && (
                <div className="space-y-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-slate-600 mb-1">Technician Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rakib Hassan"
                      value={customTechName}
                      onChange={(e) => setCustomTechName(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white"
                      required={!selectedTechId}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +880 1711-000000"
                      value={customTechPhone}
                      onChange={(e) => setCustomTechPhone(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white"
                      required={!selectedTechId}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForAssign(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {assigning && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Confirm Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Contact Modal */}
      {contactModalBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">Customer Details</h3>
              </div>
              <button
                onClick={() => setContactModalBooking(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-slate-400 uppercase text-[10px] font-bold">Resident Name</div>
                <div className="text-slate-900 text-sm font-black">
                  {contactModalBooking.customer?.name || 'Resident Customer'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-slate-400 uppercase text-[10px] font-bold">Contact Phone</div>
                <div className="text-blue-600 text-sm font-black">
                  {contactModalBooking.customer?.phone || 'No phone provided'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-slate-400 uppercase text-[10px] font-bold">Location Address</div>
                <div className="text-slate-800 font-medium">
                  {contactModalBooking.address?.line1 || contactModalBooking.notes || 'DOHS Residence'}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={`tel:${contactModalBooking.customer?.phone || ''}`}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Call Resident Directly</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
