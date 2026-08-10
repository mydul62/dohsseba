'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Plus, Minus, Check, Star, Loader2 } from 'lucide-react';
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
  rating = 4.5,
  isHot,
  categorySlug = 'groceries',
  categoryName = 'Grocery',
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { addItem, items } = useCartStore();
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
    <div className="group relative h-[310px] sm:h-[330px] w-full bg-white rounded-2xl p-3 sm:p-4 border border-slate-100/90 shadow-xs hover:shadow-sm hover:border-slate-200 transition-all duration-300 flex flex-col justify-between overflow-hidden font-sans select-none">
      
      {/* ── Top Row: Badge & Wishlist ── */}
      <div className="flex items-center justify-between z-10 w-full shrink-0">
        <div>
          {isHot || badge?.toLowerCase() === 'hot' ? (
            <span className="bg-[#e53935] text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
              HOT
            </span>
          ) : badge ? (
            <span className="bg-[#7eb343] text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
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

      {/* ── Center Product Image ── */}
      <Link
        href={`/services/shopping/product/${slug}`}
        className="relative flex-1 w-full flex items-center justify-center my-1 cursor-pointer overflow-hidden"
      >
        <img
          src={image}
          alt={title}
          className="w-full h-28 sm:h-36 object-contain group-hover:scale-105 transition-all duration-300"
        />
      </Link>

      {/* ── Bottom Section: Smooth Animated Transition Container ── */}
      <div className="shrink-0 space-y-1 mt-auto pt-1 relative min-h-[64px] flex flex-col justify-end">
        
        {/* Title & (GF) Badge */}
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <Link
            href={`/services/shopping/product/${slug}`}
            className="font-bold text-xs sm:text-sm text-slate-800 hover:text-[#7eb343] transition-colors line-clamp-1 flex-1 min-w-0"
          >
            {title}
          </Link>
          
          <div className="flex items-center gap-1 shrink-0 text-[9px] font-black text-slate-700">
            <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center scale-90">GF</span>
          </div>
        </div>

        {/* ── Desktop Normal State: Fades Out & Slides Up Smoothly on Hover ── */}
        <div className="hidden sm:flex items-center justify-between pt-0.5 transition-all duration-300 ease-out transform group-hover:opacity-0 group-hover:-translate-y-2 group-hover:pointer-events-none">
          <div className="flex items-baseline gap-1">
            <span className="font-extrabold text-sm sm:text-base text-[#7eb343]">
              ৳{price.toFixed(2)}
            </span>
            <span className="text-slate-400 text-xs font-normal">
              / {displayUnit}
            </span>
            {originalPrice && (
              <span className="line-through text-slate-300 text-[11px] ml-1">
                ৳{originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-slate-700 shrink-0">
            <span>{rating.toFixed(1)}</span>
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          </div>
        </div>

        {/* ── Action Controller Row: Always visible on Mobile, Smooth Ease-Out Fade & Slide-Up on Desktop ── */}
        <div className="flex sm:absolute sm:inset-x-0 sm:bottom-0 flex-col gap-1.5 pt-0.5 bg-white transition-all duration-300 ease-out transform opacity-100 sm:opacity-0 sm:translate-y-3 sm:pointer-events-none sm:group-hover:opacity-100 sm:group-hover:translate-y-0 sm:group-hover:pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="font-extrabold text-xs sm:text-sm text-[#7eb343]">
                ৳{price.toFixed(2)}
              </span>
              <span className="text-slate-400 text-[10px] font-normal">
                / {displayUnit}
              </span>
              {originalPrice && (
                <span className="line-through text-slate-300 text-[10px] ml-1">
                  ৳{originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-0.5 text-[10px] font-bold text-slate-600 sm:hidden">
              <span>{rating.toFixed(1)}</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Stepper [- 1 +] */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-8 bg-white text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={decrementQty}
                className="w-5 sm:w-7 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer active:scale-95"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-5 sm:w-7 h-full flex items-center justify-center text-slate-800 font-bold border-x border-slate-200 text-[11px] sm:text-xs">
                {quantity}
              </span>
              <button
                type="button"
                onClick={incrementQty}
                className="w-5 sm:w-7 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer active:scale-95"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Add To Cart Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`flex-1 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed ${
                addedAnimation
                  ? 'bg-emerald-600'
                  : 'bg-[#7eb343] hover:bg-[#6c9c36]'
              }`}
            >
              {isAdding && !addedAnimation ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : addedAnimation ? (
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="text-[11px] sm:text-xs">Added</span>
                </span>
              ) : (
                <span className="text-[11px] sm:text-xs">Add To Cart</span>
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
