'use client';

import React, { useState, useEffect } from 'react';
import { ProductCard } from '@/components/common/ProductCard';
import { getApiBaseUrl } from '@/lib/api-client';
import { ALL_PRODUCTS } from '@/constants/products';

const PAGE_SIZE = 10;

interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  originalPrice?: number;
  unit: string;
  image?: string;
  rating?: number;
  soldCount?: number;
  badge?: string;
  isHot?: boolean;
  categorySlug?: string;
  categoryName?: string;
}

export function ForYouProductsSection() {
  const [products, setProducts]   = useState<Product[]>(ALL_PRODUCTS as any[]);
  const [loading, setLoading]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(true);

  const fetchProducts = async (pageNum: number, append = false) => {
    try {
      const API = getApiBaseUrl();
      const res = await fetch(`${API}/products?page=${pageNum}&limit=${PAGE_SIZE}&sort=newest`);
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        const mapped: Product[] = data.data.map((p: any) => {
          const disc = Number(p.discount || 0);
          const price = Number(p.price || 0);
          const originalPrice = disc > 0 ? Math.round(price / (1 - disc / 100)) : undefined;
          const discPct = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
          return {
            id:           p.id,
            title:        p.name || 'Product',
            slug:         p.slug || p.id,
            price,
            originalPrice,
            unit:         (p.unitAmount ?? p.amount) ? `${p.unitAmount ?? p.amount} ${p.unit || 'unit'}` : (p.unit || 'unit'),
            image:        Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : undefined,
            rating:       Number(p.rating || 0),
            totalReviews: Number(p.totalReviews ?? p.reviewCount ?? 0),
            reviewCount:  Number(p.totalReviews ?? p.reviewCount ?? 0),
            soldCount:    p._count?.orderItems || 0,
            badge:        p.isFeatured ? 'HOT' : discPct > 0 ? `-${discPct}%` : undefined,
            isHot:        Boolean(p.isFeatured),
            categorySlug: p.category?.slug || '',
            categoryName: p.category?.name || '',
          };
        });

        if (mapped.length === 0 && !append && pageNum === 1) {
          setProducts(ALL_PRODUCTS as any[]);
          setHasMore(false);
        } else {
          setProducts((prev) => append ? [...prev, ...mapped] : mapped);
          const meta = data.meta;
          if (meta) {
            setHasMore(pageNum < Math.ceil(meta.total / PAGE_SIZE));
          } else {
            setHasMore(data.data.length === PAGE_SIZE);
          }
        }
      } else {
        if (!append && pageNum === 1) setProducts(ALL_PRODUCTS as any[]);
        setHasMore(false);
      }
    } catch {
      if (!append && pageNum === 1) setProducts(ALL_PRODUCTS as any[]);
      setHasMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchProducts(1, false).finally(() => setLoading(false));
  }, []);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    await fetchProducts(nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

  return (
    <section className="py-6 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 bg-white font-sans text-slate-800">
      <div className="w-full max-w-[1720px] mx-auto space-y-6">

        {/* Section Header */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="text-xl">💖</span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            For You
          </h2>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          // Skeleton
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
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
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm font-semibold">No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {products.map((prod) => (
              <ProductCard
                key={prod.id}
                id={prod.id}
                title={prod.title}
                slug={prod.slug}
                price={prod.price}
                originalPrice={prod.originalPrice}
                unit={prod.unit}
                image={prod.image}
                badge={prod.badge}
                rating={prod.rating ?? 0}
                totalReviews={(prod as any).totalReviews ?? (prod as any).reviewCount ?? 0}
                soldCount={prod.soldCount}
                categorySlug={prod.categorySlug}
                categoryName={prod.categoryName}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!loading && hasMore && (
          <div className="pt-4 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-2.5 rounded-xl bg-[#7eb343] hover:bg-[#6c9c36] text-white font-extrabold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-60 flex items-center gap-2"
            >
              {loadingMore ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Loading...
                </>
              ) : 'Load More'}
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
