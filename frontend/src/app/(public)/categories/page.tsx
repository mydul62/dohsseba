import React from 'react';
import Link from 'next/link';
import { GetAllProductCategories } from '@/services/category';
import { SHOPPING_CATEGORIES } from '@/constants/products';
import { BreadcrumbNav } from '@/components/common/BreadcrumbNav';
import { LayoutGrid } from 'lucide-react';

export default async function AllCategoriesPage() {
  const res = await GetAllProductCategories();
  let categories: any[] = [];
  if (res?.success && Array.isArray(res.data)) {
    const parents = res.data.filter((cat: any) => !cat.parentId);
    categories = parents.length > 0 ? parents : res.data;
  }

  const displayList = categories.length > 0 ? categories : SHOPPING_CATEGORIES;

  return (
    <div className="py-6 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 w-full max-w-[1720px] mx-auto space-y-6 font-sans text-slate-800">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav
        items={[
          { label: 'Shopping Market', href: '/categories' },
          { label: 'All Categories' },
        ]}
      />

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 text-white space-y-2 shadow-lg border border-emerald-500/20">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300 border border-emerald-400/30">
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Explore Market Categories</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
          All Shopping Categories
        </h1>
        <p className="text-xs sm:text-sm text-emerald-200/80 max-w-xl">
          Select a category to view subcategories, special offers, and fresh local DOHS bazaar products.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 sm:gap-3.5">
        {displayList.map((cat: any) => {
          const subCount = Array.isArray(cat.children) ? cat.children.length : (cat.itemCount ?? 4);
          const catImage = cat.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80';

          return (
            <Link
              key={cat.id || cat.slug}
              href={`/category/${cat.slug}`}
              className="group flex flex-col bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs hover:shadow-md hover:border-emerald-500/50 transition-all duration-200 text-center"
            >
              <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                <img
                  src={catImage}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-2 sm:p-2.5 flex flex-col items-center justify-center space-y-0.5">
                <h3 className="font-bold text-[11px] sm:text-xs text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1 leading-snug">
                  {cat.name}
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">
                  {subCount > 0 ? `${subCount} subcategories` : 'View items'}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
