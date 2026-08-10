import React from 'react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { CartDrawer } from '@/components/modals/CartDrawer';
import { GlobalSearchModal } from '@/components/modals/GlobalSearchModal';
import { CategorySideDrawer } from '@/components/modals/CategorySideDrawer';
import { LeftCategoryRail } from '@/components/common/LeftCategoryRail';
import { MobileBottomNav } from '@/components/common/MobileBottomNav';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen flex bg-white pb-20 md:pb-0">
      {/* ── 100% Woodmart Left Vertical Category Icon Rail ── */}
      <LeftCategoryRail />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 min-h-[75vh]">{children}</main>
        <Footer />
      </div>

      {/* Global Modals & Drawers */}
      <CartDrawer />
      <CategorySideDrawer />
      <GlobalSearchModal />
      <MobileBottomNav />
    </div>
  );
}
