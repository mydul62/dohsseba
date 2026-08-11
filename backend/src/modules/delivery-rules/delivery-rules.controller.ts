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
