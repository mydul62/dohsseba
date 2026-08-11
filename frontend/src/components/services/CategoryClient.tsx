'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getApiBaseUrl } from '@/lib/api-client';
import { ServiceCategory, ServiceCategorySlug } from '@/types/service';
import { ServiceFilterSidebar } from '@/components/services/ServiceFilterSidebar';
import { Wrench, ShieldCheck, Clock, CheckCircle2, ChevronRight, Star } from 'lucide-react';

interface CategoryClientProps {
  categorySlug: ServiceCategorySlug;
  currentCategory?: ServiceCategory;
}

export function CategoryClient({ categorySlug, currentCategory }: CategoryClientProps) {
  const [maxPrice, setMaxPrice] = useState(5000);
  const [minRating, setMinRating] = useState(0);
  const [instantArrivalOnly, setInstantArrivalOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API = getApiBaseUrl();
    fetch(`${API}/services?category=${encodeURIComponent(categorySlug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.data?.services)) {
          setServices(data.data.services);
        } else if (Array.isArray(data?.data)) {
          setServices(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [categorySlug]);

  const filteredServices = services.filter((s) => {
    if (s.price > maxPrice) return false;
    if ((s.rating || 5) < minRating) return false;
    return true;
  });

  const handleReset = () => {
    setMaxPrice(5000);
    setMinRating(0);
    setInstantArrivalOnly(false);
    setVerifiedOnly(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start font-sans">
      <ServiceFilterSidebar
        currentCategorySlug={categorySlug}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        minRating={minRating}
        setMinRating={setMinRating}
        instantArrivalOnly={instantArrivalOnly}
        setInstantArrivalOnly={setInstantArrivalOnly}
        verifiedOnly={verifiedOnly}
        setVerifiedOnly={setVerifiedOnly}
        onReset={handleReset}
      />

      <div className="flex-1 w-full space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-lg text-slate-800">
            Services Available ({filteredServices.length})
          </h2>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Managed by DOHS Sheba Service Team
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 rounded-3xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl bg-white space-y-3">
            <Wrench className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <p className="font-extrabold text-lg text-slate-800">No services found in this category</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try adjusting your price filter or browse all managed services.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs mt-2"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200 uppercase">
                      {service.category?.name || currentCategory?.name || categorySlug}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified Team
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xl hover:text-blue-600 transition-colors">
                      <Link href={`/services/home-service/book/${service.id}`}>
                        {service.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                      {service.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Est. Duration: {service.estimatedDuration || '1-2 Hours'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{service.rating || 5.0} Rating</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Company Technicians Assigned</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 gap-3 shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">Service Pricing</span>
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full inline-block my-1">
                      Handled After Inspection
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold block">
                      (পরিদর্শনের পর বাজেট নির্ধারণ)
                    </span>
                  </div>

                  <Link
                    href={`/services/home-service/book/${service.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-colors w-full md:w-auto shadow-sm"
                  >
                    <span>Book Service</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
