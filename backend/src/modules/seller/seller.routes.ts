import { Router } from 'express';
import * as sellerController from './seller.controller';
import { protect, authorize } from '../../middlewares/auth.middleware';

const router = Router();

// All seller routes require authentication and SELLER (or ADMIN) role
router.use(protect, authorize('SELLER', 'ADMIN'));

// Dashboard
router.get('/dashboard', sellerController.getDashboard);
// Reviews
router.get('/reviews',   sellerController.getReviews);
// Store Profile
router.get('/store-profile', sellerController.getStoreProfile);
router.put('/store-profile', sellerController.updateStoreProfile);
router.patch('/auto-accept', sellerController.toggleAutoAccept);
router.get('/riders',        sellerController.getRidersFleet);

export default router;

