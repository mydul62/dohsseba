'use client';

import React, { useState, useEffect } from 'react';
import { ProductCard } from '@/components/common/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/SkeletonLoaders';
import { Sparkles, Star, ChevronRight } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api-client';
import Link from 'next/link';
import { ALL_PRODUCTS } from '@/constants/products';

interface FeaturedProduct {
  id: string;
  name: string;
  title?: string;
  slug: string;
  price: number;
  discount?: number;
  unit?: string;
  unitAmount?: number;
  amount?: number;
  images?: string[];
  image?: string;
  rating?: number;
  category?: { name?: string; slug?: string };
}

export function FeaturedProductsSection({ initialProducts }: { initialProducts?: any[] }) {
  const [products, setProducts] = useState<FeaturedProduct[]>(
    initialProducts && initialProducts.length > 0 ? initialProducts : (ALL_PRODUCTS as any[])
  );

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) return;
    const API = getApiBaseUrl();
    fetch(`${API}/products?featured=true&limit=10`)
      .then((r) => r.json())
      .then((res) => {
        let list: any[] = [];
        if (res?.success && Array.isArray(res.data)) {
          list = res.data;
        } else if (res?.success && Array.isArray(res.data?.products)) {
          list = res.data.products;
        }

        // If no products marked as featured, fallback to fetching general top products
        if (list.length === 0) {
          fetch(`${API}/products?limit=8`)
            .then((r2) => r2.json())
            .then((res2) => {
              if (res2?.success && Array.isArray(res2.data)) {
                setProducts(res2.data);
              } else if (res2?.success && Array.isArray(res2.data?.products)) {
                setProducts(res2.data.products);
              } else {
                setProducts([]);
              }
            })
            .catch(() => setProducts([]));
        } else {
          setProducts(list);
        }
      })
      .catch(() => setProducts([]));
  }, [initialProducts]);

  if (products !== null && products.length === 0) return null;

  return (
    <section className="py-8 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 bg-gradient-to-b from-amber-500/5 via-slate-50 to-white font-sans text-slate-800 border-y border-amber-200/40">
      <div className="w-full max-w-[1720px] mx-auto space-y-5">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5 fill-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Featured Products
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider border border-amber-300">
                  Top Choice
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Handpicked top quality items selected by verified DOHS sellers
              </p>
            </div>
          </div>

          <Link
            href="/services/shopping?featured=true"
            className="text-xs sm:text-sm font-extrabold text-amber-700 hover:text-amber-900 transition-colors flex items-center gap-1 self-end sm:self-center"
          >
            <span>Explore All Featured</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Cards Grid */}
        {products === null ? (
          <ProductGridSkeleton count={5} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {products.map((p) => {
              const prodTitle = p.name || p.title || 'Featured Product';
              const prodImage = Array.isArray(p.images) && p.images.length > 0
                ? p.images[0]
                : (p.image || undefined);
              const originalPrice = (p.discount || 0) > 0
                ? Math.round(Number(p.price) / (1 - Number(p.discount) / 100))
                : undefined;

              return (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  title={prodTitle}
                  slug={p.slug || p.id}
                  price={Number(p.price || 0)}
                  originalPrice={originalPrice}
                  unit={p.unit || 'unit'}
                  unitAmount={p.unitAmount ?? p.amount}
                  image={prodImage}
                  rating={Number(p.rating || 0)}
                  totalReviews={(p as any).totalReviews ?? (p as any).reviewCount ?? 0}
                  categorySlug={p.category?.slug}
                  categoryName={p.category?.name}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
