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

const getSmartCategoryImage = (name: string, slug: string, customImage?: string): string => {
  if (customImage && typeof customImage === 'string' && customImage.trim() && !customImage.includes('undefined')) {
    const clean = customImage.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
      return clean;
    }
  }

  const t = `${name || ''} ${slug || ''}`.toLowerCase();

  // 1. Baby & Kids (বেবি, শিশু, খেলনা, baby, kids, toy)
  if (/baby|kid|toy|child|বেবি|শিশু|খেলনা|ডায়াপার/i.test(t)) {
    return 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&auto=format&fit=crop&q=80';
  }

  // 2. Beverage & Drinks (পানীয়, পানীয়, বেভারেজ, জুস, চা, কফি, beverage, drink, juice, tea, coffee, soda)
  if (/beverage|drink|juice|tea|coffee|soda|পানীয়|পানীয়|জুস|চা|কফি/i.test(t)) {
    return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80';
  }

  // 3. Personal Care & Beauty (পার্সোনাল কেয়ার, বিউটি, শ্যাম্পু, কেয়ার, personal, care, beauty, lotion, shampoo)
  if (/personal|care|beauty|lotion|shampoo|পার্সোনাল|কেয়ার|কেয়ার|বিউটি|প্রসাধন|সৌন্দর্য/i.test(t)) {
    return 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80';
  }

  // 4. Groceries & Cooking (মুদি, রান্না, আটা, চাল, তেল, grocery, cooking, flour, rice, oil, spice, food)
  if (/grocery|cooking|flour|rice|oil|spice|food|মুদি|রান্না|চাল|আটা|খাদ্য|মসলা/i.test(t)) {
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80';
  }

  // 5. Dairy & Frozen (ডেইরি, দুধ, ফ্রোজেন, মাখন, পনির, dairy, milk, frozen, butter, cheese, egg)
  if (/dairy|milk|frozen|butter|cheese|egg|ডেইরি|দুধ|ফ্রোজেন|ডিম|মাখন/i.test(t)) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80';
  }

  // 6. Snacks & Confectionery (স্ন্যাক্স, কনফেকশনারি, বিস্কুট, চানাচুর, snack, confectionery, biscuit, chanachur, cake)
  if (/snack|confectionery|biscuit|chanachur|cake|chocolate|স্ন্যাক্স|কনফেকশনারি|বিস্কুট|চানাচুর|কেক/i.test(t)) {
    return 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80';
  }

  // 7. Household & Cleaning (হাউজহোল্ড, ক্লিনিং, সাবান, লিকুইড, household, cleaning, wash, detergent, soap)
  if (/household|cleaning|wash|detergent|soap|হাউজহোল্ড|ক্লিনিং|সাবান|পরিষ্কার/i.test(t)) {
    return 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=80';
  }

  // 8. Health & Wellness (স্বাস্থ্য, সুস্থতা, ফার্মা, ভিটামিন, health, wellness, pharma, medicine)
  if (/health|wellness|pharma|medicine|vitamin|স্বাস্থ্য|সুস্থতা|মেডিসিন|ওষুধ/i.test(t)) {
    return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80';
  }

  // 9. Stationeries & Office (স্টেশনারি, অফিস, খাতা, কলম, বই, stationery, office, pen, paper, book)
  if (/stationery|office|pen|paper|book|khata|স্টেশনারি|অফিস|খাতা|কলম|বই/i.test(t)) {
    return 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=80';
  }

  // 10. Home & Kitchenware (হোম, কিচেন, কিচেনওয়্যার, থালা, পাত্র, home, kitchen, cookware)
  if (/home|kitchen|cookware|appliance|হোম|কিচেন|কিচেনওয়্যার|বাসন/i.test(t)) {
    return 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=80';
  }

  // 11. Meat & Fish (মাছ, মাংস, ইলিশ, মুরগি, meat, fish, chicken, beef)
  if (/meat|fish|chicken|beef|mutton|মাছ|মাংস|ইলিশ|মুরগি/i.test(t)) {
    return 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&auto=format&fit=crop&q=80';
  }

  // 12. Dynamic seed fallback
  const seed = Array.from(t).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fallbacks = [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506617429158-171e54d45840?w=500&auto=format&fit=crop&q=80',
  ];
  return fallbacks[seed % fallbacks.length];
};

export function CategoryCard({ category, basePath = '/category' }: CategoryCardProps) {
  // Skeleton State if category data is not available
  if (!category) {
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/60 shadow-xs animate-pulse text-center">
        <div className="w-full aspect-4/3 max-h-36 mb-3 rounded-xl bg-slate-200/80 animate-pulse" />
        <div className="w-3/4 h-4 bg-slate-200 rounded mx-auto mb-1.5 animate-pulse" />
        <div className="w-1/2 h-3 bg-slate-100 rounded mx-auto animate-pulse" />
      </div>
    );
  }

  const hasCustomImage = Boolean(category.image && category.image.trim() && !category.image.includes('undefined'));
  const href = `${basePath}/${category.slug}`;

  return (
    <Link
      href={href}
      className="group block p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-300 transition-all duration-300 transform hover:-translate-y-1 text-center"
    >
      <div className="relative w-full aspect-4/3 max-h-36 mb-3 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
        {hasCustomImage ? (
          <img
            src={category.image}
            alt={category.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          /* Skeleton Shimmer Container when image is not present */
          <div className="w-full h-full bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse flex flex-col items-center justify-center p-2">
            <span className="text-2xl font-black text-slate-400/80 select-none">
              {category.name ? category.name.charAt(0).toUpperCase() : 'DS'}
            </span>
          </div>
        )}
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
