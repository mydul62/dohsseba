'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  ChevronRight,
  Carrot,
  Beef,
  Fish,
  Milk,
  ShoppingBag,
  Zap,
  Flame,
  PhoneCall,
  Star,
  Plus,
  Minus,
  Heart,
  Tag,
  Package,
  Sparkles,
  Layers
} from 'lucide-react';
import { useCategoryDrawerStore } from '@/store/useCategoryDrawerStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useCartStore } from '@/store/useCartStore';
import { fetchApi } from '@/lib/api-client';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image?: string;
  parentId?: string | null;
  children?: CategoryItem[];
  _count?: { products: number };
}

export function CategorySideDrawer() {
  const { isOpen, closeDrawer } = useCategoryDrawerStore();
  const { language } = useLanguageStore();
  const isBn = language === 'BN';
  const { addItem } = useCartStore();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('');
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [loadingProds, setLoadingProds] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Fetch Dynamic Main Categories from Backend Database ──
  useEffect(() => {
    if (!mounted || !isOpen) return;

    const loadDynamicCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await fetchApi<any[]>('/product-categories').catch(() => null);
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const parents = res.data.filter((c: any) => !c.parentId);
          setCategories(parents);
          if (parents.length > 0 && !activeCategorySlug) {
            setActiveCategorySlug(parents[0].slug);
          }
        } else {
          // Fallback categories if API returned empty
          const fallback = [
            { id: 'cat_1', name: 'Vegetables & Fruits', slug: 'vegetables-fruits', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400' },
            { id: 'cat_2', name: 'Meat & Poultry',       slug: 'meat-poultry',       image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400' },
            { id: 'cat_3', name: 'Seafood & Fish',       slug: 'seafood-fish',       image: 'https://images.unsplash.com/photo-1534942519507-769d4679447d?w=400' },
            { id: 'cat_4', name: 'Dairy & Eggs',         slug: 'dairy-eggs',         image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
            { id: 'cat_5', name: 'Bakery & Snacks',      slug: 'bakery-snacks',      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400' },
            { id: 'cat_6', name: 'Beverages & Juices',   slug: 'beverages-juices',   image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400' },
          ];
          setCategories(fallback);
          if (!activeCategorySlug) setActiveCategorySlug('vegetables-fruits');
        }
      } catch (err) {
        console.error('Failed to load dynamic categories for drawer:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadDynamicCategories();
  }, [mounted, isOpen]);

  // ── Fetch Dynamic Products for Selected Category ──
  useEffect(() => {
    if (!activeCategorySlug) return;
    const loadCategoryProducts = async () => {
      try {
        setLoadingProds(true);
        const res = await fetchApi<any>(`/products?category=${activeCategorySlug}&limit=6`).catch(() => null);
        if (res && res.success && res.data) {
          const prods = Array.isArray(res.data) ? res.data : res.data.products || [];
          setCategoryProducts(prods);
        } else {
          setCategoryProducts([]);
        }
      } catch (_) {
        setCategoryProducts([]);
      } finally {
        setLoadingProds(false);
      }
    };

    loadCategoryProducts();
  }, [activeCategorySlug]);

  if (!mounted || !isOpen) return null;

  const currentCategory = categories.find((c) => c.slug === activeCategorySlug) || categories[0];
  const subCategories = currentCategory?.children || [];

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-500 font-sans text-slate-800">
      {/* Backdrop Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500" onClick={closeDrawer} />

      {/* Main Drawer + Mega Submenu Flyout Container */}
      <div className="relative flex h-full max-w-[95vw] z-10 animate-in slide-in-from-left duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
        
        {/* ── Left Column: Category List Menu (Dynamic Main Categories) ── */}
        <div className="w-64 sm:w-72 bg-white h-full shadow-2xl flex flex-col shrink-0 border-r border-slate-200">
          <div className="p-4 bg-[#7eb343] text-white flex items-center justify-between font-bold text-sm shadow">
            <div className="flex items-center gap-2">
              <Menu className="w-5 h-5" />
              <span>Main Categories</span>
            </div>
            <button onClick={closeDrawer} className="p-1 hover:bg-[#6c9c36] rounded-md cursor-pointer transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dynamic Main Categories List with Skeleton Loader */}
          <div className="flex-1 overflow-y-auto py-2 divide-y divide-slate-100">
            {loadingCategories ? (
              <div className="p-3 space-y-2.5 animate-pulse">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-6 h-6 rounded-md bg-slate-200 shrink-0" />
                      <div className="h-4 bg-slate-200 rounded w-32" />
                    </div>
                    <div className="w-4 h-4 bg-slate-200 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              categories.map((cat) => {
                const isSelected = activeCategorySlug === cat.slug;
                const linkHref = `/category/${cat.slug}`;

                return (
                  <div
                    key={cat.id}
                    onMouseEnter={() => setActiveCategorySlug(cat.slug)}
                    onClick={() => setActiveCategorySlug(cat.slug)}
                    className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors text-sm font-medium ${
                      isSelected ? 'bg-slate-50 text-[#7eb343] font-bold border-l-4 border-[#7eb343]' : 'text-slate-700 hover:text-[#7eb343] hover:bg-slate-50'
                    }`}
                  >
                    <Link
                      href={linkHref}
                      onClick={closeDrawer}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-6 h-6 rounded-md object-cover shrink-0 border border-slate-200" />
                      ) : (
                        <Tag className={`w-4 h-4 ${isSelected ? 'text-[#7eb343]' : 'text-slate-400'}`} />
                      )}
                      <span className="truncate">{cat.name}</span>
                    </Link>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-[#7eb343] translate-x-1' : 'text-slate-300'} transition-all`} />
                  </div>
                );
              })
            )}

            {/* Special Offers Link */}
            {!loadingCategories && (
              <div className="flex items-center justify-between px-4 py-3.5 cursor-pointer text-sm font-bold text-amber-600 hover:bg-amber-50">
                <Link href="/offers" onClick={closeDrawer} className="flex items-center gap-3 flex-1">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Special Offers & Deals</span>
                </Link>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-[#7eb343]" />
              <span>DOHS Helpline: (09612) 238-7908</span>
            </div>
          </div>
        </div>

        {/* ── Right Column: Mega Subcategory & Products Flyout Panel ── */}
        <div className="hidden md:flex flex-col w-[440px] sm:w-[480px] bg-white h-full shadow-2xl overflow-y-auto p-6 space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border-r border-slate-200">
          {loadingCategories ? (
            /* Skeleton Loading State for Right Flyout Panel */
            <div className="space-y-6 animate-pulse">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <div className="space-y-2">
                  <div className="h-6 bg-slate-200 rounded w-40" />
                  <div className="h-3.5 bg-slate-200 rounded w-56" />
                </div>
                <div className="h-4 bg-slate-200 rounded w-16" />
              </div>

              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-28" />
                <div className="grid grid-cols-2 gap-2.5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="w-9 h-9 rounded-lg bg-slate-200 shrink-0" />
                      <div className="h-3.5 bg-slate-200 rounded w-24" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-28 rounded-2xl bg-slate-100 border border-slate-200" />

              <div className="space-y-3 pt-2">
                <div className="h-4 bg-slate-200 rounded w-36" />
                <div className="grid grid-cols-3 gap-2.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border border-slate-100 p-2 bg-white space-y-2">
                      <div className="aspect-square rounded-lg bg-slate-100" />
                      <div className="h-3 bg-slate-200 rounded w-full" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : currentCategory ? (
            <>
              {/* 1. Category Title */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">{currentCategory.name}</h3>
                  <p className="text-xs text-slate-400">Explore subcategories and fresh bazaar items</p>
                </div>
                <Link
                  href={`/category/${currentCategory.slug}`}
                  onClick={closeDrawer}
                  className="text-xs font-bold text-[#7eb343] hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* 2. Subcategories Grid */}
              {subCategories.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#7eb343]" /> Subcategories
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    {subCategories.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/category/${currentCategory.slug}/${sub.slug}`}
                        onClick={closeDrawer}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-[#7eb343] hover:bg-emerald-50/50 transition-all group shadow-2xs"
                      >
                        <img
                          src={sub.image || currentCategory.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100'}
                          alt={sub.name}
                          className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200"
                        />
                        <span className="font-bold text-xs text-slate-800 group-hover:text-[#7eb343] truncate">
                          {sub.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400">
                  Main Category: <strong className="text-slate-700">{currentCategory.name}</strong>
                </div>
              )}

              {/* 3. Promotional Banner */}
              <div className="relative rounded-2xl overflow-hidden p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shadow-md group">
                <div className="max-w-[200px] space-y-2 z-10">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-white uppercase tracking-wider">
                    Express Delivery
                  </span>
                  <h4 className="font-black text-sm text-white leading-snug">
                    45-Min Doorstep Delivery in DOHS
                  </h4>
                  <Link
                    href={`/category/${currentCategory.slug}`}
                    onClick={closeDrawer}
                    className="inline-block px-4 py-1.5 rounded-lg bg-white text-emerald-800 font-bold text-xs shadow-2xs transition-all active:scale-95 hover:bg-slate-100"
                  >
                    Shop Now
                  </Link>
                </div>
                <img
                  src={currentCategory.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300'}
                  alt=""
                  className="w-24 h-24 object-cover rounded-xl group-hover:scale-105 transition-transform shrink-0 border-2 border-white/20 shadow"
                />
              </div>

              {/* 4. Live Products for Selected Category */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Products in {currentCategory.name}
                </h4>

                {loadingProds ? (
                  <div className="grid grid-cols-3 gap-2.5 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-xl border border-slate-100 p-2 bg-white space-y-2">
                        <div className="aspect-square rounded-lg bg-slate-100" />
                        <div className="h-3 bg-slate-200 rounded w-full" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : categoryProducts.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-400">
                    No items listed yet in {currentCategory.name}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5">
                    {categoryProducts.slice(0, 3).map((prod) => {
                      const img = Array.isArray(prod.images) && prod.images.length > 0 ? prod.images[0] : (prod.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200');
                      return (
                        <Link
                          key={prod.id}
                          href={`/services/shopping/product/${prod.slug || prod.id}`}
                          onClick={closeDrawer}
                          className="group relative rounded-xl border border-slate-100 p-2 bg-white hover:shadow-md hover:border-[#7eb343] transition-all flex flex-col justify-between"
                        >
                          <div className="aspect-square rounded-lg overflow-hidden bg-slate-50 mb-1.5 border border-slate-100">
                            <img src={img} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          </div>
                          <h5 className="font-bold text-[11px] text-slate-800 truncate group-hover:text-[#7eb343]">{prod.name || prod.title}</h5>
                          <p className="font-extrabold text-xs text-[#7eb343] mt-0.5">৳{prod.price}</p>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
