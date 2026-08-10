import { Router } from 'express';
import * as adminController from './admin.controller';
import { protect, authorize } from '../../middlewares/auth.middleware';

const router = Router();

// All admin routes require ADMIN role
router.use(protect, authorize('ADMIN'));

// Dashboard
router.get('/dashboard',    adminController.getDashboard);

// Users
router.get('/users',        adminController.getUsers);
router.post('/users/create', adminController.createUser);
router.patch('/users/:id/toggle', adminController.toggleUser);
router.patch('/users/:id/role',   adminController.updateRole);
router.patch('/users/:id/approve', adminController.approvePartner);

// Banners
router.get('/banners',            adminController.getBanners);
router.post('/banners',           adminController.createBanner);
router.put('/banners/:id',        adminController.updateBanner);
router.patch('/banners/:id/toggle', adminController.toggleBanner);
router.delete('/banners/:id',     adminController.deleteBanner);

// Coupons
router.get('/coupons',            adminController.getCoupons);
router.post('/coupons',           adminController.createCoupon);
router.put('/coupons/:id',        adminController.updateCoupon);
router.patch('/coupons/:id/toggle', adminController.toggleCoupon);
router.delete('/coupons/:id',     adminController.deleteCoupon);

// ─── Orders & Dispatch ────────────────────────────────────────────────────────
router.get('/orders',                       adminController.getAdminOrders);
router.get('/dispatch-queue',               adminController.getDispatchQueue);
router.post('/orders/:id/assign-rider',     adminController.assignRider);
router.patch('/orders/:id/assign-rider',    adminController.assignRider);
router.patch('/orders/:id/unassign-rider',  adminController.unassignRider);

// ─── Riders & Fleet Dispatch ──────────────────────────────────────────────────
router.get('/fleet',            adminController.getFleetDashboardData);
router.get('/riders',           adminController.getAllRiders);
router.get('/riders/available', adminController.getAvailableRiders);

// ─── Email & Chat ─────────────────────────────────────────────────────────────
router.get('/chat/conversations', adminController.getChatConversations);
router.post('/chat/send',         adminController.sendChatMessage);
router.post('/email/broadcast',   adminController.sendEmailBroadcast);

// ─── Website Settings ─────────────────────────────────────────────────────────
router.get('/settings',        adminController.getSiteSettings);
router.put('/settings',        adminController.updateSiteSettings);

// ─── Withdrawal & Payout Management ──────────────────────────────────────────
router.get('/withdrawals',        adminController.getWithdrawals);
router.patch('/withdrawals/:id',  adminController.updateWithdrawalStatus);
router.delete('/withdrawals/:id', adminController.deleteWithdrawal);

export default router;
