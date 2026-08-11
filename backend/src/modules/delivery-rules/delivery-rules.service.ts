import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/error.middleware';

/**
 * Validate that a range [minAmount, maxAmount] does not overlap with any existing active rules.
 */
export const checkRangeOverlap = async (
  minAmount: number,
  maxAmount: number | null | undefined,
  excludeId?: string
) => {
  const activeRules = await prisma.deliveryRule.findMany({
    where: {
      isActive: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

  const effMaxNew = maxAmount === null || maxAmount === undefined ? Infinity : maxAmount;

  for (const rule of activeRules) {
    const effMaxRule = rule.maxAmount === null || rule.maxAmount === undefined ? Infinity : rule.maxAmount;

    if (minAmount <= effMaxRule && effMaxNew >= rule.minAmount) {
      const existingRangeStr = `৳${rule.minAmount}${rule.maxAmount !== null ? `–৳${rule.maxAmount}` : '+'}`;
      const newRangeStr = `৳${minAmount}${maxAmount !== null && maxAmount !== undefined ? `–৳${maxAmount}` : '+'}`;
      throw new AppError(
        `Rule range [${newRangeStr}] overlaps with existing active rule range (${existingRangeStr}).`,
        400
      );
    }
  }
};

export const getAllRules = async (onlyActive = false) => {
  return prisma.deliveryRule.findMany({
    where: onlyActive ? { isActive: true } : {},
    orderBy: { minAmount: 'asc' },
  });
};

export const getCalculatedDeliveryFee = async (subtotal: number) => {
  const numSubtotal = Number(subtotal) || 0;

  if (numSubtotal <= 0) {
    return {
      deliveryFee: 0,
      isFree: true,
      ruleMatched: null,
      message: 'Subtotal is 0',
    };
  }

  const activeRules = await prisma.deliveryRule.findMany({
    where: { isActive: true },
    orderBy: { minAmount: 'asc' },
  });

  // Find matching active rule where minAmount <= subtotal <= maxAmount (or maxAmount is null)
  const matchedRule = activeRules.find((rule) => {
    const minOk = numSubtotal >= rule.minAmount;
    const maxOk = rule.maxAmount === null || rule.maxAmount === undefined || numSubtotal <= rule.maxAmount;
    return minOk && maxOk;
  });

  if (matchedRule) {
    const isFree = Boolean(matchedRule.isFree);
    const deliveryFee = isFree ? 0 : matchedRule.charge;
    return {
      deliveryFee,
      isFree,
      ruleMatched: matchedRule,
    };
  }

  // Fallback if no active rule matched this subtotal amount
  const siteSettings = await (prisma as any).siteSetting.findUnique({ where: { id: 'default' } });
  const defaultFee = Number(siteSettings?.defaultDeliveryFee ?? 50);

  return {
    deliveryFee: defaultFee,
    isFree: false,
    ruleMatched: null,
    fallbackUsed: true,
  };
};

export const createRule = async (data: {
  minAmount: number;
  maxAmount?: number | null;
  charge: number;
  isFree?: boolean;
  isActive?: boolean;
}) => {
  const minAmount = Number(data.minAmount) || 0;
  const maxAmount = data.maxAmount !== undefined && data.maxAmount !== null && (data.maxAmount as any) !== ''
    ? Number(data.maxAmount)
    : null;
  const charge = data.isFree ? 0 : Number(data.charge) || 0;
  const isFree = Boolean(data.isFree);
  const isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;

  if (minAmount < 0) {
    throw new AppError('Minimum amount cannot be negative.', 400);
  }
  if (maxAmount !== null && maxAmount < minAmount) {
    throw new AppError('Maximum amount must be greater than or equal to minimum amount.', 400);
  }
  if (charge < 0) {
    throw new AppError('Delivery charge cannot be negative.', 400);
  }

  if (isActive) {
    await checkRangeOverlap(minAmount, maxAmount);
  }

  return prisma.deliveryRule.create({
    data: {
      minAmount,
      maxAmount,
      charge,
      isFree,
      isActive,
    },
  });
};

export const updateRule = async (
  id: string,
  data: {
    minAmount?: number;
    maxAmount?: number | null;
    charge?: number;
    isFree?: boolean;
    isActive?: boolean;
  }
) => {
  const existing = await prisma.deliveryRule.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Delivery rule not found.', 404);
  }

  const minAmount = data.minAmount !== undefined ? Number(data.minAmount) : existing.minAmount;
  const maxAmount = data.maxAmount !== undefined
    ? (data.maxAmount === null || (data.maxAmount as any) === '' ? null : Number(data.maxAmount))
    : existing.maxAmount;
  const isFree = data.isFree !== undefined ? Boolean(data.isFree) : existing.isFree;
  const charge = isFree ? 0 : (data.charge !== undefined ? Number(data.charge) : existing.charge);
  const isActive = data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive;

  if (minAmount < 0) {
    throw new AppError('Minimum amount cannot be negative.', 400);
  }
  if (maxAmount !== null && maxAmount < minAmount) {
    throw new AppError('Maximum amount must be greater than or equal to minimum amount.', 400);
  }
  if (charge < 0) {
    throw new AppError('Delivery charge cannot be negative.', 400);
  }

  if (isActive) {
    await checkRangeOverlap(minAmount, maxAmount, id);
  }

  return prisma.deliveryRule.update({
    where: { id },
    data: {
      minAmount,
      maxAmount,
      charge,
      isFree,
      isActive,
    },
  });
};

export const toggleRule = async (id: string) => {
  const existing = await prisma.deliveryRule.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Delivery rule not found.', 404);
  }

  const newActiveState = !existing.isActive;

  if (newActiveState) {
    await checkRangeOverlap(existing.minAmount, existing.maxAmount, id);
  }

  return prisma.deliveryRule.update({
    where: { id },
    data: { isActive: newActiveState },
  });
};

export const deleteRule = async (id: string) => {
  const existing = await prisma.deliveryRule.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Delivery rule not found.', 404);
  }

  return prisma.deliveryRule.delete({ where: { id } });
};
