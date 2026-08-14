'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductItem } from '@/types/shopping';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/utils/cn';
import { Plus, Check, Heart, Star, ShoppingBag } from 'lucide-react';

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

  return (
    <div className="group rounded-2xl border border-border/80 bg-card overflow-hidden shadow-card hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between p-3">
      {/* Image & Wishlist Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#F5F5F3] mb-3 flex items-center justify-center p-1">
        <Link href={`/services/shopping/product/${product.slug}`} onClick={handleProductClick} className="relative w-full h-full flex items-center justify-center">
          <Image
            src={product.image}
            alt={product.title}
            fill
            className="object-contain p-1 group-hover:scale-105 transition-transform duration-200 ease-out [filter:drop-shadow(0_4px_8px_rgba(0,0,0,0.1))]"
          />
        </Link>

        {/* Badges */}
        {product.badge && (
          <span className="absolute top-2 left-2 px-3 py-1 rounded-full text-[12px] font-extrabold bg-[#7eb343] text-white shadow-2xs">
            {product.badge}
          </span>
        )}
        {product.isOrganic && (
          <span className="absolute top-2 right-10 px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
            Organic
          </span>
        )}

        {/* Wishlist Heart Toggle */}
        <button
          onClick={() => toggleWishlist(product)}
          className={`absolute top-2 right-2 p-1.5 rounded-full transition-all shadow-sm ${
            isFavorite
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-background/80 backdrop-blur-md text-muted-foreground hover:text-rose-500'
          }`}
          title={isFavorite ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* Product Information */}
      <div className="space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400 truncate max-w-[120px]">
              {product.shopName}
            </span>
            <div className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
              {product.rating > 0 || ((product.reviewCount || product.totalReviews || 0) > 0) ? (
                <>
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{product.rating}</span>
                  <span className="text-muted-foreground font-normal">({product.reviewCount || product.totalReviews || 0})</span>
                </>
              ) : (
                <span className="text-[10px] text-muted-foreground font-normal">No ratings</span>
              )}
            </div>
          </div>

          <Link href={`/services/shopping/product/${product.slug}`} onClick={handleProductClick}>
            <h3 className="font-bold text-xs leading-snug line-clamp-2 mt-1 group-hover:text-emerald-600 transition-colors">
              {product.title}
            </h3>
          </Link>
          {(() => {
            const rawAmt = (product as any).unitAmount ?? (product as any).amount;
            const displayUnit = (rawAmt !== undefined && rawAmt !== null && rawAmt !== 0 && !isNaN(Number(rawAmt)))
              ? `${rawAmt} ${product.unit}`
              : product.unit;
            return <p className="text-[11px] text-muted-foreground mt-0.5">{displayUnit}</p>;
          })()}
        </div>

        {/* Price & Cart Control */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between">
          <div>
            <div className="font-extrabold text-sm text-[#7eb343]">
              {formatCurrency(product.price)}
            </div>
            {product.originalPrice && (
              <span className="text-[11px] text-slate-400 line-through">
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
            className={`min-h-[44px] px-3 py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 text-xs font-bold active:scale-95 ${
              inCart
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-emerald-500/10 hover:bg-emerald-600 hover:text-white text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {inCart ? (
              <>
                <Check className="w-4 h-4" />
                <span>{inCart.quantity} in Cart</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
