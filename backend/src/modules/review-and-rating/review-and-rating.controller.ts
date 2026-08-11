import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as reviewAndRatingService from './review-and-rating.service';

export const getProductReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const userId = req.user?.id;

    const data = await reviewAndRatingService.getProductReviewSummary(
      productId,
      page,
      limit,
      userId
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const result = await reviewAndRatingService.createOrUpdateProductReview(userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Review saved successfully.',
      data: result.review,
      isVerifiedPurchase: result.isVerifiedPurchase,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reviewId = Array.isArray(req.params.reviewId) ? req.params.reviewId[0] : req.params.reviewId;
    const userId = req.user!.id;
    const review = await reviewAndRatingService.updateProductReview(reviewId, userId, req.body);

    res.json({
      success: true,
      message: 'Review updated successfully.',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reviewId = Array.isArray(req.params.reviewId) ? req.params.reviewId[0] : req.params.reviewId;
    const userId = req.user!.id;
    const role = req.user!.role;

    const result = await reviewAndRatingService.deleteProductReview(reviewId, userId, role);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const getSellerReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sellerUserId = req.user!.id;
    const productId = req.query.productId as string | undefined;
    const rating = req.query.rating ? Number(req.query.rating) : undefined;
    const search = req.query.search as string | undefined;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const sort = req.query.sort as string | undefined;

    const data = await reviewAndRatingService.getSellerProductReviews(sellerUserId, {
      productId,
      rating,
      search,
      page,
      limit,
      sort,
    });

    res.json({
      success: true,
      data: data.reviews,
      total: data.total,
      averageRating: data.averageRating,
      totalReviews: data.totalReviews,
    });
  } catch (error) {
    next(error);
  }
};
