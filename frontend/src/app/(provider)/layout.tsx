'use client';

import React from 'react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import MobileProviderDashboard from './provider/dashboard/mobile-page';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* ── Mobile-only shell (< md) ── */}
      <div className="block md:hidden">
        <MobileProviderDashboard />
      </div>

      {/* ── Desktop layout (≥ md) ── */}
      <div className="hidden md:flex flex-row min-h-screen bg-[#0a0b14] text-foreground">
        <DashboardSidebar />
        <main className="flex-1 overflow-x-hidden p-8 space-y-6">{children}</main>
      </div>
    </>
  );
}
