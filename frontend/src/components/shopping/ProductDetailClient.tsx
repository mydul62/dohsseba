'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ProductItem } from '@/types/shopping';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { formatCurrency } from '@/utils/cn';
import { ProductCard } from '@/components/common/ProductCard';
import { getApiBaseUrl } from '@/lib/api-client';
import {
  Star,
  ShoppingBag,
  Heart,
  Plus,
  Minus,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Store,
  ChevronRight,
  Sparkles,
  Layers,
  Package,
} from 'lucide-react';

import { useToast } from '@/components/ui/Toast';

function toBnDigit(num: number): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
}

interface ProductDetailClientProps {
  product: ProductItem;
  slug?: string;
}

export function ProductDetailClient({ product: initialProduct, slug }: ProductDetailClientProps) {
  const router = useRouter();
  const [product, setProduct] = useState<ProductItem>(initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [relatedItems, setRelatedItems] = useState<any[]>([]);

  const { addItem, items, closeCart } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { success: toastSuccess } = useToast();

  // Fetch live API product from DB if slug is present or available
  useEffect(() => {
    const targetSlug = slug || initialProduct?.slug || initialProduct?.id;
    if (!targetSlug) return;

    const API = getApiBaseUrl();

    fetch(`${API}/products/${encodeURIComponent(targetSlug)}`)
      .then((res) => res.json())
      .then((res) => {
        if (res?.success && res.data) {
          const p = res.data;
          const images = Array.isArray(p.images) && p.images.length > 0
            ? p.images
            : (p.image ? [p.image] : [initialProduct.image]);

          const origPrice = p.discount > 0 ? Math.round(p.price / (1 - p.discount / 100)) : undefined;
          const catSlug = p.category?.slug || p.categorySlug || initialProduct.categorySlug || 'groceries';

          const rawAmt = p.unitAmount ?? p.amount ?? initialProduct?.unitAmount;
          const rawUnit = p.unit || initialProduct?.unit || 'unit';
          const formattedUnit = (rawAmt !== undefined && rawAmt !== null && rawAmt !== 0 && !isNaN(Number(rawAmt)))
            ? `${rawAmt} ${rawUnit}`
            : rawUnit;

          setProduct({
            id: p.id,
            title: p.name || p.title || initialProduct.title,
            slug: p.slug || targetSlug,
            categorySlug: catSlug,
            categoryName: p.category?.name || p.categoryName || initialProduct.categoryName || 'Daily Essentials',
            shopName: p.seller?.sellerProfile?.shopName || p.seller?.name || p.shopName || 'Savar DOHS Market',
            price: p.price ?? initialProduct.price,
            originalPrice: origPrice,
            unit: formattedUnit,
            rating: p.rating || 4.8,
            reviewCount: p.totalReviews || p.reviewCount || 24,
            image: images[0],
            galleryImages: images,
            stock: p.stock ?? 30,
            badge: p.discount > 0 ? `${p.discount}% OFF` : (p.isFlashSale ? 'FLASH SALE' : undefined),
            discountPercentage: p.discount || undefined,
            description: p.description || initialProduct.description,
            reviews: Array.isArray(p.reviews) ? p.reviews.map((r: any) => ({
              id: r.id,
              userName: r.user?.name || 'DOHS Resident',
              userAvatar: r.user?.avatar,
              rating: r.rating || 5,
              date: new Date(r.createdAt || Date.now()).toLocaleDateString(),
              comment: r.comment || '',
            })) : [],
          });

          // Fetch Related Products (same category or general recommendations)
          fetch(`${API}/products?category=${encodeURIComponent(catSlug)}&limit=8`)
            .then((r) => r.json())
            .then((catRes) => {
              let fetched = catRes?.data?.products || (Array.isArray(catRes?.data) ? catRes.data : []);
              fetched = fetched.filter((item: any) => item.id !== p.id && item.slug !== p.slug);
              
              if (fetched.length < 4) {
                // Fetch fallback products if category list is small
                fetch(`${API}/products?limit=8`)
                  .then((r2) => r2.json())
                  .then((allRes) => {
                    const fallback = allRes?.data?.products || (Array.isArray(allRes?.data) ? allRes.data : []);
                    const combined = [...fetched, ...fallback.filter((item: any) => item.id !== p.id && !fetched.some((f: any) => f.id === item.id))];
                    setRelatedItems(combined.slice(0, 4));
                  })
                  .catch(() => setRelatedItems(fetched));
              } else {
                setRelatedItems(fetched.slice(0, 4));
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [slug, initialProduct?.slug, initialProduct?.id]);

  // Save viewed product to recently-viewed localStorage history
  useEffect(() => {
    if (!product || !product.id) return;
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
  }, [product]);

  const isFavorite = isInWishlist(product.id);
  const images = product.galleryImages || [product.image];

  const handleAddToCart = () => {
    addItem(product, quantity, false);
    const totalCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0) + quantity;
    const bnCount = toBnDigit(totalCount);
    toastSuccess(
      'পণ্যটি কার্টে যোগ করা হয়েছে',
      `বর্তমানে আপনার কার্টে মোট ${bnCount} টি পণ্য রয়েছে`
    );
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, quantity, false);
    closeCart();
    router.push('/checkout');
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-10 py-6 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 pb-24 lg:pb-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <Link href="/" className="hover:text-emerald-600">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/services/shopping" className="hover:text-emerald-600">Shopping</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/category/${product.categorySlug}`} className="hover:text-emerald-600">
          {product.categoryName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-bold">{product.title}</span>
      </nav>

      {/* Main Product Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 p-6 sm:p-8 rounded-3xl border border-border bg-card shadow-xl">
        {/* Left: Gallery */}
        <div className="space-y-4">
          <div className="relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden bg-secondary border border-border">
            <Image
              src={images[activeImageIndex] || product.image}
              alt={product.title}
              fill
              className="object-cover"
              unoptimized
            />
            {product.badge && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-md">
                {product.badge}
              </span>
            )}
            <button
              onClick={() => toggleWishlist(product)}
              className={`absolute top-4 right-4 p-2.5 rounded-full transition-all shadow-md ${
                isFavorite
                  ? 'bg-rose-500 text-white'
                  : 'bg-background/80 backdrop-blur-md text-muted-foreground hover:text-rose-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-white' : ''}`} />
            </button>
          </div>

          {/* Gallery Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx
                      ? 'border-emerald-600 scale-105 shadow-md'
                      : 'border-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt={product.title} fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & Buying Controls */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-600 uppercase tracking-wider">
                {product.categoryName}
              </span>
              <span className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{product.rating}</span>
                <span className="text-muted-foreground font-normal">({product.reviewCount} Reviews)</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-snug">
              {product.title}
            </h1>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Sold by: <strong className="text-foreground">{product.shopName}</strong></span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">In Stock ({product.stock} items)</span>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/60 border border-border flex items-baseline gap-3">
              <span className="text-3xl font-black text-emerald-600">
                {formatCurrency(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(product.originalPrice)}
                </span>
              )}
              <span className="text-xs text-muted-foreground">/ {product.unit}</span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {product.description || 'Fresh grocery item delivered directly from DOHS bazaar shops in 45 minutes.'}
            </p>

            {/* Quantity Stepper */}
            <div className="pt-2 flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Quantity
              </span>
              <div className="flex items-center gap-2 border border-border rounded-xl p-1 bg-secondary/50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 rounded-lg hover:bg-background text-foreground"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold px-3 min-w-[24px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 rounded-lg hover:bg-background text-foreground"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Actions & Delivery Guarantee */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleAddToCart}
                className="py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Basket ({formatCurrency(product.price * quantity)})</span>
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm text-center shadow-md transition-all hover:opacity-95 cursor-pointer"
              >
                Buy Now Express
              </button>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <Truck className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>45-Minute Doorstep Delivery within Mohakhali, Baridhara & Mirpur DOHS</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Related Items Section ── */}
      {relatedItems.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-extrabold text-foreground">
                Related Items & You Might Also Like
              </h2>
            </div>
            <Link
              href={`/category/${product.categorySlug}`}
              className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
            >
              See All in {product.categoryName} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedItems.map((rel: any) => {
              const relImg = Array.isArray(rel.images) && rel.images.length > 0 ? rel.images[0] : (rel.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400');
              const origP = rel.discount > 0 ? Math.round(rel.price / (1 - rel.discount / 100)) : undefined;
              return (
                <ProductCard
                  key={rel.id}
                  id={rel.id}
                  title={rel.name || rel.title}
                  slug={rel.slug || rel.id}
                  price={rel.price}
                  originalPrice={origP}
                  unit={rel.unit || 'unit'}
                  image={rel.image || relImg}
                  badge={rel.discount > 0 ? `${rel.discount}% OFF` : (rel.isFlashSale ? 'FLASH SALE' : undefined)}
                  rating={rel.rating || 4.8}
                  categorySlug={product.categorySlug}
                  categoryName={product.categoryName}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* ── Mobile Sticky Bottom Action Bar ── */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 p-3 bg-background/95 backdrop-blur-md border-t border-border/80 shadow-2xl flex items-center gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex-1 py-3 px-4 rounded-2xl bg-secondary border border-border text-foreground font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <ShoppingBag className="w-4 h-4 text-emerald-600" />
          <span>Add to Basket</span>
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs text-center shadow-lg active:scale-95 transition-all cursor-pointer"
        >
          Buy Now (৳{formatCurrency(product.price * quantity)})
        </button>
      </div>
    </div>
  );
}
