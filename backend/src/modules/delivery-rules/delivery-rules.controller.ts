import { Request, Response, NextFunction } from 'express';
import * as deliveryRulesService from './delivery-rules.service';

export const getRules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const onlyActive = req.query.active === 'true';
    const rules = await deliveryRulesService.getAllRules(onlyActive);
    res.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    next(error);
  }
};

export const calculateFee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subtotal = Number(req.query.subtotal) || 0;
    const result = await deliveryRulesService.getCalculatedDeliveryFee(subtotal);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rule = await deliveryRulesService.createRule(req.body);
    res.status(201).json({
      success: true,
      message: 'Delivery rule created successfully.',
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const rule = await deliveryRulesService.updateRule(id, req.body);
    res.json({
      success: true,
      message: 'Delivery rule updated successfully.',
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const rule = await deliveryRulesService.toggleRule(id);
    res.json({
      success: true,
      message: `Delivery rule is now ${rule.isActive ? 'active' : 'inactive'}.`,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deliveryRulesService.deleteRule(id);
    res.json({
      success: true,
      message: 'Delivery rule deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Delivery Speed Options (Dynamic Options) ──────────────────────────────

export const getDeliveryOptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const onlyActive = req.query.active !== 'false';
    const options = await deliveryRulesService.getDeliveryOptions(onlyActive);
    res.json({
      success: true,
      data: options,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllDeliveryOptionsAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const options = await deliveryRulesService.getDeliveryOptions(false);
    res.json({
      success: true,
      data: options,
    });
  } catch (error) {
    next(error);
  }
};

export const createDeliveryOption = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const option = await deliveryRulesService.createDeliveryOption(req.body);
    res.status(201).json({
      success: true,
      message: 'Delivery speed option created successfully.',
      data: option,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDeliveryOption = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const option = await deliveryRulesService.updateDeliveryOption(id, req.body);
    res.json({
      success: true,
      message: 'Delivery speed option updated successfully.',
      data: option,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleDeliveryOption = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const option = await deliveryRulesService.toggleDeliveryOption(id);
    res.json({
      success: true,
      message: `Delivery option is now ${option.isActive ? 'active' : 'inactive'}.`,
      data: option,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDeliveryOption = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deliveryRulesService.deleteDeliveryOption(id);
    res.json({
      success: true,
      message: 'Delivery speed option deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
