'use client';

import React from 'react';
import { Check, Loader2 } from 'lucide-react';

export const BOOKING_STAGES = [
  { id: 'PENDING', label: 'New Request' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'TECHNICIAN_ASSIGNED', label: 'Assigned' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'WORK_COMPLETED', label: 'Completed' },
];

interface StatusStepperProps {
  currentStatus: string;
  onStatusChange: (nextStatus: string) => void;
  updating?: boolean;
}

export function StatusStepper({ currentStatus, onStatusChange, updating }: StatusStepperProps) {
  const normalizedCurrent = currentStatus === 'COMPLETED' || currentStatus === 'CUSTOMER_CONFIRMED'
    ? 'WORK_COMPLETED'
    : currentStatus;

  const currentIdx = BOOKING_STAGES.findIndex((s) => s.id === normalizedCurrent);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span>Job Lifecycle Status</span>
        {updating && (
          <span className="flex items-center gap-1 text-sheba-purple lowercase font-medium">
            <Loader2 className="w-3 h-3 animate-spin" /> updating...
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {BOOKING_STAGES.map((stage, idx) => {
          const isCurrent = normalizedCurrent === stage.id;
          const isPassed = currentIdx > -1 && idx < currentIdx;

          let chipStyle = 'bg-[#171829] text-slate-400 border-[#242539] hover:bg-[#1c1d33] hover:text-slate-200';
          if (isCurrent) {
            chipStyle = 'bg-[#7c6ff0] text-white border-[#7c6ff0] shadow-md shadow-[#7c6ff0]/30 font-bold';
          } else if (isPassed) {
            chipStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold';
          }

          return (
            <button
              key={stage.id}
              type="button"
              disabled={updating}
              onClick={() => onStatusChange(stage.id)}
              className={`px-3 py-1.5 rounded-xl text-xs border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 ${chipStyle}`}
            >
              {isPassed ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
              ) : (
                <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
              )}
              <span>{stage.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
