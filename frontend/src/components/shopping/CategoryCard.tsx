'use client';

import React from 'react';
import Link from 'next/link';

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    slug: string;
    image?: string;
    _count?: {
      products?: number;
      children?: number;
    };
  };
  basePath?: string;
}

const FALLBACK_IMAGES: Record<string, string> = {
  vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80',
  fruits: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&auto=format&fit=crop&q=80',
  meat: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&auto=format&fit=crop&q=80',
  fish: 'https://images.unsplash.com/photo-1534942519507-769d4679447d?w=400&auto=format&fit=crop&q=80',
  dairy: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80',
  cooking: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
  beverages: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80',
  cleaning: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&auto=format&fit=crop&q=80',
};

export function CategoryCard({ category, basePath = '/category' }: CategoryCardProps) {
  const imgSrc = category.image || FALLBACK_IMAGES[category.slug] || FALLBACK_IMAGES.vegetables;
  const href = `${basePath}/${category.slug}`;

  return (
    <Link
      href={href}
      className="group block p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-300 transition-all duration-300 transform hover:-translate-y-1 text-center"
    >
      <div className="relative w-full aspect-4/3 max-h-36 mb-3 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center">
        <img
          src={imgSrc}
          alt={category.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMAGES.vegetables;
          }}
        />
      </div>
      <h3 className="font-extrabold text-slate-800 text-sm sm:text-base group-hover:text-purple-700 transition-colors line-clamp-1">
        {category.name}
      </h3>
      {category && (
        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
          {((category as any).children && (category as any).children.length > 0) || (category._count?.children && category._count.children > 0)
            ? `${(category as any).children?.length || category._count?.children} subcategories`
            : `${(category as any).totalItems ?? category._count?.products ?? 0} items`}
        </p>
      )}
    </Link>
  );
}
