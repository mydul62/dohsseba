'use client';

import React from 'react';
import { X, MapPin, Calendar, Clock, Phone, ShieldCheck, Wrench, User, Trash2 } from 'lucide-react';
import { StatusStepper } from './StatusStepper';
import { TechnicianAssigneeSelector } from './TechnicianAssigneeSelector';

interface DetailBottomSheetProps {
  booking: any | null;
  isOpen: boolean;
  onClose: () => void;
  technicians: any[];
  onStatusChange: (bookingId: string, status: string) => void;
  onAssignTechnician: (bookingId: string, tech: any) => void;
  onDeleteBooking?: (bookingId: string) => void;
  updating?: boolean;
  assigning?: boolean;
}

export function DetailBottomSheet({
  booking,
  isOpen,
  onClose,
  technicians,
  onStatusChange,
  onAssignTechnician,
  onDeleteBooking,
  updating,
  assigning,
}: DetailBottomSheetProps) {
  if (!isOpen || !booking) return null;

  const ticketId = booking.id ? `#${booking.id.slice(-7).toUpperCase()}` : '#DS-8891';
  const customerName = (booking.customer?.name && booking.customer.name !== 'Guest Customer' ? booking.customer.name : null) || (booking.notes && booking.notes.match(/Name:\s*([^.\n]+)/i)?.[1]?.trim()) || booking.customer?.name || 'Resident Customer';
  const customerPhone = (booking.notes && booking.notes.match(/Phone:\s*([0-9\+\-\s]+)/i)?.[1]?.trim()) || booking.customerPhone || booking.customer?.phone || booking.address?.phone || 'No phone provided';
  const customerAddress = booking.address?.line1 || booking.notes?.match(/Address:\s*([^.]+)/)?.[1] || 'Mohakhali DOHS Residence';
  const scheduledTime = booking.slot
    ? `${booking.slot.startTime} – ${booking.slot.endTime}`
    : booking.notes?.match(/Schedule:\s*([^.]+)/)?.[1] || 'Today Evening (5:00 PM - 8:00 PM)';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0a0b14]/80 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet panel */}
      <div className="relative w-full max-w-2xl bg-[#12131f] border-t sm:border border-[#242539] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-6 animate-in slide-in-from-bottom duration-300 z-10 max-h-[90vh] overflow-y-auto no-scrollbar font-sans text-slate-200">
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1 rounded-full bg-[#242539] mx-auto sm:hidden mb-2" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242539] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-mono font-extrabold text-[11px] border border-purple-500/20">
                {ticketId}
              </span>
              <span className="text-xs text-slate-400 font-semibold">{customerName}</span>
            </div>
            <h3 className="font-extrabold text-xl text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-sheba-purple" />
              {booking.service?.title || 'Home Maintenance Service'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#171829] text-slate-400 hover:text-white hover:bg-[#242539] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Info & Location */}
        <div className="p-4 rounded-2xl bg-[#171829] border border-[#242539] space-y-3 text-xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Customer Information & Location
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-sheba-purple shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Address:</span>
                <span className="text-slate-400">{customerAddress}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Contact Phone:</span>
                <a
                  href={`tel:${customerPhone}`}
                  className="text-emerald-400 hover:underline font-extrabold font-mono"
                >
                  {customerPhone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2 sm:col-span-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Booked Time Slot:</span>
                <span className="text-amber-300 font-semibold">{scheduledTime}</span>
              </div>
            </div>
          </div>

          {booking.notes && (
            <div className="pt-2 border-t border-[#242539] text-[11px]">
              <span className="text-slate-400 font-bold block">Special Instructions / Notes:</span>
              <p className="text-slate-300 italic">{booking.notes}</p>
            </div>
          )}
        </div>

        {/* Status Stepper */}
        <div className="p-4 rounded-2xl bg-[#171829] border border-[#242539]">
          <StatusStepper
            currentStatus={booking.status}
            onStatusChange={(nextStatus) => onStatusChange(booking.id, nextStatus)}
            updating={updating}
          />
        </div>

        {/* Technician Assignee Selector */}
        <div className="p-4 rounded-2xl bg-[#171829] border border-[#242539]">
          <TechnicianAssigneeSelector
            technicians={technicians}
            assignedTechnicianId={booking.technicianId}
            assignedTechnicianName={booking.technicianName}
            onAssignTechnician={(tech) => onAssignTechnician(booking.id, tech)}
            assigning={assigning}
          />
        </div>

        {/* Quick Action Footer */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {onDeleteBooking && (
            <button
              type="button"
              onClick={() => onDeleteBooking(booking.id)}
              className="px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Request</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#242539] bg-[#171829] text-slate-300 font-bold text-xs hover:bg-[#242539] ml-auto"
          >
            Close Sheet
          </button>
        </div>
      </div>
    </div>
  );
}
