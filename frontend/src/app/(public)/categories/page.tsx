'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api-client';
import { BreadcrumbNav } from '@/components/common/BreadcrumbNav';
import { LayoutGrid, Loader2, Package, ChevronRight, Layers } from 'lucide-react';

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  image?: string;
  parentId?: string;
  displayOrder?: number;
  children?: any[];
  _count?: {
    products?: number;
    children?: number;
  };
}

const FALLBACK_IMAGES: Record<string, string> = {
  vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
  fruits: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&auto=format&fit=crop&q=80',
  meat: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&auto=format&fit=crop&q=80',
  fish: 'https://images.unsplash.com/photo-1534942519507-769d4679447d?w=500&auto=format&fit=crop&q=80',
  dairy: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80',
  cooking: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80',
};

export default function AllCategoriesPage() {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<any[]>('/product-categories')
      .then((res) => {
        if (res && res.success && Array.isArray(res.data)) {
          // 1. Filter ONLY top-level main parent categories (!c.parentId)
          const parents = res.data.filter((cat: any) => !cat.parentId);
          
          // 2. Sort strictly by seller-selected displayOrder ascending
          parents.sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

          setCategories(parents);
        }
      })
      .catch((err) => {
        console.error('Failed to load categories:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-6 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 w-full max-w-[1720px] mx-auto space-y-6 font-sans text-slate-800">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav
        items={[
          { label: 'Shopping Market', href: '/services/shopping' },
          { label: 'All Categories' },
        ]}
      />

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 text-white space-y-2 shadow-lg border border-emerald-500/20">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300 border border-emerald-400/30">
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Explore Market Categories</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
          All Main Shopping Categories
        </h1>
        <p className="text-xs sm:text-sm text-emerald-200/80 max-w-xl">
          Select a category to view subcategories, special offers, and fresh local DOHS bazaar products.
        </p>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
          <Layers className="w-10 h-10 mx-auto text-slate-300 opacity-60" />
          <h3 className="font-extrabold text-slate-800 text-sm">No main categories found</h3>
          <p className="text-xs text-slate-500">Categories will appear here once created in seller dashboard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const subCount = Array.isArray(cat.children) ? cat.children.length : (cat._count?.children ?? 0);
            const catImage = cat.image || FALLBACK_IMAGES[cat.slug] || FALLBACK_IMAGES.vegetables;

            return (
              <Link
                key={cat.id || cat.slug}
                href={`/category/${cat.slug}`}
                className="group flex flex-col bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all duration-300 transform hover:-translate-y-1 text-center"
              >
                <div className="relative aspect-square w-full bg-slate-50 overflow-hidden flex items-center justify-center p-2">
                  <img
                    src={catImage}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMAGES.vegetables;
                    }}
                  />
                </div>
                <div className="p-2.5 flex flex-col items-center justify-center space-y-0.5">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-1 leading-snug">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {subCount > 0 ? `${subCount} subcategories` : 'Explore items'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
