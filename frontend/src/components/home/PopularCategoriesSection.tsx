'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CategoryCard } from '@/components/shopping/CategoryCard';
import { getApiBaseUrl } from '@/lib/api-client';
import { ChevronRight } from 'lucide-react';

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  image?: string;
  parentId?: string;
  isPopular?: boolean;
  displayOrder?: number;
  _count?: {
    products?: number;
    children?: number;
  };
}

export function PopularCategoriesSection() {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API = getApiBaseUrl();
    fetch(`${API}/product-categories`)
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          // 1. Filter ONLY top-level main parent categories (!c.parentId)
          // 2. Filter ONLY those marked as isPopular !== false
          const mainPopularCats = res.data.filter(
            (c: any) => !c.parentId && c.isPopular !== false
          );

          // 3. Sort strictly by seller-selected displayOrder ascending
          mainPopularCats.sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

          setCategories(mainPopularCats);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-6 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 bg-white font-sans text-slate-800">
      <div className="w-full max-w-[1720px] mx-auto space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Popular Categories
            </h2>
          </div>
          <Link
            href="/services/shopping"
            className="text-xs sm:text-sm font-extrabold text-purple-700 hover:text-purple-900 transition-colors flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Categories Grid - Skeleton loader shown if loading or if categories empty */}
        {loading || categories.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/60 shadow-xs text-center flex flex-col justify-between h-44 animate-pulse">
                <div className="w-full aspect-4/3 max-h-28 rounded-xl bg-slate-200/80 animate-pulse mb-3" />
                <div className="w-3/4 h-4 bg-slate-200 rounded mx-auto mb-1 animate-pulse" />
                <div className="w-1/2 h-3 bg-slate-100 rounded mx-auto animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {categories.map((cat) => (
              <CategoryCard key={cat.id || cat.slug} category={cat} basePath="/category" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
