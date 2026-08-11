import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/error.middleware';

/**
 * Recalculate average rating and totalReviews for a product and update the Product table.
 */
export const recalculateProductRating = async (productId: string) => {
  const stats = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const rawAvg = stats._avg.rating ?? 0;
  const averageRating = Number(rawAvg.toFixed(1));
  const totalReviews = stats._count.rating ?? 0;

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: averageRating,
      totalReviews,
    },
  });

  return { averageRating, totalReviews };
};

/**
 * Get product reviews summary, distribution, latest 2 reviews, paginated reviews list, user's own review, and purchase eligibility.
 */
export const getProductReviewSummary = async (
  productIdOrSlug: string,
  page = 1,
  limit = 10,
  userId?: string
) => {
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { id: productIdOrSlug },
        { slug: productIdOrSlug },
      ],
    },
    select: { id: true, rating: true, totalReviews: true },
  });

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  const productId = product.id;
  const skip = (page - 1) * limit;

  const [reviews, totalCount, allReviewsForDistribution] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { productId } }),
    prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    }),
  ]);

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  allReviewsForDistribution.forEach((r) => {
    const star = Math.min(5, Math.max(1, r.rating)) as 1 | 2 | 3 | 4 | 5;
    ratingDistribution[star] = (ratingDistribution[star] || 0) + 1;
  });

  const sumRatings = allReviewsForDistribution.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = totalCount > 0 ? Number((sumRatings / totalCount).toFixed(1)) : 0;

  const latestReviews = reviews.slice(0, 2);

  let userReview: any = null;
  let hasPurchased = false;

  if (userId) {
    userReview = await prisma.review.findFirst({
      where: { productId, userId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    const completedOrderCount = await prisma.orderItem.count({
      where: {
        productId,
        order: {
          customerId: userId,
          status: { in: ['DELIVERED', 'SELLER_ACCEPTED', 'PICKED_UP', 'ON_THE_WAY', 'PENDING'] },
        },
      },
    });
    hasPurchased = completedOrderCount > 0;
  }

  return {
    productId,
    averageRating,
    totalReviews: totalCount,
    ratingDistribution,
    latestReviews,
    reviews,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit) || 1,
    userReview,
    hasPurchased,
    canReview: true,
  };
};

/**
 * Submit or update a product review by a customer.
 */
export const createOrUpdateProductReview = async (
  userId: string,
  data: { productId: string; rating: number; comment?: string }
) => {
  const rating = Number(data.rating);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    throw new AppError('Rating must be an integer between 1 and 5.', 400);
  }

  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { id: data.productId },
        { slug: data.productId },
      ],
    },
  });

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  const productId = product.id;

  const purchasedItem = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        customerId: userId,
      },
    },
  });

  const existingReview = await prisma.review.findFirst({
    where: { productId, userId },
  });

  let review;
  if (existingReview) {
    review = await prisma.review.update({
      where: { id: existingReview.id },
      data: {
        rating,
        comment: data.comment?.trim() || null,
        updatedAt: new Date(),
      },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  } else {
    review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        comment: data.comment?.trim() || null,
      },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }

  await recalculateProductRating(productId);

  return {
    review,
    isVerifiedPurchase: Boolean(purchasedItem),
  };
};

/**
 * Update an existing review by ID (Owner only).
 */
export const updateProductReview = async (
  reviewId: string,
  userId: string,
  data: { rating?: number; comment?: string }
) => {
  const existing = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!existing) {
    throw new AppError('Review not found.', 404);
  }
  if (existing.userId !== userId) {
    throw new AppError('Access denied. You can only edit your own review.', 403);
  }

  let rating = existing.rating;
  if (data.rating !== undefined) {
    rating = Number(data.rating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      throw new AppError('Rating must be between 1 and 5.', 400);
    }
  }

  const comment = data.comment !== undefined ? (data.comment?.trim() || null) : existing.comment;

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating,
      comment,
      updatedAt: new Date(),
    },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  if (existing.productId) {
    await recalculateProductRating(existing.productId);
  }

  return updated;
};

/**
 * Delete a review by ID (Owner or Admin).
 */
export const deleteProductReview = async (
  reviewId: string,
  userId: string,
  userRole: string
) => {
  const existing = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!existing) {
    throw new AppError('Review not found.', 404);
  }

  const isOwner = existing.userId === userId;
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  if (!isOwner && !isAdmin) {
    throw new AppError('Access denied. You can only delete your own review.', 403);
  }

  const productId = existing.productId;

  await prisma.review.delete({ where: { id: reviewId } });

  if (productId) {
    await recalculateProductRating(productId);
  }

  return { message: 'Review deleted successfully.' };
};

/**
 * Get seller reviews for products belonging to the logged-in seller.
 */
export const getSellerProductReviews = async (
  sellerUserId: string,
  filters: {
    productId?: string;
    rating?: number;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }
) => {
  const { productId, rating, search, page = 1, limit = 20, sort } = filters;
  const skip = (page - 1) * limit;

  const sellerProducts = await prisma.product.findMany({
    where: { sellerId: sellerUserId },
    select: { id: true },
  });
  const productIds = sellerProducts.map((p) => p.id);

  if (productIds.length === 0) {
    return { reviews: [], total: 0, averageRating: 0, totalReviews: 0 };
  }

  const where: any = {
    productId: { in: productIds },
  };

  if (productId) {
    where.productId = productId;
  }

  if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
    where.rating = Number(rating);
  }

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { comment: { contains: q, mode: 'insensitive' } },
      { user: { name: { contains: q, mode: 'insensitive' } } },
      { product: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const orderBy = sort === 'oldest' ? { createdAt: 'asc' as const } : { createdAt: 'desc' as const };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatar: true, email: true } },
        product: { select: { id: true, name: true, images: true, price: true, slug: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  const stats = await prisma.review.aggregate({
    where: { productId: { in: productIds } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const reviewsWithPurchaseInfo = await Promise.all(
    reviews.map(async (r) => {
      const purchased = r.productId
        ? await prisma.orderItem.findFirst({
            where: {
              productId: r.productId,
              order: { customerId: r.userId },
            },
          })
        : null;

      return {
        ...r,
        isVerifiedPurchase: Boolean(purchased),
      };
    })
  );

  return {
    reviews: reviewsWithPurchaseInfo,
    total,
    averageRating: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0,
    totalReviews: stats._count.rating ?? 0,
  };
};
