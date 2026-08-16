import { Request, Response, NextFunction } from 'express';
import * as orderService from './order.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { sendResponse, getPaginationMeta } from '../../utils/response.util';
import { OrderStatus } from '@prisma/client';

export const getOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page   = Number(req.query.page   as string) || 1;
    const limit  = Number(req.query.limit  as string) || 10;
    const status = req.query.status as string | undefined;
    const { orders, total } = await orderService.getOrders(
      req.user!.id, req.user!.role, { page, limit, status }
    );
    return sendResponse(res, 200, 'Orders fetched', orders, getPaginationMeta(total, page, limit));
  } catch (error) { next(error); }
};

export const getOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.getOrderById(req.params.id as string, req.user!.id, req.user!.role);
    return sendResponse(res, 200, 'Order fetched', order);
  } catch (error) { next(error); }
};

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      const guestOrder = await orderService.createGuestOrder({
        guestName: req.body.guestName || 'DOHS Resident',
        guestPhone: req.body.phone || req.body.guestPhone || '01700000000',
        guestEmail: req.body.guestEmail,
        guestAddress: req.body.guestAddress || 'DOHS Area, Dhaka',
        items: req.body.items || [],
        notes: req.body.notes,
        paymentMethod: req.body.paymentMethod,
      });
      return sendResponse(res, 201, 'Order placed successfully', guestOrder);
    }

    const order = await orderService.createOrderFromCart(req.user.id, req.body);
    return sendResponse(res, 201, 'Order placed successfully', order);
  } catch (error) { next(error); }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.updateOrderStatus(req.params.id as string, req.body.status as OrderStatus);
    return sendResponse(res, 200, 'Order status updated', order);
  } catch (error) { next(error); }
};

export const updateOrderLocation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.updateOrderLocation(
      req.params.id as string,
      req.user!.id,
      req.user!.role,
      req.body
    );
    return sendResponse(res, 200, 'Order delivery location updated successfully', order);
  } catch (error) { next(error); }
};

export const cancelOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await orderService.cancelOrder(req.params.id as string, req.user!.id);
    return sendResponse(res, 200, 'Order cancelled');
  } catch (error) { next(error); }
};

export const deleteOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await orderService.permanentlyDeleteOrder(req.params.id as string);
    return sendResponse(res, 200, 'Order deleted permanently');
  } catch (error) { next(error); }
};

export const createGuestOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.createGuestOrder(req.body);
    return sendResponse(res, 201, 'Guest order placed successfully', order);
  } catch (error) { next(error); }
};

export const trackPublicOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.getPublicTrackingOrder(req.params.codeOrPhone as string);
    return sendResponse(res, 200, 'Order tracking details retrieved', order);
  } catch (error) { next(error); }
};

export const getSellerCustomers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customers = await orderService.getSellerCustomers(req.user!.id);
    return sendResponse(res, 200, 'Seller customer directory fetched', customers);
  } catch (error) { next(error); }
};

export const getAdminCustomers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customers = await orderService.getAdminCustomers();
    return sendResponse(res, 200, 'Admin customer directory fetched', customers);
  } catch (error) { next(error); }
};
