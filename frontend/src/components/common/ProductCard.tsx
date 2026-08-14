'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Plus, Minus, Check, ShoppingBag, Loader2 } from 'lucide-react';
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
    <div className="group relative w-full bg-[#1c1c1e] rounded-[22px] border border-slate-800/80 shadow-md hover:shadow-xl hover:border-slate-700 transition-all duration-300 flex flex-col overflow-hidden font-sans select-none">
      
      {/* ── Top Image Container (Light Cream/Off-White Background) ── */}
      <div className="relative w-full aspect-square bg-[#F5F4EF] flex items-center justify-center p-2 overflow-hidden">
        
        {/* Top Badges & Wishlist Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          <div className="pointer-events-auto">
            {isHot || badge?.toLowerCase() === 'hot' ? (
              <span className="bg-[#1b4317] text-[#22c55e] font-extrabold text-xs px-3 py-1 rounded-full shadow-xs tracking-tight">
                HOT
              </span>
            ) : badge ? (
              <span className="bg-[#1b4317] text-[#22c55e] font-extrabold text-xs px-3 py-1 rounded-full shadow-xs tracking-tight">
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
            className="w-8 h-8 rounded-full bg-[#242426]/90 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer shadow-md pointer-events-auto"
            title="Wishlist"
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
          </button>
        </div>

        {/* Product Image */}
        <Link
          href={`/services/shopping/product/${slug}`}
          className="w-full h-full flex items-center justify-center cursor-pointer"
        >
          <img
            src={image}
            alt={title}
            className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300 ease-out"
          />
        </Link>
      </div>

      {/* ── Bottom Content Section (Sleek Dark Panel) ── */}
      <div className="p-3.5 bg-[#1c1c1e] text-white flex flex-col justify-between flex-1 space-y-2.5">
        
        {/* Title & Unit */}
        <div>
          <Link
            href={`/services/shopping/product/${slug}`}
            className="font-bold text-sm sm:text-base text-white hover:text-emerald-400 transition-colors line-clamp-1 block leading-tight"
          >
            {title}
          </Link>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {displayUnit}
          </p>
        </div>

        {/* Price Row */}
        <div className="flex items-baseline gap-2">
          <span className="font-extrabold text-base sm:text-lg text-[#22c55e]">
            ৳{price.toFixed(2)}
          </span>
          {originalPrice && (
            <span className="line-through text-slate-500 text-xs">
              ৳{originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Action Controller Row (Stepper + Add to Cart) */}
        <div className="flex items-center gap-2 pt-0.5">
          {/* Stepper [- 1 +] */}
          <div className="flex items-center justify-between bg-[#28282b] border border-slate-700/60 rounded-xl h-10 px-2 text-white font-bold text-xs shrink-0 w-20 sm:w-24">
            <button
              type="button"
              onClick={decrementQty}
              className="w-6 h-full flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer active:scale-95"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-white font-bold text-xs sm:text-sm">
              {quantity}
            </span>
            <button
              type="button"
              onClick={incrementQty}
              className="w-6 h-full flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add To Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`flex-1 h-10 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed ${
              addedAnimation
                ? 'bg-emerald-700'
                : 'bg-[#16a34a] hover:bg-[#15803d]'
            }`}
          >
            {isAdding && !addedAnimation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : addedAnimation ? (
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Added</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Add to cart</span>
              </span>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
