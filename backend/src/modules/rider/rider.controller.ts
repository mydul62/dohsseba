import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as riderService from './rider.service';
import { sendResponse, getPaginationMeta } from '../../utils/response.util';

// ─── GET /rider/profile ───────────────────────────────────────────────────────
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await riderService.getRiderProfile(req.user!.id);
    return sendResponse(res, 200, 'Rider profile fetched', data);
  } catch (e) { next(e); }
};

// ─── GET /rider/stats ─────────────────────────────────────────────────────────
export const getStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await riderService.getTodayStats(req.user!.id);
    return sendResponse(res, 200, 'Rider stats fetched', data);
  } catch (e) { next(e); }
};

// ─── PATCH /rider/duty ────────────────────────────────────────────────────────
export const toggleDuty = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { isOnline } = req.body;
    const profile = await riderService.toggleDuty(req.user!.id, isOnline);
    return sendResponse(res, 200, `Rider duty updated. Online: ${profile.isOnline}`, profile);
  } catch (e) { next(e); }
};

// ─── GET /rider/orders/open ───────────────────────────────────────────────────
export const getOpenOrders = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await riderService.getOpenOrders();
    return sendResponse(res, 200, 'Open dispatch orders fetched', data);
  } catch (e) { next(e); }
};

// ─── POST /rider/orders/:id/accept ───────────────────────────────────────────
export const acceptOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await riderService.acceptOpenOrder(req.params.id as string, req.user!.id);
    return sendResponse(res, 200, 'Order accepted successfully', order);
  } catch (e) { next(e); }
};

// ─── GET /rider/orders/active ─────────────────────────────────────────────────
export const getActiveMissions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await riderService.getActiveMissions(req.user!.id);
    return sendResponse(res, 200, 'Active missions fetched', data);
  } catch (e) { next(e); }
};

// ─── PATCH /rider/orders/:id/status ──────────────────────────────────────────
export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, note, reason, cancellationReason, notes } = req.body;
    const cancellationNote = note || reason || cancellationReason || notes;
    const order = await riderService.updateMissionStatus(
      req.params.id as string,
      req.user!.id,
      status,
      cancellationNote
    );
    return sendResponse(res, 200, `Mission status updated to ${status}`, order);
  } catch (e) { next(e); }
};

// ─── GET /rider/orders/history ────────────────────────────────────────────────
export const getHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 20;
    const { orders, total } = await riderService.getDeliveryHistory(req.user!.id, page, limit);
    return sendResponse(res, 200, 'Delivery history fetched', orders, getPaginationMeta(total, page, limit));
  } catch (e) { next(e); }
};

// ─── GET /rider/orders/:id/assigned-rider ─────────────────────────────────────
export const getAssignedRiderByOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await riderService.getAssignedRiderByOrder(req.params.id as string);
    return sendResponse(res, 200, 'Assigned rider details fetched', data);
  } catch (e) { next(e); }
};

// ─── GET /rider/orders/:id/location-history ──────────────────────────────────
export const getLocationHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await riderService.getLocationHistory(req.params.id as string);
    return sendResponse(res, 200, 'Rider location history fetched', data);
  } catch (e) { next(e); }
};

// ─── POST /rider/withdraw ─────────────────────────────────────────────────────
export const requestWithdrawal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await riderService.requestWithdrawal(req.user!.id, req.body);
    return sendResponse(res, 201, 'Withdrawal request submitted successfully', data);
  } catch (e) { next(e); }
};

// ─── GET /rider/withdraw ──────────────────────────────────────────────────────
export const getWithdrawalHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await riderService.getWithdrawalHistory(req.user!.id);
    return sendResponse(res, 200, 'Withdrawal history fetched', data);
  } catch (e) { next(e); }
};

// ─── DELETE /rider/orders/:id/items/:itemId ──────────────────────────────────
export const removeOrderItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, itemId } = req.params;
    const order = await riderService.removeOrderItem(id as string, itemId as string, req.user!.id);
    return sendResponse(res, 200, 'Item removed from order successfully', order);
  } catch (e) { next(e); }
};
