'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/common/ProductCard';
import { Search, Wrench, Loader2, Package } from 'lucide-react';
import Link from 'next/link';
import { getApiBaseUrl } from '@/lib/api-client';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('cat') || 'all';

  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      setServices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const API = getApiBaseUrl();

    Promise.all([
      fetch(`${API}/products?search=${encodeURIComponent(query)}&limit=24`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/services?search=${encodeURIComponent(query)}&limit=12`).then((r) => r.json()).catch(() => null),
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
      setLoading(false);
    });
  }, [query]);

  return (
    <div className="py-10 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 w-full max-w-[1720px] mx-auto space-y-8 font-sans text-slate-800">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#7eb343] text-white shrink-0 shadow-md">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Search Results for &quot;<span className="text-[#7eb343]">{query || 'All Items'}</span>&quot;
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Found {products.length} products & {services.length} home services in DOHS database
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#7eb343] gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-xs font-bold text-slate-500">Searching database...</p>
        </div>
      ) : products.length === 0 && services.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-slate-50 rounded-3xl border border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No items found matching &quot;{query}&quot;</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try searching with broader terms like &quot;milk&quot;, &quot;chicken&quot;, &quot;rice&quot;, &quot;ac&quot;, or &quot;electrician&quot;.
          </p>
        </div>
      ) : (
        <div className="space-y-10">

          {/* Products Results Section */}
          {products.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>🛒 Products ({products.length})</span>
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {products.map((p) => {
                  const disc = Number(p.discount || 0);
                  const price = Number(p.price || 0);
                  const orig = disc > 0 ? Math.round(price / (1 - disc / 100)) : undefined;
                  const discPct = orig ? Math.round(((orig - price) / orig) * 100) : 0;

                  return (
                    <ProductCard
                      key={p.id}
                      id={p.id}
                      title={p.name}
                      slug={p.slug || p.id}
                      price={price}
                      originalPrice={orig}
                      unit={p.unit}
                      image={Array.isArray(p.images) && p.images[0] ? p.images[0] : undefined}
                      badge={p.isFeatured ? 'HOT' : discPct > 0 ? `-${discPct}%` : undefined}
                      isHot={Boolean(p.isFeatured)}
                      rating={Number(p.rating || 0)}
                      totalReviews={p.totalReviews ?? p.reviewCount ?? 0}
                      categorySlug={p.category?.slug}
                      categoryName={p.category?.name}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Services Results Section */}
          {services.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>🔧 Home Services ({services.length})</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((svc) => (
                  <Link
                    key={svc.id}
                    href={`/services/home-service/${svc.slug || svc.id}`}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#7eb343] hover:shadow-md transition-all flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#7eb343] flex items-center justify-center font-bold shrink-0">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-[#7eb343]">Verified Service</span>
                      <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-[#7eb343] transition-colors">
                        {svc.title || svc.name}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{svc.description || 'Verified Technician'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-bold">Loading search results...</div>}>
      <SearchContent />
    </Suspense>
  );
}
