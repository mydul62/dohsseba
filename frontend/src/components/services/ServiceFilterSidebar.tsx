'use client';

import React, { useState } from 'react';
import { SERVICE_CATEGORIES } from '@/constants/services';
import { ServiceCategorySlug } from '@/types/service';
import { SlidersHorizontal, Star, ShieldCheck, Clock, RefreshCw, X, Filter, Check } from 'lucide-react';
import Link from 'next/link';

interface ServiceFilterSidebarProps {
  currentCategorySlug: ServiceCategorySlug | 'all';
  maxPrice: number;
  setMaxPrice: (val: number) => void;
  minRating: number;
  setMinRating: (val: number) => void;
  instantArrivalOnly: boolean;
  setInstantArrivalOnly: (val: boolean) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (val: boolean) => void;
  onReset: () => void;
}

export function ServiceFilterSidebar({
  currentCategorySlug,
  maxPrice,
  setMaxPrice,
  minRating,
  setMinRating,
  instantArrivalOnly,
  setInstantArrivalOnly,
  verifiedOnly,
  setVerifiedOnly,
  onReset,
}: ServiceFilterSidebarProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const activeFiltersCount =
    (maxPrice < 5000 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (instantArrivalOnly ? 1 : 0) +
    (verifiedOnly ? 1 : 0);

  const currentCategoryName =
    currentCategorySlug === 'all'
      ? 'All Home Services'
      : SERVICE_CATEGORIES.find((c) => c.slug === currentCategorySlug)?.name || 'Home Services';

  return (
    <>
      {/* ── MOBILE VIEW: Top Horizontal Category Chips & Filter Trigger ── */}
      <div className="lg:hidden w-full space-y-3">
        {/* Horizontal Category Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Link
            href="/services/home-service"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border shrink-0 ${
              currentCategorySlug === 'all'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                : 'bg-card text-muted-foreground border-border/80 hover:text-foreground'
            }`}
          >
            All Services
          </Link>
          {SERVICE_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/services/home-service/${cat.slug}`}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border shrink-0 ${
                currentCategorySlug === cat.slug
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                  : 'bg-card text-muted-foreground border-border/80 hover:text-foreground'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Filter Trigger Control Strip */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border/80 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-extrabold text-xs text-foreground truncate max-w-[200px]">
              {currentCategoryName}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-extrabold text-xs transition-all active:scale-95 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── MOBILE BOTTOM SHEET FILTER MODAL ── */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-h-[85vh] overflow-y-auto rounded-t-3xl bg-card border-t border-border p-6 shadow-2xl space-y-6 animate-in slide-in-from-bottom duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2 font-black text-base text-foreground">
                <SlidersHorizontal className="w-5 h-5 text-blue-500" />
                <span>Service Filters</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price Filter */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground">Max Starting Price</span>
                <span className="text-blue-500 font-extrabold">৳{maxPrice}</span>
              </div>
              <input
                type="range"
                min="300"
                max="5000"
                step="100"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-2 bg-secondary rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>৳300</span>
                <span>৳5000</span>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2 border-t border-border pt-4">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Minimum Rating
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[4.9, 4.8, 4.5, 4.0].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setMinRating(rating === minRating ? 0 : rating)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      minRating === rating
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-sm'
                        : 'border-border bg-secondary/50 text-muted-foreground'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{rating}+ Stars</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="space-y-3 border-t border-border pt-4 text-xs font-semibold">
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/40 border border-border/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={instantArrivalOnly}
                  onChange={(e) => setInstantArrivalOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-input text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2 text-foreground font-bold">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>2-Hour Emergency Arrival</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/40 border border-border/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-input text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2 text-foreground font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Verified Partners Only</span>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onReset();
                  setMobileDrawerOpen(false);
                }}
                className="py-3 px-4 rounded-xl border border-border text-xs font-bold hover:bg-secondary transition-colors"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="py-3 px-4 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:block w-72 p-6 rounded-3xl border border-border/80 bg-card shadow-card space-y-6 flex-shrink-0">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2 font-extrabold text-base text-foreground">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <span>Filter Services</span>
          </div>
          <button
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Categories Switcher */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Category
          </label>
          <div className="space-y-1">
            <Link
              href="/services/home-service"
              className={`block px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                currentCategorySlug === 'all'
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              All Home Services
            </Link>
            {SERVICE_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/services/home-service/${cat.slug}`}
                className={`block px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  currentCategorySlug === cat.slug
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Pricing Policy Banner */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1 text-xs">
          <div className="font-extrabold text-emerald-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Inspection-Based Pricing</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
            Service charges are quoted manually by our team/technician after inspecting your exact requirement. No upfront payment required.
          </p>
        </div>

        {/* Rating Filter */}
        <div className="space-y-2 border-t border-border pt-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Minimum Rating
          </label>
          <div className="space-y-1">
            {[4.9, 4.8, 4.5, 4.0].map((rating) => (
              <button
                key={rating}
                onClick={() => setMinRating(rating === minRating ? 0 : rating)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  minRating === rating
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 font-bold'
                    : 'border-border hover:bg-secondary text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{rating} Stars & above</span>
                </div>
                {minRating === rating && <span className="text-[10px] uppercase font-mono">Selected</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Checkbox Options */}
        <div className="space-y-3 border-t border-border pt-4 text-xs font-semibold">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={instantArrivalOnly}
              onChange={(e) => setInstantArrivalOnly(e.target.checked)}
              className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
            />
            <div className="flex items-center gap-1.5 text-foreground">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>2-Hour Emergency Arrival</span>
            </div>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
            />
            <div className="flex items-center gap-1.5 text-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Verified Partners Only</span>
            </div>
          </label>
        </div>
      </aside>
    </>
  );
}
