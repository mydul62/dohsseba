import { Router } from 'express';
import * as deliveryRulesController from './delivery-rules.controller';
import { protect, authorize } from '../../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', deliveryRulesController.getRules);
router.get('/calculate', deliveryRulesController.calculateFee);
router.get('/options', deliveryRulesController.getDeliveryOptions);

// Admin & Seller management routes for delivery rules & speed options
router.get(
  '/options/admin',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN', 'SELLER'),
  deliveryRulesController.getAllDeliveryOptionsAdmin
);

router.post(
  '/options',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN', 'SELLER'),
  deliveryRulesController.createDeliveryOption
);

router.put(
  '/options/:id',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN', 'SELLER'),
  deliveryRulesController.updateDeliveryOption
);

router.patch(
  '/options/:id/toggle',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN', 'SELLER'),
  deliveryRulesController.toggleDeliveryOption
);

router.delete(
  '/options/:id',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN', 'SELLER'),
  deliveryRulesController.deleteDeliveryOption
);

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
