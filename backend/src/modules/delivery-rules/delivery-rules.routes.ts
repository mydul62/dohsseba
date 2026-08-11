import { Router } from 'express';
import * as deliveryRulesController from './delivery-rules.controller';
import { protect, authorize } from '../../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', deliveryRulesController.getRules);
router.get('/calculate', deliveryRulesController.calculateFee);

// Admin & Seller management routes
router.post(
  '/',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN', 'SELLER'),
  deliveryRulesController.createRule
);

router.put(
  '/:id',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN', 'SELLER'),
  deliveryRulesController.updateRule
);

router.patch(
  '/:id/toggle',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN', 'SELLER'),
  deliveryRulesController.toggleRule
);

router.delete(
  '/:id',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN', 'SELLER'),
  deliveryRulesController.deleteRule
);

export default router;
