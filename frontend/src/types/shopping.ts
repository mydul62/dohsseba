export type ProductCategorySlug =
  | string
  | 'groceries'
  | 'vegetables'
  | 'fruits'
  | 'meat'
  | 'fish'
  | 'dairy'
  | 'snacks'
  | 'rice'
  | 'oil'
  | 'beverages'
  | 'fresh-fruits-vegetables'
  | 'meat-fish-seafood'
  | 'dairy-eggs-bakery'
  | 'household-daily-cleaning'
  | 'personal-care-beauty'
  | 'snacks-beverages-drinks';

export interface ProductCategory {
  id: string;
  name: string;
  slug: ProductCategorySlug;
  iconName: string;
  itemCount: number;
  image: string;
}

export interface ProductReview {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  date: string;
  comment: string;
}

export interface ProductItem {
  id: string;
  title: string;
  slug: string;
  categorySlug: ProductCategorySlug;
  categoryName: string;
  shopId?: string;
  shopName: string;
  price: number;
  originalPrice?: number;
  unit: string;
  unitAmount?: number;
  rating: number;
  reviewCount: number;
  totalReviews?: number;
  image: string;
  galleryImages?: string[];
  stock: number;
  isOrganic?: boolean;
  badge?: string;
  discountPercentage?: number;
  description?: string;
  nutritionInfo?: {
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
  };
  reviews?: ProductReview[];
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
}
