import { Router } from 'express';
import * as orderController from './order.controller';
import { protect, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createOrderValidator, updateOrderStatusValidator } from './order.validate';

const router = Router();

// ─── Public Unprotected Routes (No Login Required) ───
router.post('/guest', orderController.createGuestOrder);
router.get('/track/:codeOrPhone', orderController.trackPublicOrder);

// ─── Protected Routes (Login Required) ───
router.use(protect);

router.get('/seller-customers', authorize('SELLER', 'ADMIN'), orderController.getSellerCustomers);
router.get('/admin-customers', authorize('ADMIN', 'SUPER_ADMIN'), orderController.getAdminCustomers);
router.get('/seller-analytics', authorize('SELLER', 'ADMIN'), orderController.getSellerAnalytics);

router.get('/',      orderController.getOrders);
router.get('/:id',   orderController.getOrder);
router.post('/',     createOrderValidator, validate, orderController.createOrder);
router.patch('/:id/status', authorize('SELLER', 'ADMIN'), updateOrderStatusValidator, validate, orderController.updateOrderStatus);
router.patch('/:id/location', authorize('CUSTOMER', 'SELLER', 'ADMIN'), orderController.updateOrderLocation);
router.patch('/:id/address', authorize('CUSTOMER', 'SELLER', 'ADMIN'), orderController.updateOrderLocation);
router.delete('/:id/cancel', authorize('CUSTOMER'), orderController.cancelOrder);
router.delete('/:id', authorize('SELLER', 'ADMIN'), orderController.deleteOrder);

export default router;
