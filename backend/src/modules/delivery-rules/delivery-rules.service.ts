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
  let rules = await prisma.deliveryRule.findMany({
    where: onlyActive ? { isActive: true } : {},
    orderBy: { minAmount: 'asc' },
  });

  if (rules.length === 0 && !onlyActive) {
    const count = await prisma.deliveryRule.count();
    if (count === 0) {
      await prisma.deliveryRule.createMany({
        data: [
          { minAmount: 0, maxAmount: 499, charge: 50, isFree: false, isActive: true },
          { minAmount: 500, maxAmount: 999, charge: 80, isFree: false, isActive: true },
          { minAmount: 1000, maxAmount: null, charge: 0, isFree: true, isActive: true },
        ],
      });
      rules = await prisma.deliveryRule.findMany({
        orderBy: { minAmount: 'asc' },
      });
    }
  }

  return rules;
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

// ─── Delivery Speed Options (Dynamic Checkout Options) ──────────────────────

export const getDeliveryOptions = async (onlyActive = false) => {
  let options = await prisma.deliveryOption.findMany({
    where: onlyActive ? { isActive: true } : {},
    orderBy: { priority: 'asc' },
  });

  if (options.length === 0) {
    const count = await prisma.deliveryOption.count();
    if (count === 0) {
      await prisma.deliveryOption.createMany({
        data: [
          {
            title: '45-minute express',
            badge: 'FASTEST',
            description: 'A local DOHS rider picks up your fresh items immediately.',
            speedKey: 'express',
            priority: 1,
            isActive: true,
          },
          {
            title: 'Scheduled slot',
            badge: null,
            description: 'Tomorrow morning, 8:00–10:00 AM.',
            speedKey: 'scheduled',
            priority: 2,
            isActive: true,
          },
        ],
      });
      options = await prisma.deliveryOption.findMany({
        where: onlyActive ? { isActive: true } : {},
        orderBy: { priority: 'asc' },
      });
    }
  }

  return options;
};

export const createDeliveryOption = async (data: {
  title: string;
  badge?: string;
  description: string;
  speedKey?: string;
  extraCharge?: number;
  priority?: number;
  isActive?: boolean;
}) => {
  if (!data.title || !data.description) {
    throw new AppError('Title and description are required.', 400);
  }

  const speedKey = (data.speedKey || data.title.toLowerCase().replace(/[^a-z0-9]/g, '_')).trim();

  const existing = await prisma.deliveryOption.findUnique({ where: { speedKey } });
  if (existing) {
    throw new AppError(`Delivery option with key "${speedKey}" already exists.`, 400);
  }

  return prisma.deliveryOption.create({
    data: {
      title: data.title.trim(),
      badge: data.badge?.trim() || null,
      description: data.description.trim(),
      speedKey,
      extraCharge: Number(data.extraCharge) || 0,
      priority: Number(data.priority) || 0,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    },
  });
};

export const updateDeliveryOption = async (
  id: string,
  data: {
    title?: string;
    badge?: string;
    description?: string;
    extraCharge?: number;
    priority?: number;
    isActive?: boolean;
  }
) => {
  const existing = await prisma.deliveryOption.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Delivery option not found.', 404);
  }

  return prisma.deliveryOption.update({
    where: { id },
    data: {
      title: data.title !== undefined ? data.title.trim() : existing.title,
      badge: data.badge !== undefined ? (data.badge.trim() || null) : existing.badge,
      description: data.description !== undefined ? data.description.trim() : existing.description,
      extraCharge: data.extraCharge !== undefined ? Number(data.extraCharge) : existing.extraCharge,
      priority: data.priority !== undefined ? Number(data.priority) : existing.priority,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive,
    },
  });
};

export const toggleDeliveryOption = async (id: string) => {
  const existing = await prisma.deliveryOption.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Delivery option not found.', 404);
  }

  return prisma.deliveryOption.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
};

export const deleteDeliveryOption = async (id: string) => {
  const existing = await prisma.deliveryOption.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Delivery option not found.', 404);
  }

  return prisma.deliveryOption.delete({ where: { id } });
};
