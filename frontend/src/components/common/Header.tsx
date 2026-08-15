'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Wrench,
  ShoppingBag,
  Search,
  MapPin,
  PhoneCall,
  User,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Zap,
  Carrot,
  ShieldCheck,
  LogOut,
  SlidersHorizontal,
  Truck,
} from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/constants/services';
import { SHOPPING_CATEGORIES } from '@/constants/products';
import { useTranslation } from '@/hooks/useTranslation';
import { useSiteSettingsStore } from '@/store/useSiteSettingsStore';
import { useSearchStore } from '@/store/useSearchStore';
import { getApiBaseUrl } from '@/lib/api-client';

import { useEffect } from 'react';

export function Header() {
  const { siteName } = useSiteSettingsStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [searchCategory, setSearchCategory] = useState<'all' | 'services' | 'shopping'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [megaMenuOpen, setMegaMenuOpen] = useState<'service' | 'shopping' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState<'services' | 'shopping' | null>(null);
  const [location, setLocation] = useState('Savar DOHS');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const API = getApiBaseUrl();
    fetch(`${API}/product-categories`)
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          const parents = res.data.filter((cat: any) => !cat.parentId);
          setCategories(parents.length > 0 ? parents : res.data);
        }
      })
      .catch(() => null);
  }, []);

  const displayCategories = categories.length > 0
    ? categories.map((cat) => ({
        id: cat.id || cat.slug,
        name: cat.name,
        slug: cat.slug,
        itemCount: Array.isArray(cat.children) ? cat.children.length : (cat.itemCount ?? 4),
      }))
    : SHOPPING_CATEGORIES;

  const { getTotalCount, openCart } = useCartStore();
  const { user, role, logout } = useAuthStore();
  const { openSearch } = useSearchStore();
  const { isBn, language, toggleLanguage } = useTranslation();
  const cartCount = getTotalCount();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
      {/* Top Banner Bar (Woodmart Green Bar) */}
      <div className="bg-[#7eb343] text-white text-xs py-1.5 px-2 sm:px-3 border-b border-emerald-600 overflow-hidden w-full">
        <div className="w-full max-w-[1720px] mx-auto px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="flex items-center gap-1 font-bold text-emerald-100 text-[11px] sm:text-xs">
              <MapPin className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="hidden xs:inline">Location:</span>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-transparent font-black text-white focus:outline-none cursor-pointer text-[11px] sm:text-xs"
              >
                <option value="Savar DOHS" className="bg-emerald-700 text-white">Savar DOHS</option>
                <option value="Mirpur DOHS" className="bg-emerald-700 text-white">Mirpur DOHS</option>
                <option value="Mohakhali DOHS" className="bg-emerald-700 text-white">Mohakhali DOHS</option>
                <option value="Baridhara DOHS" className="bg-emerald-700 text-white">Baridhara DOHS</option>
              </select>
            </div>
            <span className="hidden sm:inline text-emerald-200">|</span>
            <div className="hidden sm:flex items-center gap-1.5 text-white text-xs">
              <PhoneCall className="w-3.5 h-3.5 shrink-0" />
              <span>DOHS Helpline: <strong>(09612) 238-7908</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              href="/track-order"
              className="flex items-center gap-1 font-extrabold text-white bg-emerald-800/60 hover:bg-emerald-800 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] transition-all border border-emerald-400/40 shrink-0 whitespace-nowrap"
            >
              <Truck className="w-3 h-3 text-amber-300 shrink-0" />
              <span>{isBn ? 'অর্ডার ট্র্যাক' : 'Track Order'}</span>
            </Link>

            <span className="hidden md:inline text-emerald-200">|</span>

            <Link
              href="/offers"
              className="hidden md:flex items-center gap-1 font-bold text-amber-200 hover:underline text-[11px] shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isBn ? 'অফার ও কুপন' : 'Offers & Coupons'}</span>
            </Link>

            <span className="text-emerald-200">|</span>

            {/* Language Toggle EN / BN */}
            <button
              onClick={() => toggleLanguage()}
              className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-emerald-800/40 hover:bg-emerald-800/70 text-white font-bold text-[10px] sm:text-[11px] transition-all border border-emerald-400/30 active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
              title="Toggle English / Bangla"
            >
              <span>{language === 'EN' ? '🇧🇩 বাংলা' : '🇺🇸 EN'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="w-full max-w-[1720px] mx-auto px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0 select-none">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#7eb343] flex items-center justify-center text-white font-black text-base sm:text-xl shadow-sm group-hover:scale-105 transition-transform shrink-0">
            dS
          </div>
          <div className="flex flex-col shrink-0">
            <span className="font-black text-base sm:text-xl tracking-tight text-[#7eb343] leading-none whitespace-nowrap">
              {siteName}
            </span>
            <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 tracking-wider uppercase leading-tight whitespace-nowrap mt-0.5">
              {isBn ? 'গ্রোসারি ও সার্ভিসসমূহ' : 'Grocery & Services'}
            </span>
          </div>
        </Link>

        {/* Global Live Search Bar */}
        <div className="hidden lg:flex flex-1 max-w-xl items-center relative">
          <div
            onClick={() => openSearch(searchQuery)}
            className="flex w-full items-center border border-border rounded-2xl bg-secondary/50 focus-within:ring-2 focus-within:ring-primary focus-within:bg-background transition-all overflow-hidden shadow-sm cursor-pointer"
          >
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value as any)}
              className="bg-transparent text-xs font-semibold px-3 py-2.5 border-r border-border focus:outline-none text-muted-foreground cursor-pointer"
            >
              <option value="all">{isBn ? 'সব মার্কেট' : 'All Market'}</option>
              <option value="services">{isBn ? 'হোম সার্ভিস' : 'Home Services'}</option>
              <option value="shopping">{isBn ? 'গ্রোসারি' : 'Groceries'}</option>
            </select>
            <input
              type="text"
              readOnly
              onFocus={() => openSearch(searchQuery)}
              placeholder={isBn ? 'সার্চ করুন বাংলা, English বা Banglish এ (যেমন: ডিম, dim, mach, chal, ac...)' : 'Search in English, Bangla or Banglish (e.g. egg, dim, mach, chal, ac...)'}
              className="w-full bg-transparent px-3.5 py-2.5 text-sm focus:outline-none text-foreground placeholder:text-muted-foreground cursor-pointer"
            />
            <button
              type="button"
              onClick={() => openSearch(searchQuery)}
              className="p-2.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation & Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Mega Menu Triggers */}
          <div className="hidden md:flex items-center gap-1">
            <div className="relative" onMouseLeave={() => setMegaMenuOpen(null)}>
              <button
                onMouseEnter={() => setMegaMenuOpen('service')}
                onClick={() => setMegaMenuOpen(megaMenuOpen === 'service' ? null : 'service')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-secondary transition-colors"
              >
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>Home Services</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {/* Home Services Dropdown */}
              {megaMenuOpen === 'service' && (
                <div className="absolute top-full left-0 pt-2 w-80 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 bg-background border border-border rounded-2xl shadow-xl">
                    <div className="text-xs font-bold text-muted-foreground px-3 py-1 uppercase tracking-wider">
                      Service Categories
                    </div>
                    <div className="grid grid-cols-1 gap-1 mt-1">
                      {SERVICE_CATEGORIES.slice(0, 6).map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/services/home-service/${cat.slug}`}
                          onClick={() => setMegaMenuOpen(null)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary transition-colors group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-lg ${cat.colorBg} ${cat.colorText}`}>
                              <Zap className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-xs group-hover:text-primary transition-colors">
                                {cat.name}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate max-w-[170px]">
                                {cat.description}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" onMouseLeave={() => setMegaMenuOpen(null)}>
              <button
                onMouseEnter={() => setMegaMenuOpen('shopping')}
                onClick={() => setMegaMenuOpen(megaMenuOpen === 'shopping' ? null : 'shopping')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-secondary transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>Shopping</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {/* Shopping Dropdown */}
              {megaMenuOpen === 'shopping' && (
                <div className="absolute top-full left-0 pt-2 w-80 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 bg-background border border-border rounded-2xl shadow-xl">
                    <div className="text-xs font-bold text-muted-foreground px-3 py-1 uppercase tracking-wider">
                      Grocery & Daily Needs
                    </div>
                    <div className="grid grid-cols-1 gap-1 mt-1">
                      {displayCategories.slice(0, 8).map((pcat) => (
                        <Link
                          key={pcat.id}
                          href={`/category/${pcat.slug}`}
                          onClick={() => setMegaMenuOpen(null)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary transition-colors group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                              <Carrot className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-xs group-hover:text-emerald-600 transition-colors">
                                {pcat.name}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {pcat.itemCount} items available
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cart Trigger Button */}
          <button
            onClick={openCart}
            className="hidden sm:flex relative p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all items-center gap-2 shadow-2xs cursor-pointer shrink-0"
          >
            <ShoppingBag className="w-5 h-5 text-[#7eb343]" />
            <span className="font-bold text-xs">Cart</span>
            {mounted && cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#7eb343] text-white font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Auth/Role Indicator */}
          {mounted && user ? (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Link
                href={
                  role === 'ADMIN'
                    ? '/admin/dashboard'
                    : role === 'PROVIDER'
                    ? '/provider/dashboard'
                    : role === 'SELLER'
                    ? '/seller/dashboard'
                    : '/dashboard/customer'
                }
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#7eb343] border border-emerald-200 transition-all font-bold text-xs"
              >
                <User className="w-4 h-4" />
                <div className="text-left font-bold text-xs">
                  <div>{user.name}</div>
                  <div className="text-[9px] uppercase font-semibold text-[#7eb343]">
                    {role}
                  </div>
                </div>
              </Link>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:flex px-4 py-2.5 rounded-lg bg-[#7eb343] text-white font-bold text-xs hover:bg-[#6c9c36] transition-all shadow-2xs items-center gap-2 shrink-0"
            >
              <User className="w-4 h-4" />
              <span>Login</span>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-foreground hover:bg-secondary shrink-0"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar (Below Navbar on Mobile Devices) */}
      <div className="block lg:hidden px-4 pb-3 pt-1 border-t border-slate-100 bg-white">
        <div
          onClick={() => openSearch(searchQuery)}
          className="flex w-full items-center border border-slate-200 rounded-xl bg-slate-50 focus-within:ring-2 focus-within:ring-[#7eb343] focus-within:bg-white transition-all overflow-hidden shadow-2xs cursor-pointer"
        >
          <input
            type="text"
            readOnly
            onFocus={() => openSearch(searchQuery)}
            placeholder={isBn ? 'সার্চ করুন (ডিম, dim, mach, chal, ac...)' : 'Search in English, Bangla or Banglish...'}
            className="w-full bg-transparent px-3.5 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none cursor-pointer"
          />
          <button
            type="button"
            onClick={() => openSearch(searchQuery)}
            className="p-2.5 bg-[#7eb343] text-white hover:bg-[#6c9c36] transition-colors shrink-0"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-4 animate-in slide-in-from-top duration-200 max-h-[calc(100vh-140px)] overflow-y-auto pb-28 overscroll-contain shadow-2xl">
          <div className="space-y-2">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
              Categories & Navigation
            </div>

            {/* ── Submenu 1: Home Services Accordion ── */}
            <div className="border border-border/80 rounded-2xl overflow-hidden bg-card/50">
              <button
                type="button"
                onClick={() => setMobileSubmenuOpen(mobileSubmenuOpen === 'services' ? null : 'services')}
                className="w-full p-3 flex items-center justify-between font-bold text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <span>Home Services</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                    mobileSubmenuOpen === 'services' ? 'rotate-180 text-primary' : ''
                  }`}
                />
              </button>

              {mobileSubmenuOpen === 'services' && (
                <div className="px-3 pb-3 space-y-1 bg-secondary/30 border-t border-border/50 animate-in fade-in duration-200 pt-2">
                  {SERVICE_CATEGORIES.map((scat) => (
                    <Link
                      key={scat.id}
                      href={`/services/home-service/${scat.slug}`}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setMobileSubmenuOpen(null);
                      }}
                      className="flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-all"
                    >
                      <span>{scat.name}</span>
                      <span className="text-[10px] font-extrabold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Verified</span>
                    </Link>
                  ))}
                  <Link
                    href="/services/home-service"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setMobileSubmenuOpen(null);
                    }}
                    className="block text-center p-2 rounded-xl bg-primary text-primary-foreground font-black text-xs mt-2"
                  >
                    View All Services ➔
                  </Link>
                </div>
              )}
            </div>

            {/* ── Submenu 2: Grocery & Daily Needs Accordion ── */}
            <div className="border border-border/80 rounded-2xl overflow-hidden bg-card/50">
              <button
                type="button"
                onClick={() => setMobileSubmenuOpen(mobileSubmenuOpen === 'shopping' ? null : 'shopping')}
                className="w-full p-3 flex items-center justify-between font-bold text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span>Grocery & Daily Needs</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                    mobileSubmenuOpen === 'shopping' ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </button>

              {mobileSubmenuOpen === 'shopping' && (
                <div className="px-3 pb-3 space-y-1 bg-secondary/30 border-t border-border/50 animate-in fade-in duration-200 pt-2">
                  {displayCategories.map((pcat) => (
                    <Link
                      key={pcat.id}
                      href={`/category/${pcat.slug}`}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setMobileSubmenuOpen(null);
                      }}
                      className="flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-foreground hover:bg-emerald-500/10 hover:text-emerald-600 transition-all"
                    >
                      <span>{pcat.name}</span>
                      <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">{pcat.itemCount} {pcat.itemCount === 1 ? 'Item' : 'Items'}</span>
                    </Link>
                  ))}
                  <Link
                    href="/services/shopping"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setMobileSubmenuOpen(null);
                    }}
                    className="block text-center p-2 rounded-xl bg-emerald-600 text-white font-black text-xs mt-2"
                  >
                    Explore Full Market ➔
                  </Link>
                </div>
              )}
            </div>

            {/* General Direct Links */}
            <Link
              href="/offers"
              onClick={() => setMobileMenuOpen(false)}
              className="block p-3 rounded-2xl hover:bg-secondary text-sm font-bold border border-transparent hover:border-border"
            >
              🔥 Special Offers & Discounts
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block p-3 rounded-2xl hover:bg-secondary text-sm font-bold border border-transparent hover:border-border"
            >
              About dohsSheba
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block p-3 rounded-2xl hover:bg-secondary text-sm font-bold border border-transparent hover:border-border"
            >
              Contact Support
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
