import { Request, Response, NextFunction } from 'express';
import * as adminService from './admin.service';
import { sendResponse, getPaginationMeta } from '../../utils/response.util';

export const getDashboard = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getDashboardStats();
    return sendResponse(res, 200, 'Dashboard stats fetched', data);
  } catch (error) { next(error); }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page   = Number(req.query.page   as string) || 1;
    const limit  = Number(req.query.limit  as string) || 20;
    const role   = req.query.role   as string | undefined;
    const search = req.query.search as string | undefined;
    const { users, total } = await adminService.getAllUsers(page, limit, role, search);
    return sendResponse(res, 200, 'Users fetched', users, getPaginationMeta(total, page, limit));
  } catch (error) { next(error); }
};

export const toggleUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await adminService.toggleUserStatus(req.params.id as string);
    return sendResponse(res, 200, `User ${user.isActive ? 'activated' : 'deactivated'}`, user);
  } catch (error) { next(error); }
};

export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;
    const user = await adminService.updateUserRole(req.params.id as string, role);
    return sendResponse(res, 200, `User role updated to ${role}`, user);
  } catch (error) { next(error); }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await adminService.createUser(req.body);
    return sendResponse(res, 201, `User ${user.name} created successfully as ${user.role}`, user);
  } catch (error) { next(error); }
};

export const approvePartner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await adminService.approvePartner(req.params.id as string);
    return sendResponse(res, 200, 'Partner approved successfully', user);
  } catch (error) { next(error); }
};

// Banners
export const getBanners = async (_req: Request, res: Response, next: NextFunction) => {
  try { return sendResponse(res, 200, 'Banners fetched', await adminService.getBanners()); }
  catch (e) { next(e); }
};
export const createBanner = async (req: Request, res: Response, next: NextFunction) => {
  try { return sendResponse(res, 201, 'Banner created', await adminService.createBanner(req.body)); }
  catch (e) { next(e); }
};
export const updateBanner = async (req: Request, res: Response, next: NextFunction) => {
  try { return sendResponse(res, 200, 'Banner updated', await adminService.updateBanner(req.params.id as string, req.body)); }
  catch (e) { next(e); }
};
export const toggleBanner = async (req: Request, res: Response, next: NextFunction) => {
  try { return sendResponse(res, 200, 'Banner status updated', await adminService.toggleBannerStatus(req.params.id as string)); }
  catch (e) { next(e); }
};
export const deleteBanner = async (req: Request, res: Response, next: NextFunction) => {
  try { await adminService.deleteBanner(req.params.id as string); return sendResponse(res, 200, 'Banner deleted'); }
  catch (e) { next(e); }
};

// Coupons
export const getCoupons = async (_req: Request, res: Response, next: NextFunction) => {
  try { return sendResponse(res, 200, 'Coupons fetched', await adminService.getCoupons()); }
  catch (e) { next(e); }
};
export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try { return sendResponse(res, 201, 'Coupon created', await adminService.createCoupon(req.body)); }
  catch (e) { next(e); }
};
export const updateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try { return sendResponse(res, 200, 'Coupon updated', await adminService.updateCoupon(req.params.id as string, req.body)); }
  catch (e) { next(e); }
};
export const toggleCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try { return sendResponse(res, 200, 'Coupon status updated', await adminService.toggleCouponStatus(req.params.id as string)); }
  catch (e) { next(e); }
};
export const deleteCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try { await adminService.deleteCoupon(req.params.id as string); return sendResponse(res, 200, 'Coupon deleted'); }
  catch (e) { next(e); }
};

// ─── Rider Dispatch Controllers ───────────────────────────────────────────────

export const getAvailableRiders = async (_req: Request, res: Response, next: NextFunction) => {
  try { return sendResponse(res, 200, 'Available riders fetched', await adminService.getAvailableRiders()); }
  catch (e) { next(e); }
};

export const getAllRiders = async (_req: Request, res: Response, next: NextFunction) => {
  try { return sendResponse(res, 200, 'All riders fetched', await adminService.getAllRiders()); }
  catch (e) { next(e); }
};

export const getAdminOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page   = Number(req.query.page)   || 1;
    const limit  = Number(req.query.limit)  || 20;
    const status = req.query.status as string | undefined;
    const { orders, total } = await adminService.getAdminOrders(page, limit, status);
    return sendResponse(res, 200, 'Orders fetched', orders, getPaginationMeta(total, page, limit));
  } catch (e) { next(e); }
};

export const getDispatchQueue = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getDispatchQueue();
    return sendResponse(res, 200, 'Dispatch queue fetched', data);
  } catch (e) { next(e); }
};

export const assignRider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { riderId } = req.body;
    const order = await adminService.assignRiderToOrder(req.params.id as string, riderId);
    return sendResponse(res, 200, 'Rider assigned successfully', order);
  } catch (e) { next(e); }
};

export const unassignRider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await adminService.unassignRider(req.params.id as string);
    return sendResponse(res, 200, 'Rider unassigned', order);
  } catch (e) { next(e); }
};

export const getFleetDashboardData = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getFleetDashboardData();
    return sendResponse(res, 200, 'Fleet dashboard data fetched', data);
  } catch (e) { next(e); }
};

// ─── Email & Chat Controllers ─────────────────────────────────────────────────

export const getChatConversations = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getChatConversations();
    return sendResponse(res, 200, 'Chat conversations fetched', data);
  } catch (e) { next(e); }
};

export const sendChatMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId, recipientId, message } = req.body;
    const data = await adminService.sendChatMessage(conversationId, recipientId, message);
    return sendResponse(res, 200, 'Message sent successfully', data);
  } catch (e) { next(e); }
};

export const sendEmailBroadcast = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetRole, subject, message } = req.body;
    const data = await adminService.sendEmailBroadcast(targetRole, subject, message);
    return sendResponse(res, 200, 'Email broadcast sent successfully', data);
  } catch (e) { next(e); }
};

// ─── Site Settings Controllers ───────────────────────────────────────────────

export const getSiteSettings = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getSiteSettings();
    return sendResponse(res, 200, 'Site settings fetched', data);
  } catch (e) { next(e); }
};

export const updateSiteSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.updateSiteSettings(req.body);
    return sendResponse(res, 200, 'Site settings updated successfully', data);
  } catch (e) { next(e); }
};

// ─── Withdrawal Requests Controllers ──────────────────────────────────────────

export const getWithdrawals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const role   = req.query.role   as string | undefined;
    const data   = await adminService.getAllWithdrawalRequests(status, role);
    return sendResponse(res, 200, 'Withdrawal requests fetched', data);
  } catch (e) { next(e); }
};

export const updateWithdrawalStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.updateWithdrawalStatus(req.params.id as string, req.body);
    return sendResponse(res, 200, `Withdrawal request status updated to ${data.status}`, data);
  } catch (e) { next(e); }
};
