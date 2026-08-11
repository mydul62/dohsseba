'use client';

import React, { useState, useEffect } from 'react';
import { ProductCard } from '@/components/common/ProductCard';
import { Flame, Clock } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api-client';
import { ALL_PRODUCTS } from '@/constants/products';

interface DealProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  originalPrice?: number;
  unit: string;
  image?: string;
  rating?: number;
  totalReviews?: number;
  reviewCount?: number;
  categorySlug?: string;
  categoryName?: string;
  categoryId?: string;
}

// Calculates seconds remaining until the next midnight (local time)
function getSecondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // next midnight
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

function secondsToHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return { hours: h, minutes: m, seconds: s };
}
const TABS = [
  { id: 'all',   label: 'All Hot Deals' },
  { id: 'veg',   label: '🍎 Vegetables & Fruits',  keywords: ['tomato', 'mango', 'potato', 'vegetable', 'fruit', 'onion', 'garlic'] },
  { id: 'meat',  label: '🥩 Meat & Fish',           keywords: ['beef', 'fish', 'chicken', 'meat', 'mutton', 'prawn', 'hilsa', 'seafood', 'poultry'] },
  { id: 'dairy', label: '🥛 Milk & Grocery',        keywords: ['milk', 'oil', 'rice', 'dairy', 'egg', 'ghee', 'grocery', 'grain', 'spice', 'flour'] },
];

export function DailyDealsSection() {
  const [activeTab, setActiveTab] = useState('all');
  const [products, setProducts]   = useState<DealProduct[]>(ALL_PRODUCTS as any[]);

  // Initialize to zeros to avoid SSR/client mismatch — real value set after mount
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    // Set immediately on mount with real remaining time
    setTimeLeft(secondsToHMS(getSecondsUntilMidnight()));
    const timer = setInterval(() => {
      setTimeLeft(secondsToHMS(getSecondsUntilMidnight()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch discounted / hot deal products from DB
  useEffect(() => {
    const API = getApiBaseUrl();
    const mapProduct = (p: any): DealProduct => ({
      id:           p.id,
      title:        p.name || p.title || 'Product',
      slug:         p.slug || p.id,
      price:        Number(p.price || 0),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : (p.discount && p.discount > 0 ? Math.round(Number(p.price) / (1 - Number(p.discount) / 100)) : undefined),
      unit:         (p.unitAmount ?? p.amount) ? `${p.unitAmount ?? p.amount} ${p.unit || 'unit'}` : (p.unit || 'unit'),
      image:        Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.image || undefined),
      rating:       p.rating ? Number(p.rating) : 0,
      totalReviews: Number(p.totalReviews ?? p.reviewCount ?? 0),
      reviewCount:  Number(p.totalReviews ?? p.reviewCount ?? 0),
      categorySlug: p.category?.slug || '',
      categoryName: p.category?.name || '',
      categoryId:   p.categoryId || p.category?.id || '',
    });

    // Fetch Flash Sale products from DB
    fetch(`${API}/products?flashSale=true&limit=12`)
      .then((r) => r.json())
      .then((res) => {
        let list: any[] = [];
        if (res?.success && Array.isArray(res.data)) {
          list = res.data;
        } else if (res?.success && Array.isArray(res.data?.products)) {
          list = res.data.products;
        }

        if (list.length > 0) {
          setProducts(list.map(mapProduct));
        } else {
          // Fallback to top discounted / popular products
            fetch(`${API}/products?limit=12`)
              .then((r2) => r2.json())
              .then((res2) => {
                let list2: any[] = [];
                if (res2?.success && Array.isArray(res2.data)) {
                  list2 = res2.data;
                } else if (res2?.success && Array.isArray(res2.data?.products)) {
                  list2 = res2.data.products;
                }

                if (list2.length > 0) {
                  setProducts(list2.map(mapProduct));
                } else {
                  setProducts(ALL_PRODUCTS as any[]);
                }
              })
              .catch(() => setProducts(ALL_PRODUCTS as any[]));
        }
      })
      .catch(() => setProducts([]));
  }, []);

  // Client-side tab filtering by category name keywords
  const filteredProducts = (products ?? []).filter((p) => {
    if (activeTab === 'all') return true;
    const tab = TABS.find((t) => t.id === activeTab);
    if (!tab || !tab.keywords) return true;
    const haystack = `${p.title} ${p.categoryName}`.toLowerCase();
    return tab.keywords.some((kw) => haystack.includes(kw));
  });

  return (
    <section className="py-6 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 bg-white font-sans text-slate-800">
      <div className="w-full max-w-[1720px] mx-auto space-y-6">

        {/* Header with Live Flash Timer */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>Super Flash Sale</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Ends In: {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s</span>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Fresh Deals of the Day
            </h2>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#7eb343] text-white border-[#7eb343] shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        {products === null ? (
          // Skeleton loading
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-slate-100 animate-pulse overflow-hidden">
                <div className="w-full aspect-square bg-slate-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-3/4 bg-slate-200 rounded" />
                  <div className="h-3 w-1/2 bg-slate-200 rounded" />
                  <div className="h-4 w-1/3 bg-slate-300 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          // Empty state
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm font-semibold">No deals found in this category yet.</p>
            <p className="text-xs mt-1">Check back soon for fresh deals!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {filteredProducts.map((product) => {
              const discountPercent = product.originalPrice
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;
              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  title={product.title}
                  slug={product.slug}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  unit={product.unit}
                  image={product.image}
                  rating={product.rating ?? 0}
                  totalReviews={(product as any).totalReviews ?? (product as any).reviewCount ?? 0}
                  badge={discountPercent > 0 ? `${discountPercent}% OFF` : undefined}
                  isHot={discountPercent > 20}
                  categorySlug={product.categorySlug}
                  categoryName={product.categoryName}
                />
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
