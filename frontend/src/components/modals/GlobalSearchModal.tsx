'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, X, Wrench, Loader2, Zap, Sparkles, TrendingUp, ArrowRight, Star, ShoppingBag } from 'lucide-react';
import { useSearchStore } from '@/store/useSearchStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useRouter } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api-client';

export function GlobalSearchModal() {
  const router = useRouter();
  const { isOpen, closeSearch, query, setQuery, category, setCategory } = useSearchStore();
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Initial featured & flash sale items when search opens before typing
  const [initialProducts, setInitialProducts] = useState<any[]>([]);
  const [initialServices, setInitialServices] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key press & body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeSearch]);

  // Fetch initial featured/flash sale products & popular services when search opens
  useEffect(() => {
    if (!isOpen) return;
    const API = getApiBaseUrl();
    setLoadingInitial(true);

    Promise.all([
      fetch(`${API}/products?flashSale=true&limit=6`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/services?limit=4`).then((r) => r.json()).catch(() => null),
    ]).then(([prodRes, svcRes]) => {
      if (prodRes?.success && Array.isArray(prodRes.data) && prodRes.data.length > 0) {
        setInitialProducts(prodRes.data);
      } else {
        // Fallback to featured or general products
        fetch(`${API}/products?limit=6`).then((r) => r.json()).then((res) => {
          if (res?.success && Array.isArray(res.data)) setInitialProducts(res.data);
        }).catch(() => {});
      }

      if (svcRes?.success && Array.isArray(svcRes.data)) {
        setInitialServices(svcRes.data);
      }
      setLoadingInitial(false);
    });
  }, [isOpen]);

  // Dynamic live search API call when query changes
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setProducts([]);
      setServices([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const API = getApiBaseUrl();

    const timer = setTimeout(() => {
      Promise.all([
        fetch(`${API}/products?search=${encodeURIComponent(trimmed)}&limit=8`).then((r) => r.json()).catch(() => null),
        fetch(`${API}/services?search=${encodeURIComponent(trimmed)}&limit=6`).then((r) => r.json()).catch(() => null),
      ]).then(([prodRes, svcRes]) => {
        if (prodRes?.success && Array.isArray(prodRes.data)) {
          setProducts(prodRes.data);
        } else {
          setProducts([]);
        }

        if (svcRes?.success && Array.isArray(svcRes.data)) {
          setServices(svcRes.data);
        } else {
          setServices([]);
        }
        setSearching(false);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!mounted || !isOpen) return null;

  const popularTags = [
    { label: 'DIM (ডিম)', val: 'dim' },
    { label: 'CHAL (চাল)', val: 'chal' },
    { label: 'MURGI (মুরগি)', val: 'murgi' },
    { label: 'MACH (মাছ)', val: 'mach' },
    { label: 'TEL (তেল)', val: 'tel' },
    { label: 'ALU (আলু)', val: 'alu' },
    { label: 'PEYAJ (পেঁয়াজ)', val: 'peyaj' },
    { label: 'AC REPAIR (এসি)', val: 'ac' },
    { label: 'ELECTRICIAN', val: 'electrician' },
  ];

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    closeSearch();
    router.push(`/search?q=${encodeURIComponent(query.trim())}&cat=${category}`);
  };

  const isTyping = query.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200 font-sans text-slate-800 p-2 sm:p-4 md:p-8 flex items-start justify-center">
      <div className="w-full max-w-[1400px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in zoom-in-95 duration-200">
        
        {/* Top Modal Navigation Bar */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#7eb343]" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base text-slate-900 leading-tight">Search DOHS Sheba</h2>
              <p className="text-[11px] text-slate-400 font-semibold hidden sm:block">Search in English, Bangla, or Banglish (egg, dim, mach, chal...)</p>
            </div>
          </div>

          <button
            onClick={closeSearch}
            className="p-2 sm:p-2.5 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-700 transition-all active:scale-95 cursor-pointer"
            title="Close Search (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-8 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Main Search Bar Form */}
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl border-2 border-slate-200 focus-within:border-[#7eb343] bg-slate-50/60 transition-all shadow-sm">
              
              {/* Category Selector */}
              <div className="flex items-center shrink-0 border-r border-slate-200 pr-1.5 sm:pr-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-transparent text-[11px] sm:text-xs font-bold text-slate-700 px-2 sm:px-3 py-2 sm:py-2.5 focus:outline-none cursor-pointer uppercase tracking-wider"
                >
                  <option value="all">ALL MARKET</option>
                  <option value="shopping">Groceries</option>
                  <option value="services">Services</option>
                </select>
              </div>

              {/* Text Input */}
              <div className="flex-1 flex items-center px-1.5 sm:px-2 gap-2 min-w-0">
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={language === 'BN' ? "সার্চ করুন বাংলা, English বা Banglish এ (যেমন: dim, ডিম, egg, mach, chal, ac...)" : "Search in English, Bangla or Banglish (e.g. egg, dim, mach, chal, ac...)"}
                  className="w-full text-xs sm:text-base font-medium text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none min-w-0"
                />
                {searching && <Loader2 className="w-4 h-4 text-[#7eb343] animate-spin shrink-0" />}
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Submit Search Button */}
              <button
                type="submit"
                className="px-3.5 sm:px-6 py-2 sm:py-3 bg-[#7eb343] hover:bg-[#6c9c36] text-white font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0 active:scale-95"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>

            {/* Quick Popular Tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1 shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-[#7eb343]" />
                Popular:
              </span>
              {popularTags.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQuery(tag.val)}
                  className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] uppercase transition-all cursor-pointer ${
                    query.toLowerCase() === tag.val.toLowerCase()
                      ? 'bg-[#7eb343] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </form>

        {/* Dynamic Live Search Results (When Typing) */}
        {isTyping ? (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-lg text-slate-900">
                Search Results for &quot;<span className="text-[#7eb343]">{query}</span>&quot;
              </h3>
              <span className="text-xs text-slate-500 font-semibold">
                {searching ? 'Searching...' : `${products.length + services.length} items found`}
              </span>
            </div>

            {searching ? (
              <div className="py-12 flex justify-center items-center text-[#7eb343] gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm font-semibold">Searching database...</span>
              </div>
            ) : products.length === 0 && services.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <p className="text-base font-semibold">No items match your search &quot;{query}&quot;</p>
                <p className="text-xs text-slate-400">Try searching for &quot;milk&quot;, &quot;chicken&quot;, &quot;mango&quot;, or &quot;ac service&quot;</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((prod) => (
                  <Link
                    key={prod.id}
                    href={`/services/shopping/product/${prod.slug || prod.id}`}
                    onClick={closeSearch}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 transition-all group shadow-xs hover:border-[#7eb343]"
                  >
                    <img
                      src={Array.isArray(prod.images) && prod.images[0] ? prod.images[0] : prod.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                      alt={prod.name || prod.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-100"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">{prod.category?.name || 'Grocery'}</span>
                      <h4 className="font-bold text-xs text-slate-800 truncate group-hover:text-[#7eb343] transition-colors">
                        {prod.name || prod.title}
                      </h4>
                      <div className="font-extrabold text-xs text-[#7eb343] mt-0.5">
                        ৳{prod.price} <span className="text-[10px] text-slate-400 font-normal">/ {(prod.unitAmount ?? prod.amount) ? `${prod.unitAmount ?? prod.amount} ${prod.unit || 'unit'}` : (prod.unit || 'unit')}</span>
                      </div>
                    </div>
                  </Link>
                ))}

                {services.map((svc) => (
                  <Link
                    key={svc.id}
                    href={`/services/home-service/${svc.slug || svc.id}`}
                    onClick={closeSearch}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all group shadow-xs hover:border-[#7eb343]"
                  >
                    <div className="w-14 h-14 rounded-xl bg-[#7eb343]/10 text-[#7eb343] flex items-center justify-center font-bold shrink-0">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-[#7eb343]">Home Service</span>
                      <h4 className="font-bold text-xs text-slate-800 truncate group-hover:text-[#7eb343] transition-colors">
                        {svc.title || svc.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">{svc.description || 'Verified Technician'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Default Rich Screen Before Typing: Flash Sales & Popular Services */
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* ⚡ Flash Sale & Hot Products Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500 text-white">
                    <Zap className="w-4 h-4 fill-white" />
                  </div>
                  <h3 className="font-black text-base text-slate-900 tracking-tight">
                    Flash Sales & Featured Items
                  </h3>
                </div>
                <Link
                  href="/services/shopping"
                  onClick={closeSearch}
                  className="text-xs font-bold text-[#7eb343] hover:underline flex items-center gap-1"
                >
                  <span>Explore Market</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loadingInitial ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : initialProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {initialProducts.map((prod) => (
                    <Link
                      key={prod.id}
                      href={`/services/shopping/product/${prod.slug || prod.id}`}
                      onClick={closeSearch}
                      className="group relative flex flex-col p-2.5 rounded-2xl bg-white border border-slate-200 hover:border-[#7eb343] hover:shadow-md transition-all text-left overflow-hidden"
                    >
                      {prod.discount > 0 && (
                        <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-rose-500 text-white font-extrabold text-[9px] uppercase tracking-wider shadow-xs">
                          -{prod.discount}%
                        </span>
                      )}
                      <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-50 shrink-0 mb-2">
                        <img
                          src={Array.isArray(prod.images) && prod.images[0] ? prod.images[0] : prod.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300'}
                          alt={prod.name || prod.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h4 className="font-bold text-xs text-slate-800 group-hover:text-[#7eb343] transition-colors leading-tight line-clamp-1">
                        {prod.name || prod.title}
                      </h4>
                      <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100">
                        <div className="font-black text-xs text-[#7eb343]">
                          ৳{prod.price}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{(prod.unitAmount ?? prod.amount) ? `${prod.unitAmount ?? prod.amount} ${prod.unit || 'unit'}` : (prod.unit || 'unit')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            {/* 🛠️ Popular Services Quick Cards */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-[#7eb343]">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-base text-slate-900 tracking-tight">
                    Popular Home Services in DOHS
                  </h3>
                </div>
                <Link
                  href="/services/home-service"
                  onClick={closeSearch}
                  className="text-xs font-bold text-[#7eb343] hover:underline flex items-center gap-1"
                >
                  <span>All Services</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {initialServices.length > 0 ? (
                  initialServices.map((svc) => (
                    <Link
                      key={svc.id}
                      href={`/services/home-service/${svc.slug || svc.id}`}
                      onClick={closeSearch}
                      className="group flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 hover:border-[#7eb343] hover:shadow-md transition-all"
                    >
                      <div className="w-11 h-11 rounded-xl bg-[#7eb343]/10 text-[#7eb343] flex items-center justify-center shrink-0">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-slate-800 group-hover:text-[#7eb343] transition-colors truncate">
                          {svc.title || svc.name}
                        </h4>
                        <span className="text-[10px] font-semibold text-amber-500 flex items-center gap-0.5 mt-0.5">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>4.9 (1.2k bookings)</span>
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  [
                    { name: 'AC Service & Repair', slug: 'ac-service' },
                    { name: 'Master Electrician', slug: 'electrician' },
                    { name: 'Plumbing & Leaks', slug: 'plumber' },
                    { name: 'House Deep Cleaning', slug: 'cleaner' },
                  ].map((svc, i) => (
                    <Link
                      key={i}
                      href={`/services/home-service/${svc.slug}`}
                      onClick={closeSearch}
                      className="group flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 hover:border-[#7eb343] hover:shadow-md transition-all"
                    >
                      <div className="w-11 h-11 rounded-xl bg-[#7eb343]/10 text-[#7eb343] flex items-center justify-center shrink-0">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-slate-800 group-hover:text-[#7eb343] transition-colors truncate">
                          {svc.name}
                        </h4>
                        <span className="text-[10px] font-semibold text-amber-500 flex items-center gap-0.5 mt-0.5">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>4.9 (Verified)</span>
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        </div>
      </div>
    </div>
  );
}
