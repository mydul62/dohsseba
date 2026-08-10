import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { OrderStatus } from '@prisma/client';
import { emitToOnlineRiders, emitToUser, emitToOrderRoom, emitToSellerRoom, emitToRole, emitToAdminRoom } from '../../lib/socket';

// ─── Get Rider Profile ────────────────────────────────────────────────────────

export const getRiderProfile = async (riderId: string) => {
  let profile = await prisma.riderProfile.findUnique({ where: { userId: riderId } });
  if (!profile) {
    profile = await prisma.riderProfile.create({
      data: {
        userId: riderId,
        vehicleType: 'Motorcycle',
        vehicleNo: 'DHAKA-METRO-HA-1234',
        isOnline: false,
        isOnDuty: false,
        isAvailable: true,
        rating: 5.0,
        totalTrips: 0,
      },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: riderId },
    select: {
      id: true, name: true, email: true, phone: true, avatar: true,
      riderProfile: true,
    },
  });
  if (!user) throw new AppError('Rider profile not found.', 404);
  return user;
};

// ─── Toggle Duty (Online/Offline) ─────────────────────────────────────────────

export const toggleDuty = async (riderId: string, isOnline?: boolean, isOnDuty?: boolean) => {
  let profile = await prisma.riderProfile.findUnique({ where: { userId: riderId } });
  if (!profile) {
    profile = await prisma.riderProfile.create({
      data: {
        userId: riderId,
        vehicleType: 'Motorcycle',
        vehicleNo: 'DHAKA-METRO-HA-1234',
        isOnline: true,
        isOnDuty: true,
        isAvailable: true,
        rating: 5.0,
        totalTrips: 0,
      },
    });
    return profile;
  }

  const onlineState = isOnline !== undefined ? isOnline : (isOnDuty !== undefined ? isOnDuty : !profile.isOnline);
  const dutyState   = isOnDuty !== undefined ? isOnDuty : onlineState;

  const updated = await prisma.riderProfile.update({
    where: { userId: riderId },
    data: {
      isOnline: onlineState,
      isOnDuty: dutyState,
      isAvailable: onlineState,
      lastHeartbeat: new Date(),
    },
  });

  return updated;
};

// ─── Get Open Broadcast Orders (Ready for Rider) ──────────────────────────────

export const getOpenOrders = async () => {
  let settings = await (prisma as any).siteSetting.findUnique({ where: { id: 'default' } });
  const commissionPercent = settings?.riderCommissionPercent ?? 80;

  const rawOrders = await prisma.order.findMany({
    where: {
      status: 'READY_FOR_RIDER',
      assignedRiderId: null,
      riderId: null,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { name: true, phone: true } },
      address: true,
      items: {
        include: {
          product: {
            select: { name: true, images: true, unit: true, seller: { select: { sellerProfile: true, name: true } } },
          },
        },
      },
    },
  });

  return rawOrders.map((o) => {
    const baseFee = o.deliveryFee || 50;
    const netEarning = Math.round((baseFee * commissionPercent) / 100);
    return {
      ...o,
      riderCommissionPercent: commissionPercent,
      netEarning,
      earnings: netEarning,
      estimatedEarnings: netEarning,
    };
  });
};

// ─── Accept Open Broadcast Order (Transaction-Safe Assignment) ───────────────

export const acceptOpenOrder = async (orderId: string, riderId: string) => {
  const riderUser = await prisma.user.findUnique({
    where: { id: riderId },
    include: { riderProfile: true },
  });
  if (!riderUser) throw new AppError('Rider not found.', 404);

  // Atomic database update to prevent race conditions (2 riders accepting simultaneously)
  const updatedOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { riderAssignment: true, items: { include: { product: true } } },
    });
    if (!order) throw new AppError('Order not found.', 404);
    if (order.riderId !== null || order.riderAssignment !== null) {
      throw new AppError('Order has already been accepted by another rider.', 409);
    }

    if (riderUser.riderProfile) {
      const activeCount = await tx.order.count({
        where: {
          riderId,
          status: { in: ['RIDER_ASSIGNED', 'ARRIVED_AT_STORE', 'PICKUP_STARTED', 'PICKED_UP', 'ON_THE_WAY', 'ARRIVED', 'ARRIVED_DESTINATION'] },
        },
      });

      // Rider remains available for multi-order batching up to 5 concurrent missions
      await tx.riderProfile.update({
        where: { userId: riderId },
        data: {
          isAvailable: riderUser.riderProfile.isOnline && activeCount + 1 < 5,
          currentOrderId: orderId,
        },
      });
    }

    // Create RiderAssignment record
    await tx.riderAssignment.create({
      data: {
        orderId,
        riderId,
        status: 'ASSIGNED',
        acceptedAt: new Date(),
      },
    });

    // Create notifications for Customer, Rider, and Seller
    if (order.customerId) {
      await tx.notification.create({
        data: {
          userId: order.customerId,
          title: 'Rider Assigned to Your Order',
          message: `Rider ${riderUser.name} (${riderUser.phone || '01306031982'}) has accepted your delivery!`,
          type: 'INFO',
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: riderId,
        title: 'Order Successfully Assigned',
        message: `You have successfully accepted delivery for Order #${order.id.slice(-6).toUpperCase()}.`,
        type: 'SUCCESS',
      },
    });

    const sellerIds = [...new Set(order.items.map((i) => i.product.sellerId).filter(Boolean))];
    for (const sId of sellerIds) {
      await tx.notification.create({
        data: {
          userId: sId!,
          title: 'Rider Assigned to Order',
          message: `Rider ${riderUser.name} (${riderUser.phone || '01306031982'}) has accepted Order #${order.id.slice(-6).toUpperCase()}.`,
          type: 'INFO',
        },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        riderId,
        assignedRiderId: riderId,
        riderName: riderUser.name,
        status: 'RIDER_ASSIGNED',
        acceptedAt: new Date(),
        assignedAt: new Date(),
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        address: true,
        rider: { select: { id: true, name: true, phone: true, avatar: true } },
        riderAssignment: true,
        items: {
          include: {
            product: { select: { name: true, sellerId: true } },
          },
        },
      },
    });
  });

  // Socket notifications
  emitToOnlineRiders('RIDER_ORDER_DISMISS', { orderId, assignedRiderId: riderId });
  emitToUser(riderId, 'RIDER_ORDER_ACCEPTED', { orderId, order: updatedOrder });
  emitToUser(riderId, 'MISSION_STARTED', { orderId, order: updatedOrder });

  if (updatedOrder.customerId) {
    emitToUser(updatedOrder.customerId, 'ORDER_STATUS_UPDATED', {
      orderId,
      status: 'RIDER_ASSIGNED',
      riderName: riderUser.name,
      riderPhone: riderUser.phone,
    });
  }

  const sellerId = updatedOrder.items[0]?.product?.sellerId;
  if (sellerId) {
    emitToSellerRoom(sellerId, 'ORDER_STATUS_UPDATED', { orderId, status: 'RIDER_ASSIGNED', riderName: riderUser.name, order: updatedOrder });
    emitToSellerRoom(sellerId, 'order:status_updated', { orderId, status: 'RIDER_ASSIGNED', riderName: riderUser.name, order: updatedOrder });
  }

  emitToRole('SELLER', 'ORDER_STATUS_UPDATED', { orderId, status: 'RIDER_ASSIGNED', order: updatedOrder });
  emitToRole('SELLER', 'order:status_updated', { orderId, status: 'RIDER_ASSIGNED', order: updatedOrder });
  emitToOrderRoom(orderId, 'ORDER_STATUS_UPDATED', { orderId, status: 'RIDER_ASSIGNED', order: updatedOrder });
  emitToOrderRoom(orderId, 'order:status_updated', { orderId, status: 'RIDER_ASSIGNED', order: updatedOrder });

  return updatedOrder;
};

// ─── Get Assigned Rider Details ───────────────────────────────────────────────

export const getAssignedRiderByOrder = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      riderId: true,
      riderName: true,
      acceptedAt: true,
      status: true,
      rider: {
        select: {
          id: true,
          name: true,
          phone: true,
          avatar: true,
          riderProfile: true,
        },
      },
      riderAssignment: true,
    },
  });
  if (!order) throw new AppError('Order not found.', 404);
  return {
    orderId: order.id,
    assigned: Boolean(order.riderId || order.riderAssignment),
    riderName: order.riderName || order.rider?.name || null,
    riderPhone: order.rider?.phone || '01306031982',
    riderAvatar: order.rider?.avatar || null,
    acceptedAt: order.acceptedAt || order.riderAssignment?.acceptedAt || null,
    deliveryStatus: order.status,
    rider: order.rider,
    riderAssignment: order.riderAssignment,
  };
};

// ─── Get Active Assigned Missions ─────────────────────────────────────────────

export const getActiveMissions = async (riderId: string) => {
  return prisma.order.findMany({
    where: {
      OR: [{ riderId }, { assignedRiderId: riderId }],
      status: {
        in: ['RIDER_ASSIGNED', 'ARRIVED_AT_STORE', 'PICKUP_STARTED', 'PICKED_UP', 'ON_THE_WAY', 'ARRIVED', 'ARRIVED_DESTINATION'] as any[],
      },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      customer: { select: { name: true, phone: true } },
      address: true,
      items: {
        include: {
          product: { select: { name: true, images: true, unit: true, seller: { select: { name: true, phone: true, sellerProfile: true } } } },
        },
      },
    },
  });
};

// ─── Update Sequential Delivery Mission Status ────────────────────────────────

export const updateMissionStatus = async (
  orderId: string,
  riderId: string,
  targetStatusInput: string
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { select: { sellerId: true } } } } },
  });

  if (!order) throw new AppError('Order not found.', 404);
  if (order.riderId !== riderId && order.assignedRiderId !== riderId) {
    throw new AppError('This mission is not assigned to you.', 403);
  }

  // Normalize status aliases from frontend
  const statusAliasMap: Record<string, OrderStatus> = {
    ASSIGNED: 'RIDER_ASSIGNED',
    ARRIVED_SELLER: 'ARRIVED_AT_STORE',
    DELIVERING: 'ON_THE_WAY',
    ARRIVED_CUSTOMER: 'ARRIVED_DESTINATION',
    COMPLETED: 'DELIVERED',
  };

  const targetStatus: OrderStatus = statusAliasMap[targetStatusInput] || (targetStatusInput as OrderStatus);

  const allowedTransitions: Record<string, string[]> = {
    PENDING: ['RIDER_ASSIGNED', 'ARRIVED_AT_STORE', 'CANCELLED'],
    SELLER_ACCEPTED: ['RIDER_ASSIGNED', 'ARRIVED_AT_STORE', 'CANCELLED'],
    READY_FOR_RIDER: ['RIDER_ASSIGNED', 'ARRIVED_AT_STORE', 'CANCELLED'],
    RIDER_ASSIGNED: ['ARRIVED_AT_STORE', 'PICKUP_STARTED', 'PICKED_UP', 'ON_THE_WAY', 'CANCELLED'],
    ARRIVED_AT_STORE: ['PICKUP_STARTED', 'PICKED_UP', 'ON_THE_WAY', 'CANCELLED'],
    PICKUP_STARTED: ['PICKED_UP', 'ON_THE_WAY', 'CANCELLED'],
    PICKED_UP: ['ON_THE_WAY', 'ARRIVED_DESTINATION', 'DELIVERED', 'CANCELLED'],
    ON_THE_WAY: ['ARRIVED', 'ARRIVED_DESTINATION', 'DELIVERED', 'CANCELLED'],
    ARRIVED: ['DELIVERED', 'CANCELLED'],
    ARRIVED_DESTINATION: ['DELIVERED', 'CANCELLED'],
  };

  const valid = allowedTransitions[order.status]?.includes(targetStatus) || order.status === targetStatus;
  if (!valid) {
    console.warn(`Direct status update forced from ${order.status} to ${targetStatus}`);
  }

  const updateData: any = {
    status: targetStatus,
    riderId,
    assignedRiderId: riderId,
  };
  if (targetStatus === 'PICKED_UP') {
    updateData.pickupAt = new Date();
  }
  if (targetStatus === 'DELIVERED') {
    updateData.deliveredAt = new Date();
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      address: true,
      items: {
        include: {
          product: { select: { id: true, name: true, images: true, unit: true, price: true, sellerId: true } },
        },
      },
    },
  });

  // On DELIVERY completed -> update rider stats & payment & credit rider commission
  if (targetStatus === 'DELIVERED') {
    let settings = await (prisma as any).siteSetting.findUnique({ where: { id: 'default' } });
    const commissionPercent = settings?.riderCommissionPercent ?? 80;
    const baseDeliveryFee = order.deliveryFee || 50;
    const riderEarning = Math.round((baseDeliveryFee * commissionPercent) / 100);

    await prisma.riderProfile.update({
      where: { userId: riderId },
      data: {
        isAvailable: true,
        currentOrderId: null,
        totalTrips: { increment: 1 },
        totalEarnings: { increment: riderEarning },
      },
    });

    const riderWallet = await prisma.wallet.findUnique({ where: { userId: riderId } });
    if (riderWallet) {
      await prisma.transaction.create({
        data: {
          walletId: riderWallet.id,
          type: 'CREDIT',
          amount: riderEarning,
          description: `Delivery Earning (${commissionPercent}% share of ৳${baseDeliveryFee} delivery fee) for Order #${order.id.slice(-6)}`,
        },
      });
      await prisma.wallet.update({
        where: { id: riderWallet.id },
        data: { balance: { increment: riderEarning } },
      });
    }

    await prisma.payment.updateMany({
      where: { orderId },
      data: { status: 'PAID' },
    });

    emitToUser(riderId, 'MISSION_COMPLETED', {
      orderId,
      order: updatedOrder,
      riderEarning,
      commissionPercent,
    });
  }

  if (order.customerId) {
    emitToUser(order.customerId, 'ORDER_STATUS_UPDATED', { orderId, status: targetStatus });
  }
  const sellerId = order.items[0]?.product?.sellerId;
  if (sellerId) {
    emitToSellerRoom(sellerId, 'ORDER_STATUS_UPDATED', { orderId, status: targetStatus, order: updatedOrder });
    emitToSellerRoom(sellerId, 'order:status_updated', { orderId, status: targetStatus, order: updatedOrder });
  }
  emitToOrderRoom(orderId, 'ORDER_STATUS_UPDATED', { orderId, status: targetStatus, order: updatedOrder });
  emitToOrderRoom(orderId, 'order:status_updated', { orderId, status: targetStatus, order: updatedOrder });
  emitToRole('SELLER', 'ORDER_STATUS_UPDATED', { orderId, status: targetStatus, order: updatedOrder });
  emitToRole('SELLER', 'order:status_updated', { orderId, status: targetStatus, order: updatedOrder });
  emitToAdminRoom('ORDER_STATUS_UPDATED', { orderId, status: targetStatus, order: updatedOrder });
  emitToAdminRoom('order:status_updated', { orderId, status: targetStatus, order: updatedOrder });

  return updatedOrder;
};

// ─── Get Today Stats ──────────────────────────────────────────────────────────

export const getTodayStats = async (riderId: string) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todayDeliveries, activeOrders, profile] = await Promise.all([
    prisma.order.count({
      where: { riderId, status: 'DELIVERED', updatedAt: { gte: startOfDay } },
    }),
    prisma.order.count({
      where: {
        riderId,
        status: { in: ['RIDER_ASSIGNED', 'PICKUP_STARTED', 'PICKED_UP', 'ON_THE_WAY', 'ARRIVED'] },
      },
    }),
    prisma.riderProfile.findUnique({ where: { userId: riderId } }),
  ]);

  const todayEarnings = await prisma.order.aggregate({
    where: { riderId, status: 'DELIVERED', updatedAt: { gte: startOfDay } },
    _sum: { deliveryFee: true },
  });

  return {
    todayDeliveries,
    activeOrders,
    todayEarnings: todayEarnings._sum.deliveryFee ?? 0,
    totalTrips: profile?.totalTrips ?? 0,
    totalEarnings: profile?.totalEarnings ?? 0,
    rating: profile?.rating ?? 5.0,
    isOnline: profile?.isOnline ?? false,
    isAvailable: profile?.isAvailable ?? true,
    vehicleType: profile?.vehicleType ?? 'Bicycle',
    vehicleNo: profile?.vehicleNo ?? '',
  };
};

// ─── Delivery History ─────────────────────────────────────────────────────────

export const getDeliveryHistory = async (userId: string, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;

  const profile = await prisma.riderProfile.findUnique({ where: { userId } }).catch(() => null);
  const profileId = profile?.id;

  const riderMatchConditions: any[] = [
    { riderId: userId },
    { assignedRiderId: userId },
    { riderAssignment: { riderId: userId } },
  ];

  if (profileId) {
    riderMatchConditions.push({ riderId: profileId });
    riderMatchConditions.push({ assignedRiderId: profileId });
    riderMatchConditions.push({ riderAssignment: { riderId: profileId } });
  }

  const where: any = {
    OR: riderMatchConditions,
    status: { in: ['DELIVERED', 'CANCELLED', 'REJECTED', 'COMPLETED'] as any[] },
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      include: {
        customer: { select: { name: true, phone: true } },
        address: { select: { line1: true, line2: true, area: true, city: true, phone: true } },
        items: {
          include: {
            product: { select: { name: true, images: true, unit: true, seller: true } },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total };
};

// ─── Get Location History Trajectory ──────────────────────────────────────────

export const getLocationHistory = async (orderId: string) => {
  return prisma.riderLocation.findMany({
    where: { orderId },
    orderBy: { createdAt: 'asc' },
  });
};

// ─── Withdrawal Requests ──────────────────────────────────────────────────────

export const requestWithdrawal = async (riderId: string, payload: {
  amount: number;
  paymentMethod: string;
  accountNumber: string;
  accountName?: string;
  bankName?: string;
  branchName?: string;
  note?: string;
}) => {
  if (!payload.amount || payload.amount < 100) {
    throw new AppError('Minimum withdrawal amount is ৳100.', 400);
  }
  if (!payload.accountNumber || !payload.paymentMethod) {
    throw new AppError('Payment method and account number are required.', 400);
  }

  const profile = await prisma.riderProfile.findUnique({ where: { userId: riderId } });
  const totalEarnings = profile?.totalEarnings ?? 0;

  const existingWithdrawals = await prisma.withdrawalRequest.aggregate({
    where: { userId: riderId, status: { in: ['PENDING', 'APPROVED', 'PAID'] } },
    _sum: { amount: true },
  });
  const totalWithdrawnOrPending = existingWithdrawals._sum.amount ?? 0;
  const availableBalance = Math.max(0, totalEarnings - totalWithdrawnOrPending);

  if (availableBalance < payload.amount && totalEarnings > 0) {
    throw new AppError(`Insufficient balance. Your withdrawable balance is ৳${availableBalance}`, 400);
  }

  const withdrawal = await prisma.withdrawalRequest.create({
    data: {
      userId: riderId,
      userRole: 'RIDER',
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      accountNumber: payload.accountNumber,
      accountName: payload.accountName,
      bankName: payload.bankName,
      branchName: payload.branchName,
      note: payload.note,
      status: 'PENDING',
    },
  });

  emitToAdminRoom('NEW_WITHDRAWAL_REQUEST', {
    id: withdrawal.id,
    userId: riderId,
    amount: payload.amount,
    paymentMethod: payload.paymentMethod,
    requestedAt: withdrawal.requestedAt,
  });

  return withdrawal;
};

export const getWithdrawalHistory = async (riderId: string) => {
  const requests = await prisma.withdrawalRequest.findMany({
    where: { userId: riderId },
    orderBy: { requestedAt: 'desc' },
  });
  const profile = await prisma.riderProfile.findUnique({ where: { userId: riderId } });
  const totalEarnings = profile?.totalEarnings ?? 0;

  const existingWithdrawals = await prisma.withdrawalRequest.aggregate({
    where: { userId: riderId, status: { in: ['PENDING', 'APPROVED', 'PAID'] } },
    _sum: { amount: true },
  });
  const totalWithdrawnOrPending = existingWithdrawals._sum.amount ?? 0;
  const availableBalance = Math.max(0, totalEarnings - totalWithdrawnOrPending);

  return { requests, totalEarnings, availableBalance };
};

// ─── Remove Item from Active Order ───────────────────────────────────────────

export const removeOrderItem = async (orderId: string, itemId: string, riderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw new AppError('Order not found.', 404);
  if (order.riderId !== riderId && order.assignedRiderId !== riderId) {
    throw new AppError('This order is not assigned to you.', 403);
  }

  // Delete the specific item
  await prisma.orderItem.delete({
    where: { id: itemId },
  });

  // Re-fetch remaining items
  const remainingItems = await prisma.orderItem.findMany({
    where: { orderId },
  });

  // If no items left, mark order as CANCELLED
  if (remainingItems.length === 0) {
    return prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: {
        customer: { select: { name: true, phone: true } },
        address: true,
        items: true,
      },
    });
  }

  // Recalculate financial breakdown
  const newSubTotal = remainingItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );
  const deliveryFee = order.deliveryFee ?? 50;
  const discount = order.discount ?? 0;
  const newTotal = Math.max(0, newSubTotal + deliveryFee - discount);

  return prisma.order.update({
    where: { id: orderId },
    data: {
      subTotal: newSubTotal,
      totalAmount: newTotal,
    },
    include: {
      customer: { select: { name: true, phone: true } },
      address: true,
      items: {
        include: {
          product: { select: { name: true, images: true, unit: true, seller: true } },
        },
      },
    },
  });
};
