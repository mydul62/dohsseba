'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductItem } from '@/types/shopping';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/utils/cn';
import { Check, Heart, ShoppingBag } from 'lucide-react';

function toBnDigit(num: number): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
}

interface ProductCardProps {
  product: ProductItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const cartStore = useCartStore();
  const addItem = cartStore?.addItem || (() => {});
  const items = cartStore?.items || [];
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { success: toastSuccess } = useToast();

  const inCart = items.find((i) => i.product.id === product.id);
  const isFavorite = isInWishlist(product.id);

  const handleProductClick = () => {
    try {
      const stored = localStorage.getItem('dohssheba-recently-viewed');
      const list = stored ? JSON.parse(stored) : [];
      const itemToSave = {
        id: product.id,
        name: product.title || (product as any).name,
        price: product.price,
        seller: product.shopName || 'DOHS Market',
        image: product.image,
        rating: product.rating || 4.8,
        slug: product.slug,
      };
      const filtered = list.filter((item: any) => item.id !== product.id);
      const updated = [itemToSave, ...filtered].slice(0, 10);
      localStorage.setItem('dohssheba-recently-viewed', JSON.stringify(updated));
    } catch (_) {}
  };

  const rawAmt = (product as any).unitAmount ?? (product as any).amount;
  const displayUnit = (rawAmt !== undefined && rawAmt !== null && rawAmt !== 0 && !isNaN(Number(rawAmt)))
    ? `${rawAmt} ${product.unit}`
    : product.unit;

  return (
    <div className="group rounded-[22px] border border-slate-800/80 bg-[#1c1c1e] overflow-hidden shadow-md hover:shadow-xl hover:border-slate-700 transition-all duration-300 flex flex-col justify-between select-none">
      
      {/* Top Image Container (Light Cream/Off-White Background) */}
      <div className="relative aspect-square w-full bg-[#F5F4EF] flex items-center justify-center p-2 overflow-hidden">
        
        {/* Badges & Wishlist Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          <div className="pointer-events-auto">
            {product.badge ? (
              <span className="bg-[#1b4317] text-[#22c55e] font-extrabold text-xs px-3 py-1 rounded-full shadow-xs tracking-tight">
                {product.badge}
              </span>
            ) : null}
          </div>

          <button
            onClick={() => toggleWishlist(product)}
            className="w-8 h-8 rounded-full bg-[#242426]/90 hover:bg-black text-white flex items-center justify-center transition-colors shadow-md cursor-pointer pointer-events-auto"
            title={isFavorite ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
          </button>
        </div>

        {/* Product Image */}
        <Link href={`/services/shopping/product/${product.slug}`} onClick={handleProductClick} className="relative w-full h-full flex items-center justify-center">
          <Image
            src={product.image}
            alt={product.title}
            fill
            className="object-contain p-1 group-hover:scale-105 transition-transform duration-300 ease-out"
          />
        </Link>
      </div>

      {/* Product Information (Dark Bottom Panel) */}
      <div className="p-3.5 bg-[#1c1c1e] text-white flex flex-col justify-between flex-1 space-y-2.5">
        <div>
          <Link href={`/services/shopping/product/${product.slug}`} onClick={handleProductClick}>
            <h3 className="font-bold text-sm sm:text-base text-white hover:text-emerald-400 transition-colors line-clamp-1 block leading-tight">
              {product.title}
            </h3>
          </Link>
          <p className="text-xs text-slate-400 font-medium mt-1">{displayUnit}</p>
        </div>

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-base sm:text-lg text-[#22c55e]">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-slate-500 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          <button
            onClick={() => {
              if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
                try { navigator.vibrate(10); } catch (_) {}
              }
              addItem(product, 1, false);
              const totalCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0) + 1;
              const bnCount = toBnDigit(totalCount);
              toastSuccess(
                'পণ্যটি কার্টে যোগ করা হয়েছে',
                `বর্তমানে আপনার কার্টে মোট ${bnCount} টি পণ্য রয়েছে`
              );
            }}
            className={`h-10 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-xs font-bold active:scale-95 ${
              inCart
                ? 'bg-emerald-700 text-white'
                : 'bg-[#16a34a] hover:bg-[#15803d] text-white'
            }`}
          >
            {inCart ? (
              <>
                <Check className="w-4 h-4" />
                <span>{inCart.quantity} in Cart</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Add to cart</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
