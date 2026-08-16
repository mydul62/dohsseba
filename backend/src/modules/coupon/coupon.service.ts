import { prisma } from '../../lib/prisma';

export const getAllCoupons = async () => {
  let coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  });

  if (coupons.length === 0) {
    await prisma.coupon.createMany({
      data: [
        {
          code: 'FRESH10',
          description: '10% discount on all dairy & fresh produce',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          minOrderAmount: 300,
          maxUses: 100,
          usedCount: 42,
          isActive: true,
          expiresAt: new Date('2026-12-31'),
        },
        {
          code: 'DOHS50',
          description: '৳50 flat discount on orders above ৳500',
          discountType: 'FLAT',
          discountValue: 50,
          minOrderAmount: 500,
          maxUses: 50,
          usedCount: 18,
          isActive: true,
          expiresAt: new Date('2026-12-31'),
        },
        {
          code: 'WELCOME200',
          description: '৳200 Off First Order Special',
          discountType: 'FLAT',
          discountValue: 200,
          minOrderAmount: 1500,
          maxUses: 200,
          usedCount: 85,
          isActive: true,
          expiresAt: new Date('2026-12-31'),
        },
      ],
    });

    coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  return coupons;
};

export const getAvailableCoupons = async () => {
  return prisma.coupon.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });
};

export const createCoupon = async (data: any) => {
  return prisma.coupon.create({
    data: {
      code: data.code.toUpperCase().trim(),
      description: data.description || data.title || '',
      discountType: data.discountType || 'PERCENTAGE',
      discountValue: Number(data.discountValue || data.discount || 0),
      minOrderAmount: data.minOrderAmount ? Number(data.minOrderAmount) : null,
      maxUses: data.maxUses ? Number(data.maxUses) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : new Date('2026-12-31'),
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    },
  });
};

export const toggleCoupon = async (id: string) => {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new Error('Coupon not found');
  return prisma.coupon.update({
    where: { id },
    data: { isActive: !coupon.isActive },
  });
};

export const deleteCoupon = async (id: string) => {
  return prisma.coupon.delete({
    where: { id },
  });
};

export const validateCoupon = async (code: string, subtotal: number) => {
  if (!code) throw new Error('Coupon code is required');

  const coupon = await prisma.coupon.findFirst({
    where: {
      code: code.trim().toUpperCase(),
      isActive: true,
    },
  });

  if (!coupon) throw new Error('Invalid or expired coupon code');

  // Check expiry
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new Error('This coupon has expired');
  }

  // Check usage limit
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw new Error('This coupon has reached its usage limit');
  }

  // Check minimum order
  if (coupon.minOrderAmount !== null && subtotal < coupon.minOrderAmount) {
    throw new Error(
      `Minimum order amount of ৳${coupon.minOrderAmount} required for this coupon`
    );
  }

  // Calculate discount
  const discount =
    coupon.discountType === 'PERCENTAGE'
      ? Math.round((subtotal * coupon.discountValue) / 100)
      : Math.min(coupon.discountValue, subtotal); // flat discount, can't exceed subtotal

  return {
    id: coupon.id,
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discount,
    finalTotal: Math.max(0, subtotal - discount),
  };
};
