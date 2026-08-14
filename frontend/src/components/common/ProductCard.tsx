'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Plus, Minus, Check, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useToast } from '@/components/ui/Toast';

function toBnDigit(num: number): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
}

export interface ProductCardProps {
  id: string;
  title: string;
  slug: string;
  price: number;
  originalPrice?: number;
  unit?: string;
  unitAmount?: number;
  amount?: number;
  image?: string;
  badge?: string;
  rating?: number;
  reviewCount?: number;
  totalReviews?: number;
  soldCount?: number;
  isHot?: boolean;
  categorySlug?: string;
  categoryName?: string;
}

export function ProductCard({
  id,
  title,
  slug,
  price,
  originalPrice,
  unit = 'unit',
  unitAmount,
  amount,
  image = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80',
  badge,
  rating = 0,
  reviewCount,
  totalReviews,
  isHot,
  categorySlug = 'groceries',
  categoryName = 'Grocery',
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const cartStore = useCartStore();
  const addItem = cartStore?.addItem || (() => {});
  const items = cartStore?.items || [];
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { success: toastSuccess } = useToast();

  const isLiked = isInWishlist(id);

  const rawAmt = unitAmount ?? amount;
  const displayUnit = (rawAmt !== undefined && rawAmt !== null && rawAmt !== 0 && !isNaN(Number(rawAmt)))
    ? `${rawAmt} ${unit}`
    : unit;

  const incrementQty = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity((prev) => prev + 1);
  };

  const decrementQty = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding) return;
    setIsAdding(true);
    addItem({
      id,
      title,
      slug,
      categorySlug: categorySlug as any,
      categoryName,
      shopName: 'DOHS Market',
      price,
      unit,
      rating,
      reviewCount: 15,
      image,
      stock: 50,
    }, quantity, false);

    const totalCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0) + quantity;
    const bnCount = toBnDigit(totalCount);

    toastSuccess(
      'পণ্যটি কার্টে যোগ করা হয়েছে',
      `বর্তমানে আপনার কার্টে মোট ${bnCount} টি পণ্য রয়েছে`
    );

    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      setIsAdding(false);
    }, 1200);
  };

  return (
    <div className="group relative w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between p-3 sm:p-3.5 text-center font-sans select-none overflow-hidden">
      
      {/* ── Top Row: Badge & Wishlist ── */}
      <div className="flex items-center justify-between z-10 w-full shrink-0 mb-1">
        <div>
          {isHot || badge?.toLowerCase() === 'hot' ? (
            <span className="bg-[#E50000] text-white font-extrabold text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
              HOT
            </span>
          ) : badge ? (
            <span className="bg-[#E50000] text-white font-extrabold text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
              {badge}
            </span>
          ) : null}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist({
              id,
              title,
              slug,
              categorySlug: categorySlug as any,
              categoryName,
              shopName: 'DOHS Market',
              price,
              unit,
              rating,
              reviewCount: 15,
              image,
              stock: 50,
            });
          }}
          className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
          title="Wishlist"
        >
          <Heart className={`w-5 h-5 stroke-[1.5] ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* ── Product Image ── */}
      <Link
        href={`/services/shopping/product/${slug}`}
        className="relative w-full aspect-square bg-white rounded-xl flex items-center justify-center my-1 cursor-pointer overflow-hidden group/img shrink-0"
      >
        <img
          src={image}
          alt={title}
          className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300 ease-out"
        />
      </Link>

      {/* ── Details & Action Section ── */}
      <div className="flex flex-col justify-between flex-1 space-y-2 mt-1">
        
        {/* Delivery Tagline */}
        <p className="text-[11px] italic font-medium text-slate-500 text-center">
          Delivery 1-2 hours
        </p>

        {/* Title */}
        <Link
          href={`/services/shopping/product/${slug}`}
          className="font-bold text-xs sm:text-sm text-slate-900 hover:text-[#E50000] transition-colors line-clamp-2 leading-snug text-center block min-h-[36px]"
        >
          {title}
        </Link>

        {/* Price Row */}
        <div className="flex items-baseline justify-center gap-1.5 my-1">
          <span className="font-extrabold text-base sm:text-lg text-[#E50000]">
            ৳{price.toFixed(0)}
          </span>
          <span className="text-slate-500 text-xs font-normal">
            Per {displayUnit}
          </span>
          {originalPrice && (
            <span className="line-through text-slate-400 text-xs ml-1">
              ৳{originalPrice.toFixed(0)}
            </span>
          )}
        </div>

        {/* Action Controller Row (Stepper + Red Add to Bag Button) */}
        <div className="flex items-center gap-1.5 pt-1">
          {/* Stepper [- 1 +] */}
          <div className="flex items-center border border-slate-200 rounded-full h-9 px-2 bg-slate-50 text-slate-800 font-bold text-xs shrink-0 w-20 justify-between">
            <button
              type="button"
              onClick={decrementQty}
              className="w-5 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer active:scale-95"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-slate-900 font-bold text-xs">
              {quantity}
            </span>
            <button
              type="button"
              onClick={incrementQty}
              className="w-5 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer active:scale-95"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Add to Bag Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`flex-1 h-9 rounded-full text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed ${
              addedAnimation
                ? 'bg-emerald-600'
                : 'bg-[#E50000] hover:bg-[#CC0000]'
            }`}
          >
            {isAdding && !addedAnimation ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : addedAnimation ? (
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Added</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add to Bag</span>
              </span>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
