import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware';
import * as riderController from './rider.controller';

const router = Router();

// All rider routes require authentication
router.use(protect, authorize('RIDER', 'ADMIN', 'SUPER_ADMIN', 'SELLER', 'CUSTOMER'));

// ─── Profile, Stats & Duty ───────────────────────────────────────────────────
router.get('/profile',              riderController.getProfile);
router.get('/stats',                riderController.getStats);
router.patch('/duty',               riderController.toggleDuty);
router.patch('/availability',       riderController.toggleDuty);

// ─── Orders & Dispatch ────────────────────────────────────────────────────────
router.get('/available-orders',        riderController.getOpenOrders);
router.get('/orders/open',             riderController.getOpenOrders);
router.get('/orders/active',           riderController.getActiveMissions);
router.get('/orders/history',          riderController.getHistory);
router.get('/orders/:id/assigned-rider', riderController.getAssignedRiderByOrder);
router.get('/orders/:id/location-history', riderController.getLocationHistory);
router.post('/orders/:id/accept',      riderController.acceptOrder);
router.patch('/orders/:id/accept',     riderController.acceptOrder);
router.patch('/orders/:id/status',     riderController.updateOrderStatus);
router.delete('/orders/:id/items/:itemId', riderController.removeOrderItem);
// ─── Withdrawal Requests ──────────────────────────────────────────────────────
router.get('/withdraw',  riderController.getWithdrawalHistory);
router.post('/withdraw', riderController.requestWithdrawal);

export default router;
