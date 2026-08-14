'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductItem } from '@/types/shopping';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/utils/cn';
import { Plus, Check, Heart } from 'lucide-react';

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
    <div className="group rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between p-3.5 text-center font-sans select-none">
      
      {/* Top Row: Badges & Wishlist */}
      <div className="flex items-center justify-between z-10 w-full shrink-0 mb-1">
        <div>
          {product.badge ? (
            <span className="bg-[#E50000] text-white font-extrabold text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
              {product.badge}
            </span>
          ) : null}
        </div>

        <button
          onClick={() => toggleWishlist(product)}
          className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
          title={isFavorite ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-5 h-5 stroke-[1.5] ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Product Image */}
      <Link href={`/services/shopping/product/${product.slug}`} onClick={handleProductClick} className="relative w-full aspect-square bg-white rounded-xl flex items-center justify-center my-1 cursor-pointer overflow-hidden group/img shrink-0">
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-contain p-1 group-hover:scale-105 transition-transform duration-300 ease-out"
        />
      </Link>

      {/* Product Information */}
      <div className="flex flex-col justify-between flex-1 space-y-2 mt-1">
        <p className="text-[11px] italic font-medium text-slate-500 text-center">
          Delivery 1-2 hours
        </p>

        <Link href={`/services/shopping/product/${product.slug}`} onClick={handleProductClick}>
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 hover:text-[#E50000] transition-colors line-clamp-2 leading-snug text-center block min-h-[36px]">
            {product.title}
          </h3>
        </Link>

        {/* Price & Cart Control */}
        <div className="flex items-baseline justify-center gap-1.5 my-1">
          <span className="font-extrabold text-base sm:text-lg text-[#E50000]">
            {formatCurrency(product.price)}
          </span>
          <span className="text-slate-500 text-xs font-normal">
            Per {displayUnit}
          </span>
          {product.originalPrice && (
            <span className="line-through text-slate-400 text-xs ml-1">
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
          className={`w-full h-9 rounded-full transition-all shadow-sm flex items-center justify-center gap-1.5 text-xs font-bold active:scale-95 ${
            inCart
              ? 'bg-emerald-600 text-white'
              : 'bg-[#E50000] hover:bg-[#CC0000] text-white'
          }`}
        >
          {inCart ? (
            <>
              <Check className="w-4 h-4" />
              <span>{inCart.quantity} in Bag</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add to Bag</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
