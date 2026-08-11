import React from 'react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#141523] text-foreground">
      <DashboardSidebar />
      <main className="flex-1 overflow-x-hidden p-4 md:p-8 space-y-6">{children}</main>
    </div>
  );
}
