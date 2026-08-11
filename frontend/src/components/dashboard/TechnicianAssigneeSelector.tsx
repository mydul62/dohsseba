'use client';

import React from 'react';
import { Check, User, Loader2, Phone } from 'lucide-react';

interface TechnicianAssigneeSelectorProps {
  technicians: any[];
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  onAssignTechnician: (tech: any) => void;
  assigning?: boolean;
}

export function TechnicianAssigneeSelector({
  technicians: rawTechnicians,
  assignedTechnicianId,
  assignedTechnicianName,
  onAssignTechnician,
  assigning,
}: TechnicianAssigneeSelectorProps) {
  // Deduplicate by id (guard against API returning the same technician twice)
  const technicians = rawTechnicians.filter(
    (t, idx, arr) => arr.findIndex((x) => x.id === t.id) === idx
  );
  const getInitials = (name: string) => {
    if (!name) return 'TN';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span>Assign Internal Technician</span>
        {assigning && (
          <span className="flex items-center gap-1 text-sheba-purple lowercase font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> assigning...
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {technicians.map((tech) => {
          const isAssigned =
            assignedTechnicianId === tech.id ||
            (assignedTechnicianName && tech.name && assignedTechnicianName.toLowerCase() === tech.name.toLowerCase());

          const initials = getInitials(tech.name);

          return (
            <div
              key={tech.id}
              onClick={() => {
                if (!assigning) onAssignTechnician(tech);
              }}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isAssigned
                  ? 'bg-purple-500/10 border-purple-500/40 text-purple-200 ring-1 ring-purple-500/30'
                  : 'bg-[#171829] border-[#242539] hover:bg-[#1e1f36] text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                    isAssigned
                      ? 'bg-[#7c6ff0] text-white shadow-md shadow-[#7c6ff0]/30'
                      : 'bg-[#242539] text-slate-300'
                  }`}
                >
                  {initials}
                </div>

                <div className="space-y-0.5">
                  <span className="font-extrabold text-xs text-white block line-clamp-1">{tech.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium block flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5 text-slate-500" /> {tech.phone || '+880 1700-000000'}
                  </span>
                </div>
              </div>

              {isAssigned && (
                <div className="w-5 h-5 rounded-full bg-[#7c6ff0] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
