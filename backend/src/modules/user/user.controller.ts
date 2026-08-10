import { Response, NextFunction } from 'express';
import * as userService from './user.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { sendResponse, getPaginationMeta } from '../../utils/response.util';

// GET /api/v1/users/profile
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserProfile(req.user!.id);
    return sendResponse(res, 200, 'Profile fetched', user);
  } catch (error) { next(error); }
};

// PUT /api/v1/users/profile
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, phone, avatar, bio } = req.body;
    const user = await userService.updateUserProfile(req.user!.id, { name, phone, avatar, bio });
    return sendResponse(res, 200, 'Profile updated', user);
  } catch (error) { next(error); }
};

// GET /api/v1/users/addresses
export const getAddresses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const addresses = await userService.getUserAddresses(req.user!.id);
    return sendResponse(res, 200, 'Addresses fetched', addresses);
  } catch (error) { next(error); }
};

// POST /api/v1/users/addresses
export const addAddress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const address = await userService.addUserAddress(req.user!.id, req.body);
    return sendResponse(res, 201, 'Address added', address);
  } catch (error) { next(error); }
};

// PUT /api/v1/users/addresses/:id
export const updateAddress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const address = await userService.updateUserAddress(
      req.user!.id, req.params.id as string, req.body
    );
    return sendResponse(res, 200, 'Address updated', address);
  } catch (error) { next(error); }
};

// DELETE /api/v1/users/addresses/:id
export const deleteAddress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await userService.deleteUserAddress(req.user!.id, req.params.id as string);
    return sendResponse(res, 200, 'Address deleted');
  } catch (error) { next(error); }
};

// GET /api/v1/users/notifications
export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page  = Number(req.query.page  as string) || 1;
    const limit = Number(req.query.limit as string) || 20;
    const result = await userService.getUserNotifications(req.user!.id, page, limit);
    return sendResponse(
      res, 200, 'Notifications fetched',
      result.notifications,
      { ...getPaginationMeta(result.total, page, limit), unreadCount: result.unreadCount } as any
    );
  } catch (error) { next(error); }
};

// PATCH /api/v1/users/notifications/read-all
export const markAllRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await userService.markAllNotificationsRead(req.user!.id);
    return sendResponse(res, 200, 'All notifications marked as read');
  } catch (error) { next(error); }
};

// PATCH /api/v1/users/notifications/:id/read
export const markOneRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notification = await userService.markNotificationRead(
      req.user!.id, req.params.id as string
    );
    return sendResponse(res, 200, 'Notification marked as read', notification);
  } catch (error) { next(error); }
};
