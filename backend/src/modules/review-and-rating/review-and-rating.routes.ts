import { Router } from 'express';
import * as reviewAndRatingController from './review-and-rating.controller';
import { protect, authorize, optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();

// Public / Optionally authenticated product reviews query
router.get('/product/:productId', optionalAuth, reviewAndRatingController.getProductReviews);

// Seller reviews management
router.get(
  '/seller/reviews',
  protect,
  authorize('SELLER', 'ADMIN', 'SUPER_ADMIN'),
  reviewAndRatingController.getSellerReviews
);

// Protected customer review actions
router.post('/', protect, reviewAndRatingController.createReview);
router.put('/:reviewId', protect, reviewAndRatingController.updateReview);
router.delete('/:reviewId', protect, reviewAndRatingController.deleteReview);

export default router;
