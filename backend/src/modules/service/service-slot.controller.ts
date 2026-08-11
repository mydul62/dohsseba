import { Request, Response, NextFunction } from 'express';
import * as serviceSlotService from './service-slot.service';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceId = req.query.serviceId as string;
    const providerId = req.query.providerId as string;
    const date = req.query.date as string;

    const slots = await serviceSlotService.getAvailableSlots({ serviceId, providerId, date });
    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

export const getProviderSlots = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const providerId = req.user!.id;
    const date = req.query.date as string;

    const slots = await serviceSlotService.getProviderSlots(providerId, date);
    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

export const createSlot = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const providerId = req.user!.id;
    const slot = await serviceSlotService.createSlot(providerId, req.body);
    res.status(201).json({
      success: true,
      message: 'Time slot created successfully.',
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSlot = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const providerId = req.user!.id;
    const slotId = req.params.id as string;
    const slot = await serviceSlotService.updateSlot(slotId, providerId, req.body);
    res.json({
      success: true,
      message: 'Time slot updated successfully.',
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleBlockSlot = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const providerId = req.user!.id;
    const slotId = req.params.id as string;
    const slot = await serviceSlotService.toggleBlockSlot(slotId, providerId);
    res.json({
      success: true,
      message: `Time slot is now ${slot.status}.`,
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSlot = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const providerId = req.user!.id;
    const slotId = req.params.id as string;
    const result = await serviceSlotService.deleteSlot(slotId, providerId);
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
