import { Router } from 'express';
import * as couponController from './coupon.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', couponController.getAllCoupons);
router.get('/available', couponController.getAvailableCoupons);
router.post('/validate', couponController.validateCoupon); // public — no auth needed

router.post('/', protect, couponController.createCoupon);
router.patch('/:id/toggle', protect, couponController.toggleCoupon);
router.delete('/:id', protect, couponController.deleteCoupon);

export default router;
