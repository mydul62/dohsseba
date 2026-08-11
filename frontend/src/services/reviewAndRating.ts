import { fetchApi } from '@/lib/api-client';

export interface ProductReviewItem {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  isVerifiedPurchase?: boolean;
}

export interface ProductReviewSummaryResponse {
  productId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  latestReviews: ProductReviewItem[];
  reviews: ProductReviewItem[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  userReview?: ProductReviewItem | null;
  hasPurchased: boolean;
  canReview: boolean;
}

export const fetchProductReviewSummary = async (productIdOrSlug: string, page = 1, limit = 10) => {
  const res = await fetchApi<ProductReviewSummaryResponse>(
    `/review-and-rating/product/${encodeURIComponent(productIdOrSlug)}?page=${page}&limit=${limit}`
  );
  return res;
};

export const submitProductReview = async (data: { productId: string; rating: number; comment?: string; reviewerName?: string }) => {
  const res = await fetchApi<any>('/review-and-rating', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res;
};

export const updateProductReview = async (reviewId: string, data: { rating?: number; comment?: string }) => {
  const res = await fetchApi<any>(`/review-and-rating/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res;
};

export const deleteProductReview = async (reviewId: string) => {
  const res = await fetchApi<any>(`/review-and-rating/${reviewId}`, {
    method: 'DELETE',
  });
  return res;
};

export const fetchSellerReviews = async (params: {
  productId?: string;
  rating?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}) => {
  const query = new URLSearchParams();
  if (params.productId) query.set('productId', params.productId);
  if (params.rating) query.set('rating', String(params.rating));
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.sort) query.set('sort', params.sort);

  const res = await fetchApi<any>(`/review-and-rating/seller/reviews?${query.toString()}`);
  return res;
};
