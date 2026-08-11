'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ProductCategory, ProductCategorySlug, ProductItem } from '@/types/shopping';
import { ProductCard } from '@/components/cards/ProductCard';
import { ProductFilterSidebar } from '@/components/shopping/ProductFilterSidebar';
import { ShoppingBag, SlidersHorizontal, Loader2 } from 'lucide-react';
import { fetchApi } from '@/lib/api-client';

interface ShoppingCategoryClientProps {
  categorySlug: ProductCategorySlug | 'all' | string;
  currentCategory?: ProductCategory;
}

function isCategoryMatch(
  prodSlug: string = '',
  prodCatName: string = '',
  targetSlug: string = ''
): boolean {
  if (!targetSlug || targetSlug === 'all') return true;

  const clean = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]/g, '');

  const normTarget = clean(targetSlug);
  const normSlug = clean(prodSlug);
  const normName = clean(prodCatName);

  if (normSlug === normTarget || normName === normTarget) return true;

  if (normSlug.includes(normTarget) || normTarget.includes(normSlug)) return true;
  if (normName.includes(normTarget) || normTarget.includes(normName)) return true;

  return false;
}

export function ShoppingCategoryClient({
  categorySlug,
  currentCategory,
}: ShoppingCategoryClientProps) {
  const [dbProducts, setDbProducts] = useState<ProductItem[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

  const [maxPrice, setMaxPrice] = useState(3000);
  const [organicOnly, setOrganicOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('popular');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Fetch real products from backend API
  useEffect(() => {
    setLoadingDb(true);
    const catQuery = categorySlug && categorySlug !== 'all' ? `?category=${categorySlug}&limit=200` : '?limit=200';
    fetchApi<any>(`/products${catQuery}`)
      .then((res) => {
        if (res?.success && res.data) {
          const rawList = res.data.products || (Array.isArray(res.data) ? res.data : []);
          if (rawList.length > 0) {
            const mapped: ProductItem[] = rawList.map((p: any) => ({
              id: p.id,
              title: p.name || p.title || 'Untitled Product',
              slug: p.slug || p.id,
              categorySlug: p.category?.slug || p.categorySlug || 'general',
              categoryName: p.category?.name || p.categoryName || 'General',
              shopName: p.seller?.sellerProfile?.shopName || p.sellerProfile?.shopName || 'Green Market DOHS',
              price: Number(p.price || 0),
              originalPrice: p.originalPrice ? Number(p.originalPrice) : p.discount > 0 ? Math.round(Number(p.price) / (1 - Number(p.discount) / 100)) : undefined,
              unit: (p.unitAmount ?? p.amount) ? `${p.unitAmount ?? p.amount} ${p.unit || 'unit'}` : (p.unit || 'unit'),
              rating: p.rating || 4.8,
              reviewCount: p._count?.reviews || 24,
              image: Array.isArray(p.images) && p.images[0] ? p.images[0] : p.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80',
              stock: Number(p.stock ?? 50),
              isOrganic: Boolean(p.isOrganic),
              badge: p.discount > 0 ? `${p.discount}% OFF` : p.isFeatured ? 'HOT' : undefined,
              discountPercentage: p.discount || undefined,
              description: p.description || '',
            }));
            setDbProducts(mapped);
            return;
          }
        }
        setDbProducts([]);
      })
      .catch(() => setDbProducts([]))
      .finally(() => setLoadingDb(false));
  }, [categorySlug]);

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    let list = [...dbProducts];
    if (maxPrice) list = list.filter((p) => p.price <= maxPrice);
    if (organicOnly) list = list.filter((p) => p.isOrganic);
    if (inStockOnly) list = list.filter((p) => p.stock > 0);

    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => b.rating - a.rating);

    return list;
  }, [dbProducts, maxPrice, organicOnly, inStockOnly, sortBy]);

  const handleReset = () => {
    setMaxPrice(3000);
    setOrganicOnly(false);
    setInStockOnly(false);
    setSortBy('popular');
  };

  const activeFilterCount = (organicOnly ? 1 : 0) + (inStockOnly ? 1 : 0) + (maxPrice < 3000 ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* ── Mobile Filter Control Bar ── */}
      <div className="flex lg:hidden items-center justify-between p-3 rounded-2xl bg-card border border-border/80 shadow-sm gap-3">
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filter & Sort Groceries</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-emerald-700 font-black text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-10 px-3 rounded-xl border border-input bg-background font-semibold text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
        >
          <option value="popular">Popularity</option>
          <option value="price-asc">Price: Low ➔ High</option>
          <option value="price-desc">Price: High ➔ Low</option>
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <ProductFilterSidebar
            currentCategorySlug={categorySlug as ProductCategorySlug}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            organicOnly={organicOnly}
            setOrganicOnly={setOrganicOnly}
            inStockOnly={inStockOnly}
            setInStockOnly={setInStockOnly}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onReset={handleReset}
          />
        </div>

        {/* ── Mobile Filter Drawer Modal ── */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-background border border-border rounded-t-3xl sm:rounded-3xl p-6 space-y-6 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2 font-extrabold text-base text-foreground">
                  <SlidersHorizontal className="w-5 h-5 text-emerald-600" />
                  <span>Filter Groceries</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-all"
                >
                  ✕
                </button>
              </div>

              <ProductFilterSidebar
                currentCategorySlug={categorySlug as ProductCategorySlug}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                organicOnly={organicOnly}
                setOrganicOnly={setOrganicOnly}
                inStockOnly={inStockOnly}
                setInStockOnly={setInStockOnly}
                sortBy={sortBy}
                setSortBy={setSortBy}
                onReset={handleReset}
              />

              <div className="flex items-center gap-3 pt-4 border-t border-border sticky bottom-0 bg-background">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-3 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg"
                >
                  Apply Filters ({filteredProducts.length} Items)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Main Products Grid ── */}
        <div className="flex-1 w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">
              Found {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
            </h2>
            <span className="text-xs text-muted-foreground">Showing local DOHS bazaar items</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {loadingDb ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 rounded-3xl bg-secondary/50 animate-pulse" />
              ))
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full p-12 text-center border border-border rounded-3xl bg-card space-y-3">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto stroke-[1.5]" />
                <div className="space-y-1">
                  <p className="font-bold text-lg">No grocery products found in this category</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Try adjusting your price filter or reset to view all available items.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs mt-2 shadow-sm transition-all"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
