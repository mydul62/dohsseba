'use client';

import React, { useState, useMemo } from 'react';
import { SidebarCategoryMenu, MobileCategoryBar } from '@/components/shopping/SidebarCategoryMenu';
import { SubCategoryCard } from '@/components/shopping/SubCategoryCard';
import { BreadcrumbNav } from '@/components/common/BreadcrumbNav';
import { ProductCard } from '@/components/common/ProductCard';
import { ShoppingBag, Package, ArrowUpDown } from 'lucide-react';
import { ALL_PRODUCTS } from '@/constants/products';

interface CategoryPageClientProps {
  categorySlug: string;
  initialCategory: any;
  initialProducts: any[];
}

export function CategoryPageClient({
  categorySlug,
  initialCategory,
  initialProducts,
}: CategoryPageClientProps) {
  const [category] = useState<any>(initialCategory);
  
  const fallbackList = useMemo(() => {
    if (initialProducts && initialProducts.length > 0) return initialProducts;
    const lower = categorySlug.toLowerCase();
    const matched = ALL_PRODUCTS.filter((p: any) =>
      p.categorySlug?.toLowerCase().includes(lower) ||
      p.categoryName?.toLowerCase().includes(lower) ||
      lower.includes(p.categorySlug?.toLowerCase() || 'xyz')
    );
    return matched.length > 0 ? matched : ALL_PRODUCTS.slice(0, 12);
  }, [initialProducts, categorySlug]);

  const [products] = useState<any[]>(fallbackList);

  // Filters & Sorting
  const [sortBy, setSortBy] = useState('newest');
  const [inStockOnly, setInStockOnly] = useState(false);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (inStockOnly) list = list.filter((p) => Number(p.stock) > 0);

    if (sortBy === 'price_asc') list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === 'price_desc') list.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortBy === 'rating') list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    else list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return list;
  }, [products, sortBy, inStockOnly]);

  const categoryName = category?.name || categorySlug.replace(/-/g, ' ').toUpperCase();
  const subcategories = category?.children || [];

  return (
    <div className="py-6 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 w-full max-w-[1720px] mx-auto space-y-6 font-sans text-slate-800">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav
        items={[
          { label: 'Shopping Market', href: '/services/shopping' },
          { label: categoryName },
        ]}
      />

      {/* Top Mobile Subcategories Chips & Menu Drawer Toggle Bar */}
      <MobileCategoryBar
        currentCategorySlug={categorySlug}
        subcategories={subcategories}
        basePath="/category"
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar (Desktop Only) */}
        <div className="hidden lg:block shrink-0 w-64">
          <SidebarCategoryMenu
            currentCategorySlug={categorySlug}
            basePath="/category"
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 space-y-6 min-w-0">
          {/* Category Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white space-y-2 shadow-lg border border-purple-500/20">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-xs font-bold text-purple-300 border border-purple-400/30">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Category Overview</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight capitalize">
              {categoryName}
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/80 max-w-xl">
              {category?.description || `Explore top quality items under ${categoryName}. Fast 45-min delivery in DOHS.`}
            </p>
          </div>

          {/* Subcategories Grid Section */}
          {subcategories.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-extrabold text-base text-slate-900 flex items-center justify-between">
                <span>Explore Subcategories ({subcategories.length})</span>
              </h2>

              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
                {subcategories.map((sub: any) => (
                  <SubCategoryCard
                    key={sub.id}
                    subcategory={sub}
                    parentSlug={categorySlug}
                    basePath="/category"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Product Listing Section & Filters */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="font-bold text-xs text-slate-700">
                Found <span className="text-purple-700 font-extrabold">{filteredProducts.length}</span> Products
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Stock Toggle */}
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span>In Stock Only</span>
                </label>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-purple-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
                <Package className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
                <h3 className="font-extrabold text-slate-800 text-sm">No products found in {categoryName}</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Browse subcategories above or check back soon for fresh stock additions.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
                {filteredProducts.map((p: any) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    title={p.name || p.title}
                    slug={p.slug || p.id}
                    price={Number(p.price || 0)}
                    originalPrice={p.discount > 0 ? Math.round(Number(p.price) / (1 - Number(p.discount) / 100)) : undefined}
                    unit={p.unit || 'unit'}
                    unitAmount={p.unitAmount ?? p.amount}
                    image={Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.image || undefined)}
                    rating={Number(p.rating || 4.5)}
                    categorySlug={categorySlug}
                    categoryName={categoryName}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
