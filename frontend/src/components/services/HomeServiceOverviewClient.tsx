'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Clock, CheckCircle2, ChevronRight, Star } from 'lucide-react';
import { ServiceFilterSidebar } from '@/components/services/ServiceFilterSidebar';

export function HomeServiceOverviewClient({ initialServices }: { initialServices: any[] }) {
  const [maxPrice, setMaxPrice] = useState(5000);
  const [minRating, setMinRating] = useState(0);
  const [instantArrivalOnly, setInstantArrivalOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const [services] = useState<any[]>(initialServices);

  // Filter logic
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
    <div className="py-10 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 w-full max-w-[1720px] mx-auto space-y-8 font-sans">
      {/* Category Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white space-y-3 shadow-xl border border-blue-500/20">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/20 text-xs font-bold text-blue-300 border border-blue-400/30">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>DOHS Sheba Verified Company Services</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          All Managed Home Services
        </h1>
        <p className="text-sm text-blue-200/80 max-w-2xl">
          Book professional electrical, plumbing, AC maintenance, appliance repair, and home cleaning directly from the DOHS Sheba Service Team. Background-checked internal technicians dispatched on demand.
        </p>
      </div>

      {/* Content Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <ServiceFilterSidebar
          currentCategorySlug="all"
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

        {/* Services List */}
        <div className="flex-1 w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-lg text-slate-800">
              Available Services ({filteredServices.length})
            </h2>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Direct DOHS Sheba Service Team
            </span>
          </div>

          {filteredServices.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl bg-white space-y-2">
              <p className="font-extrabold text-lg text-slate-800">No services match your filters</p>
              <p className="text-xs text-slate-500">Try adjusting your price range or rating filters.</p>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs mt-2 hover:bg-blue-700"
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
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200 uppercase tracking-wider">
                        {service.category?.name || 'General Service'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        DOHS Sheba Verified
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
                        <span>{service.rating || 5.0} Score</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Company Technicians</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 gap-3 shrink-0">
                    <div className="text-left md:text-right">
                      <span className="text-xs text-slate-400 block font-medium">Service Fee</span>
                      <span className="text-2xl font-black text-slate-900">
                        ৳{service.price}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold block">
                        per {service.priceUnit || 'job'}
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
    </div>
  );
}
