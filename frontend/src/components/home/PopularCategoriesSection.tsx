'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CategoryCard } from '@/components/shopping/CategoryCard';
import { getApiBaseUrl } from '@/lib/api-client';
import { ChevronLeft, ChevronRight, Grid } from 'lucide-react';

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
          // Flatten all categories + subcategories that are marked popular
          const allCats: CategoryNode[] = [];
          res.data.forEach((parent: any) => {
            if (parent.isPopular !== false) {
              allCats.push(parent);
            }
            if (Array.isArray(parent.children)) {
              parent.children.forEach((child: any) => {
                if (child.isPopular !== false) {
                  allCats.push(child);
                }
              });
            }
          });

          // Sort by displayOrder ascending
          allCats.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

          setCategories(allCats.length > 0 ? allCats : res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayList = categories;

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

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-4/3 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {displayList.slice(0, 18).map((cat) => (
              <CategoryCard key={cat.id || cat.slug} category={cat} basePath="/category" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
