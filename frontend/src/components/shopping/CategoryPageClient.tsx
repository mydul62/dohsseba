'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { SidebarCategoryMenu, MobileCategoryBar } from '@/components/shopping/SidebarCategoryMenu';
import { SubCategoryCard } from '@/components/shopping/SubCategoryCard';
import { BreadcrumbNav } from '@/components/common/BreadcrumbNav';
import { ProductCard } from '@/components/common/ProductCard';
import { fetchApi } from '@/lib/api-client';
import { 
  ShoppingBag, 
  Package, 
  ArrowUpDown, 
  Loader2, 
  Search, 
  Sparkles, 
  Zap, 
  Grid,
  Filter,
  Check
} from 'lucide-react';

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
  const [category, setCategory] = useState<any>(initialCategory);
  const [products, setProducts] = useState<any[]>(initialProducts || []);
  const [loading, setLoading] = useState(false);

  // Subcategory filter selection
  const [selectedSubSlug, setSelectedSubSlug] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync state whenever props or URL slug change
  useEffect(() => {
    setCategory(initialCategory);
    setProducts(initialProducts || []);
    setSelectedSubSlug('all');
    setSearchQuery('');
  }, [initialCategory, initialProducts, categorySlug]);

  // Client-side fallback fetch if category or products are empty
  useEffect(() => {
    if (categorySlug) {
      setLoading(true);
      Promise.all([
        fetchApi<any>(`/product-categories/slug/${encodeURIComponent(categorySlug)}`).catch(() => null),
        fetchApi<any>(`/products?category=${encodeURIComponent(categorySlug)}&limit=100`).catch(() => null),
      ])
        .then(([catRes, prodRes]) => {
          if (catRes?.success && catRes.data) {
            setCategory(catRes.data);
          }
          if (prodRes?.success) {
            const list = Array.isArray(prodRes.data)
              ? prodRes.data
              : Array.isArray(prodRes.data?.products)
              ? prodRes.data.products
              : [];
            if (list.length > 0) setProducts(list);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [categorySlug]);

  // Filters & Sorting
  const [sortBy, setSortBy] = useState('newest');
  const [inStockOnly, setInStockOnly] = useState(false);

  const subcategories = category?.children || [];

  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Subcategory filter
    if (selectedSubSlug !== 'all') {
      list = list.filter(
        (p) =>
          p.category?.slug?.toLowerCase() === selectedSubSlug.toLowerCase() ||
          p.categorySlug?.toLowerCase() === selectedSubSlug.toLowerCase()
      );
    }

    // Search query filter inside category
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // In Stock filter
    if (inStockOnly) {
      list = list.filter((p) => Number(p.stock) > 0);
    }

    // Sorting
    if (sortBy === 'price_asc') list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === 'price_desc') list.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortBy === 'rating') list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    else list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return list;
  }, [products, selectedSubSlug, searchQuery, sortBy, inStockOnly]);

  const categoryName = category?.name || categorySlug.replace(/-/g, ' ').toUpperCase();
  const categoryImage = category?.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&auto=format&fit=crop&q=80';

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
          {/* Category Banner with Dynamic Background */}
          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 group">
            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0 bg-slate-900">
              <img
                src={categoryImage}
                alt={categoryName}
                className="w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&auto=format&fit=crop&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-purple-950/70" />
            </div>

            {/* Banner Text Content */}
            <div className="relative p-6 sm:p-8 md:p-10 text-white space-y-3 z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/25 text-xs font-black text-purple-300 border border-purple-400/30 backdrop-blur-md">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Category Collection
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-xs font-extrabold text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
                  <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  ⚡ 45-Min Delivery in Savar DOHS
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight capitalize text-white drop-shadow-md">
                {categoryName}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {category?.description || `Explore our handpicked selection of ${categoryName} items. Order fresh products online with express doorstep delivery.`}
              </p>

              <div className="pt-2 flex items-center gap-4 text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/10">
                  <Package className="w-4 h-4 text-purple-400" />
                  {products.length} Products Available
                </span>
                {subcategories.length > 0 && (
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/10">
                    <Grid className="w-4 h-4 text-indigo-400" />
                    {subcategories.length} Subcategories
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Subcategories Grid Cards */}
          {subcategories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <span>Explore Subcategories</span>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {subcategories.length}
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {subcategories.map((sub: any) => (
                  <SubCategoryCard
                    key={sub.id || sub.slug}
                    subcategory={sub}
                    parentSlug={categorySlug}
                    basePath="/category"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Filter Bar & Product Search Toolbar */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              {/* Search Inside Category */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search inside ${categoryName}...`}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Toolbar Controls */}
              <div className="flex items-center gap-3 flex-wrap shrink-0">
                <span className="text-xs font-bold text-slate-600">
                  Showing <strong className="text-purple-700">{filteredProducts.length}</strong> items
                  {loading && <Loader2 className="inline ml-1.5 w-3.5 h-3.5 text-purple-600 animate-spin" />}
                </span>

                {/* Stock Toggle */}
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span>In Stock</span>
                </label>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-slate-800 text-xs font-extrabold focus:outline-none cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Subcategory Filter Pills Bar */}
            {subcategories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedSubSlug('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 border ${
                    selectedSubSlug === 'all'
                      ? 'bg-purple-700 text-white border-purple-700 shadow-md shadow-purple-700/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
                  }`}
                >
                  All Products ({products.length})
                </button>
                {subcategories.map((sub: any) => {
                  const isSelected = selectedSubSlug.toLowerCase() === sub.slug?.toLowerCase();
                  return (
                    <button
                      key={sub.id || sub.slug}
                      type="button"
                      onClick={() => setSelectedSubSlug(sub.slug)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-purple-700 text-white border-purple-700 shadow-md shadow-purple-700/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <span>{sub.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3 shadow-xs">
                <Package className="w-12 h-12 mx-auto text-slate-300" />
                <h3 className="font-extrabold text-slate-800 text-base">No products found in {categoryName}</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `No items match "${searchQuery}". Try clearing search filters.`
                    : 'Check back soon for fresh stock additions.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 rounded-xl bg-purple-100 text-purple-700 text-xs font-extrabold hover:bg-purple-200 transition-colors"
                  >
                    Clear Search Filter
                  </button>
                )}
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
                    rating={Number(p.rating || 0)}
                    totalReviews={p.totalReviews ?? p.reviewCount ?? 0}
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
