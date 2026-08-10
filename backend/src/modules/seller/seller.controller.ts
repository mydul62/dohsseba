import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as sellerService from './seller.service';

export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.user!.id;
    const data = await sellerService.getSellerDashboardStats(sellerId);
    res.json({ success: true, message: 'Seller dashboard fetched.', data });
  } catch (err) {
    next(err);
  }
};

export const getReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.user!.id;
    const reviews = await sellerService.getSellerReviews(sellerId);
    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
};

export const getStoreProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await sellerService.getStoreProfile(req.user!.id);
    res.json({ success: true, message: 'Store profile fetched.', data: profile });
  } catch (err) {
    next(err);
  }
};

export const updateStoreProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await sellerService.updateStoreProfile(req.user!.id, req.body);
    res.json({ success: true, message: 'Store profile updated.', data: profile });
  } catch (err) {
    next(err);
  }
};

export const toggleAutoAccept = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { autoAcceptOrders } = req.body;
    const profile = await sellerService.toggleAutoAccept(req.user!.id, Boolean(autoAcceptOrders));
    res.json({ success: true, message: `Auto-accept set to ${autoAcceptOrders}`, data: profile });
  } catch (err) {
    next(err);
  }
};

