import { Response, NextFunction } from 'express';
import * as bookingService from './booking.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { sendResponse, getPaginationMeta } from '../../utils/response.util';
import { BookingStatus } from '@prisma/client';

// GET /api/v1/bookings
export const getBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page   = Number(req.query.page as string)   || 1;
    const limit  = Number(req.query.limit as string)  || 10;
    const status = req.query.status as string | undefined;

    const { bookings, total } = await bookingService.getBookings(
      req.user!.id, req.user!.role, { page, limit, status }
    );
    return sendResponse(res, 200, 'Bookings fetched', bookings, getPaginationMeta(total, page, limit));
  } catch (error) { next(error); }
};

// GET /api/v1/bookings/provider/stats
export const getProviderStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await bookingService.getProviderDashboardStats(req.user!.id);
    return sendResponse(res, 200, 'Provider stats fetched', stats);
  } catch (error) { next(error); }
};

// GET /api/v1/bookings/:id
export const getBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id as string, req.user!.id, req.user!.role);
    return sendResponse(res, 200, 'Booking fetched', booking);
  } catch (error) { next(error); }
};

// POST /api/v1/bookings
export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user?.id;
    const booking = await bookingService.createBooking(customerId, req.body);
    return sendResponse(res, 201, 'Booking created successfully', booking);
  } catch (error) { next(error); }
};

// PATCH /api/v1/bookings/:id/status
export const updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.updateBookingStatus(
      req.params.id as string, req.body.status as BookingStatus, req.user!.id, req.user!.role
    );
    return sendResponse(res, 200, 'Booking status updated', booking);
  } catch (error) { next(error); }
};

// PATCH /api/v1/bookings/:id/assign-technician
export const assignTechnician = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.assignTechnician(req.params.id as string, req.body);
    return sendResponse(res, 200, 'Technician assigned successfully', booking);
  } catch (error) { next(error); }
};

// DELETE /api/v1/bookings/:id/cancel
export const cancelBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await bookingService.cancelBooking(req.params.id as string, req.user!.id);
    return sendResponse(res, 200, 'Booking cancelled');
  } catch (error) { next(error); }
};
