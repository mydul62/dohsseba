import { fetchApi } from '@/lib/api-client';
import { ProductItem } from '@/types/shopping';

export interface ProductQueryFilters {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: string;
  featured?: boolean;
  flashSale?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export class ProductService {
  static transformProduct(p: any): ProductItem {
    const price = Number(p.price || 0);
    const disc = Number(p.discount || 0);
    const originalPrice = disc > 0 ? Math.round(price / (1 - disc / 100)) : undefined;
    const discPct = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    const rawAmt = p.unitAmount ?? p.amount;
    const rawUnit = (p.unit || 'unit').trim();
    const formattedUnit = (rawAmt !== undefined && rawAmt !== null && rawAmt !== '' && !isNaN(Number(rawAmt)))
      ? `${rawAmt} ${rawUnit}`
      : rawUnit;

    return {
      id: p.id,
      title: p.name || p.title || 'Product',
      slug: p.slug || p.id,
      categorySlug: p.category?.slug || 'general',
      categoryName: p.category?.name || 'General',
      shopName: p.seller?.sellerProfile?.shopName || p.sellerProfile?.shopName || 'Green Market DOHS',
      price,
      originalPrice,
      unit: formattedUnit,
      unitAmount: rawAmt !== undefined && rawAmt !== null && rawAmt !== '' ? Number(rawAmt) : undefined,
      rating: Number(p.rating || 4.5),
      reviewCount: p._count?.reviews || 0,
      image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.image || undefined),
      stock: Number(p.stock ?? 0),
      isOrganic: Boolean(p.isOrganic),
      badge: p.isFeatured ? 'HOT' : discPct > 0 ? `-${discPct}%` : undefined,
      discountPercentage: disc || undefined,
      description: p.description || '',
    };
  }

  static async getProducts(filters: ProductQueryFilters = {}): Promise<{ products: ProductItem[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.featured) params.append('featured', 'true');
      if (filters.flashSale) params.append('flashSale', 'true');
      if (filters.minPrice) params.append('minPrice', String(filters.minPrice));
      if (filters.maxPrice) params.append('maxPrice', String(filters.maxPrice));

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await fetchApi<any>(`/products${queryStr}`);

      if (res?.success && res.data) {
        const rawList = Array.isArray(res.data) ? res.data : (res.data.products || []);
        const total = res.meta?.total || rawList.length;
        const products = rawList.map((p: any) => this.transformProduct(p));
        return { products, total };
      }
      return { products: [], total: 0 };
    } catch (err) {
      console.error('🛒 ProductService.getProducts Error:', err);
      return { products: [], total: 0 };
    }
  }

  static async getProductsByCategory(categorySlug: string): Promise<ProductItem[]> {
    const { products } = await this.getProducts({ category: categorySlug, limit: 100 });
    return products;
  }

  static async getProductBySlug(slug: string): Promise<ProductItem | null> {
    try {
      const res = await fetchApi<any>(`/products/${slug}`);
      if (res?.success && res.data) {
        return this.transformProduct(res.data);
      }
      return null;
    } catch (err) {
      console.error('🛒 ProductService.getProductBySlug Error:', err);
      return null;
    }
  }

  static async searchProducts(query: string): Promise<ProductItem[]> {
    const { products } = await this.getProducts({ search: query, limit: 50 });
    return products;
  }

  // ─── Server-Side Methods (For App Router Server Components) ─────────────────

  static async getProductsServer(filters: ProductQueryFilters = {}): Promise<{ products: ProductItem[]; total: number }> {
    try {
      const { fetchServerApi } = await import('@/lib/server-api');
      const params = new URLSearchParams();
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.featured) params.append('featured', 'true');
      if (filters.flashSale) params.append('flashSale', 'true');
      if (filters.minPrice) params.append('minPrice', String(filters.minPrice));
      if (filters.maxPrice) params.append('maxPrice', String(filters.maxPrice));

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await fetchServerApi<any>(`/products${queryStr}`, {
        next: { revalidate: 60 },
      });

      if (res?.success && res.data) {
        const rawList = Array.isArray(res.data) ? res.data : (res.data.products || []);
        const total = res.meta?.total || rawList.length;
        const products = rawList.map((p: any) => this.transformProduct(p));
        return { products, total };
      }
      return { products: [], total: 0 };
    } catch (err) {
      console.error('🛒 ProductService.getProductsServer Error:', err);
      return { products: [], total: 0 };
    }
  }

  static async getProductBySlugServer(slug: string): Promise<ProductItem | null> {
    try {
      const { fetchServerApi } = await import('@/lib/server-api');
      const res = await fetchServerApi<any>(`/products/${slug}`, {
        next: { revalidate: 60 },
      });
      if (res?.success && res.data) {
        return this.transformProduct(res.data);
      }
      return null;
    } catch (err) {
      console.error('🛒 ProductService.getProductBySlugServer Error:', err);
      return null;
    }
  }
}

