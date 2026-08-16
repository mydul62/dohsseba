'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface SubCategoryCardProps {
  subcategory: {
    id: string;
    name: string;
    slug: string;
    image?: string;
    icon?: string;
    _count?: {
      products?: number;
    };
  };
  parentSlug: string;
  basePath?: string;
}

const FALLBACK_SUB_IMAGES: Record<string, string> = {
  // Cooking
  'colors-flavours': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=80',
  'dal-or-lentil': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
  'ghee': 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?w=400&auto=format&fit=crop&q=80',
  'oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80',
  'premium-ingredients': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&auto=format&fit=crop&q=80',
  'ready-mix': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80',
  'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
  'salt-sugar': 'https://images.unsplash.com/photo-1518110168401-f282472fc750?w=400&auto=format&fit=crop&q=80',
  'shemai-suji': 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400&auto=format&fit=crop&q=80',
  'special-ingredients-miscellaneous': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=80',
  'spices': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=80',

  // Fruits & Vegetables
  'fresh-fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&auto=format&fit=crop&q=80',
  'fresh-vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80',

  // Dairy
  'liquid-uht-milk': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&auto=format&fit=crop&q=80',
  'powder-milk': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80',
  'cheeses': 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400&auto=format&fit=crop&q=80',
  'yogurt-curd': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&auto=format&fit=crop&q=80',
  'condensed-milk-cream': 'https://images.unsplash.com/photo-1576186726115-4d51596775d1?w=400&auto=format&fit=crop&q=80',
  'eggs': 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400&auto=format&fit=crop&q=80',
  'butter-sour-cream': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format&fit=crop&q=80',

  // Meat & Fish
  'chicken-poultry': 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&auto=format&fit=crop&q=80',
  'dried-fish': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&auto=format&fit=crop&q=80',
  'frozen-fish': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&auto=format&fit=crop&q=80',
  'meat': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&auto=format&fit=crop&q=80',
  'premium-perishables': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
  'tofu-meat-alternatives': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'
};

export function SubCategoryCard({ subcategory, parentSlug, basePath = '/category' }: SubCategoryCardProps) {
  const fallbackUrl = FALLBACK_SUB_IMAGES[subcategory.slug] || FALLBACK_SUB_IMAGES.spices;
  const initialSrc = subcategory.image || fallbackUrl;
  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [hasError, setHasError] = useState(false);

  const href = `${basePath}/${subcategory.slug}`;

  const handleError = () => {
    if (imgSrc !== fallbackUrl) {
      setImgSrc(fallbackUrl);
    } else {
      setHasError(true);
    }
  };

  return (
    <Link
      href={href}
      className="group block p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all duration-300 transform hover:-translate-y-0.5 text-center"
    >
      <div className="relative w-full aspect-4/3 max-h-28 sm:max-h-32 mb-2 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center">
        {!hasError ? (
          <img
            src={imgSrc}
            alt={subcategory.name}
            onError={handleError}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 text-2xl font-bold">
            {subcategory.icon || '🛍️'}
          </div>
        )}
      </div>
      <h4 className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-purple-700 transition-colors line-clamp-1">
        {subcategory.name}
      </h4>
      {subcategory._count && (
        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
          {subcategory._count.products || 0} items
        </p>
      )}
    </Link>
  );
}
