import { prisma } from '../../lib/prisma';
import { emitToUser } from '../../lib/socket';

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export const getDashboardStats = async () => {
  const [
    totalUsers, totalProviders, totalSellers,
    totalServices, totalProducts,
    totalBookings, totalOrders,
    pendingBookings, pendingOrders,
    recentOrders, recentBookings,
    pendingProviders,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'PROVIDER' } }),
    prisma.user.count({ where: { role: 'SELLER' } }),
    prisma.service.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.booking.count(),
    prisma.order.count(),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, email: true } },
        items: { include: { product: true } },
      },
    }),
    prisma.booking.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true } },
        service:  { select: { title: true, price: true } },
      },
    }),
    prisma.providerProfile.findMany({
      where: { isVerified: false },
      include: { user: { select: { id: true, name: true, phone: true, email: true } } },
      take: 10,
    }),
  ]);

  // Revenue calculations directly from database
  const orderRevenue   = await prisma.order.aggregate({ _sum: { totalAmount: true } });
  const bookingRevenue = await prisma.booking.aggregate({ _sum: { totalAmount: true } });
  const totalRev = (orderRevenue._sum.totalAmount ?? 0) + (bookingRevenue._sum.totalAmount ?? 0);

  // Targets & Chart breakdowns dynamically calculated from DB
  const ordersTargetPct = Math.min(100, Math.round((totalOrders / 80) * 100));
  const usersTargetPct  = Math.min(100, Math.round((totalUsers / 170) * 100));

  // Bar Chart Data dynamically scaled from DB orders and bookings
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const quickSummaryChart = months.map((m, idx) => {
    const monthOrders = recentOrders.filter((o) => new Date(o.createdAt).getMonth() === idx).length;
    const monthBookings = recentBookings.filter((b) => new Date(b.createdAt).getMonth() === idx).length;
    return {
      month: m,
      top: monthOrders * 5,
      bottom: monthBookings * 5,
    };
  });

  const pendingQueue = pendingProviders.map((p) => ({
    id: p.userId,
    name: p.user.name,
    category: p.bio || 'Home Services Provider',
    applicant: p.user.name,
    phone: p.user.phone || 'N/A',
    nid: p.nid || 'N/A',
  }));

  return {
    stats: {
      totalUsers,
      totalProviders,
      totalSellers,
      totalServices,
      totalProducts,
      totalBookings,
      totalOrders,
      pendingBookings,
      pendingOrders,
      totalRevenue: totalRev,
      earningAmount: Math.round(totalRev * 0.15),
      toPaidAmount: Math.round(totalRev * 0.85),
      onlineVisitors: 1,
      ordersTargetPct,
      usersTargetPct,
    },
    quickSummaryChart,
    recentOrders,
    recentBookings,
    pendingQueue,
  };
};

// ─── Users Management ─────────────────────────────────────────────────────────

export const getAllUsers = async (page: number, limit: number, role?: string, search?: string) => {
  const skip  = (page - 1) * limit;
  const where: any = {};
  if (role && role !== 'ALL') where.role = role as any;
  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { name:  { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, isActive: true, createdAt: true,
        _count: { select: { orders: true, bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
};

export const toggleUserStatus = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  return prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
};

export const updateUserRole = async (userId: string, role: string) => {
  return prisma.user.update({ where: { id: userId }, data: { role: role as any } });
};

export const createUser = async (data: {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: string;
}) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error('User with this email already exists');

  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.default.hash(data.password || 'password123', 12);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || '+8801700000000',
      password: hashedPassword,
      role: data.role as any,
      isActive: true,
      emailVerified: true,
    },
  });
  return user;
};

export const approvePartner = async (userId: string) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: 'PROVIDER', isActive: true },
  });
  await prisma.providerProfile.upsert({
    where: { userId },
    update: { isVerified: true },
    create: { userId, isVerified: true, experience: 3, nid: '1992269412984' },
  }).catch(() => null);
  return user;
};

// ─── Banner Management ────────────────────────────────────────────────────────

export const getBanners = async () => {
  return prisma.banner.findMany({ orderBy: { createdAt: 'desc' } });
};

export const createBanner = async (data: any) => {
  return prisma.banner.create({
    data: {
      title:    data.title || 'New Banner',
      subtitle: data.subtitle || '',
      description: data.description || '',
      image:    data.image || '🛍️',
      link:     data.link || '/services/shopping',
      category: data.category || 'Grocery',
      position: data.position || 'home',
      isActive: data.isActive !== undefined ? data.isActive : true,
      order:    data.order ? Number(data.order) : 0,
    },
  });
};

export const updateBanner = async (id: string, data: any) => {
  return prisma.banner.update({ where: { id }, data: data as any });
};

export const toggleBannerStatus = async (id: string) => {
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) throw new Error('Banner not found');
  return prisma.banner.update({
    where: { id },
    data: { isActive: !banner.isActive },
  });
};

export const deleteBanner = async (id: string) => {
  return prisma.banner.delete({ where: { id } });
};

// ─── Coupon Management ────────────────────────────────────────────────────────

export const getCoupons = async () => {
  return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
};

export const createCoupon = async (data: any) => {
  const code = (data.code || '').trim().toUpperCase();
  const existing = await prisma.coupon.findUnique({ where: { code } }).catch(() => null);
  if (existing) throw new Error('Coupon code already exists');

  return prisma.coupon.create({
    data: {
      code,
      discount:      data.discount || `৳${data.discountValue || 100} OFF`,
      discountType:  data.discountType || 'FIXED',
      discountValue: Number(data.discountValue) || 0,
      minOrderAmount: Number(data.minSpend || data.minOrderAmount) || 0,
      maxDiscount:   data.maxDiscount ? Number(data.maxDiscount) : undefined,
      maxUses:       data.maxUses ? Number(data.maxUses) : undefined,
      isActive:      data.isActive !== undefined ? data.isActive : true,
      expiresAt:     data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });
};

export const updateCoupon = async (id: string, data: any) => {
  const updateData: any = {};
  if (data.code) updateData.code = data.code.trim().toUpperCase();
  if (data.discount !== undefined) updateData.discount = data.discount;
  if (data.discountType !== undefined) updateData.discountType = data.discountType;
  if (data.discountValue !== undefined) updateData.discountValue = Number(data.discountValue) || 0;
  if (data.minSpend !== undefined || data.minOrderAmount !== undefined) {
    updateData.minOrderAmount = Number(data.minSpend ?? data.minOrderAmount) || 0;
  }
  if (data.maxUses !== undefined) updateData.maxUses = data.maxUses ? Number(data.maxUses) : null;
  if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
  if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

  return prisma.coupon.update({ where: { id }, data: updateData });
};

export const toggleCouponStatus = async (id: string) => {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new Error('Coupon not found');
  return prisma.coupon.update({
    where: { id },
    data: { isActive: !coupon.isActive },
  });
};

export const deleteCoupon = async (id: string) => {
  return prisma.coupon.delete({ where: { id } });
};

// ─── Rider Dispatch Management ────────────────────────────────────────────────

export const getAvailableRiders = async () => {
  return prisma.user.findMany({
    where: {
      role: 'RIDER',
      isActive: true,
      riderProfile: { isAvailable: true },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      riderProfile: {
        select: {
          vehicleType: true,
          vehicleNo: true,
          totalTrips: true,
          rating: true,
          isAvailable: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
};

export const getAllRiders = async () => {
  return prisma.user.findMany({
    where: { role: 'RIDER', isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      riderProfile: {
        select: {
          vehicleType: true,
          vehicleNo: true,
          totalTrips: true,
          totalEarnings: true,
          rating: true,
          isAvailable: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
};

export const getAdminOrders = async (
  page = 1,
  limit = 20,
  status?: string,
) => {
  const skip = (page - 1) * limit;
  const where: any = {};
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        address:  true,
        rider:    { select: { id: true, name: true, phone: true } },
        items: {
          include: {
            product: { select: { name: true, images: true } },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);
  return { orders, total };
};

export const getDispatchQueue = async () => {
  const [pendingDispatch, manualAssignmentRequired, activeDeliveries, riders] = await Promise.all([
    prisma.order.findMany({
      where: { status: 'READY_FOR_RIDER' },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        address: true,
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { status: 'WAITING_FOR_MANUAL_ASSIGNMENT' },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        address: true,
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: {
        status: { in: ['RIDER_ASSIGNED', 'ARRIVED_AT_STORE', 'PICKUP_STARTED', 'PICKED_UP', 'ON_THE_WAY', 'ARRIVED', 'ARRIVED_DESTINATION'] },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        rider: { select: { id: true, name: true, phone: true } },
        address: true,
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.user.findMany({
      where: { role: 'RIDER' },
      select: {
        id: true, name: true, email: true, phone: true, avatar: true,
        riderProfile: true,
      },
    }),
  ]);

  return {
    pendingDispatch,
    manualAssignmentRequired,
    activeDeliveries,
    riders,
  };
};

export const assignRiderToOrder = async (orderId: string, riderId: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found.');
  if (['DELIVERED', 'CANCELLED', 'REJECTED'].includes(order.status)) {
    throw new Error(`Cannot assign rider to completed or cancelled order with status ${order.status}.`);
  }

  const rider = await prisma.user.findUnique({
    where: { id: riderId },
    include: { riderProfile: true },
  });
  if (!rider || rider.role !== 'RIDER') throw new Error('Invalid rider selected.');

  const updatedOrder = await prisma.$transaction(async (tx) => {
    await tx.riderProfile.update({
      where: { userId: riderId },
      data: { isAvailable: false, currentOrderId: orderId },
    });

    return tx.order.update({
      where: { id: orderId },
      data: {
        riderId,
        assignedRiderId: riderId,
        riderName: rider.name,
        status: 'RIDER_ASSIGNED',
        assignedAt: new Date(),
        acceptedAt: new Date(),
      },
      include: {
        customer: { select: { id: true, name: true } },
        rider:    { select: { name: true, phone: true } },
      },
    });
  });

  // Socket notifications
  emitToUser(riderId, 'RIDER_ORDER_ASSIGNED', { order: updatedOrder });
  emitToUser(riderId, 'NEW_ASSIGNMENT', { order: updatedOrder });
  if (order.customerId) {
    emitToUser(order.customerId, 'ORDER_STATUS_UPDATED', { orderId, status: 'RIDER_ASSIGNED', riderName: rider.name });
  }

  return updatedOrder;
};

export const unassignRider = async (orderId: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found.');

  if (order.riderId) {
    await prisma.riderProfile.update({
      where: { userId: order.riderId },
      data: { isAvailable: true, currentOrderId: null },
    });
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { riderId: null, assignedRiderId: null, riderName: null, status: 'READY_FOR_RIDER' },
  });

  if (order.customerId) {
    emitToUser(order.customerId, 'ORDER_STATUS_UPDATED', { orderId, status: 'READY_FOR_RIDER' });
  }
  return updated;
};

// ─── Fleet Dashboard & Live Tracking ──────────────────────────────────────────

export const getFleetDashboardData = async () => {
  const riders = await prisma.user.findMany({
    where: { role: 'RIDER' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      riderProfile: true,
    },
  });

  const activeOrders = await prisma.order.findMany({
    where: {
      status: {
        in: ['READY_FOR_RIDER', 'RIDER_ASSIGNED', 'ARRIVED_AT_STORE', 'PICKUP_STARTED', 'PICKED_UP', 'ON_THE_WAY', 'ARRIVED'],
      },
    },
    include: {
      customer: { select: { name: true, phone: true } },
      address: true,
      rider: { select: { id: true, name: true, phone: true } },
    },
  });

  const totalRiders = riders.length;
  const onlineRiders = riders.filter((r) => r.riderProfile?.isOnline).length;
  const busyRiders = riders.filter((r) => r.riderProfile?.isOnline && !r.riderProfile?.isAvailable).length;
  const availableRiders = riders.filter((r) => r.riderProfile?.isOnline && r.riderProfile?.isAvailable).length;
  const offlineRiders = totalRiders - onlineRiders;

  return {
    riders,
    activeOrders,
    stats: {
      totalRiders,
      onlineRiders,
      busyRiders,
      availableRiders,
      offlineRiders,
      activeDeliveries: activeOrders.length,
    },
  };
};

// ─── Email & Chat Service ─────────────────────────────────────────────────────

export const getChatConversations = async () => {
  const users = await prisma.user.findMany({
    take: 15,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      isActive: true,
    },
  });

  return users.map((u) => ({
    id: `conv_${u.id}`,
    user: u,
    lastMessage: `Hello Admin, I have an inquiry regarding my ${u.role.toLowerCase()} account.`,
    updatedAt: new Date().toISOString(),
    unreadCount: Math.floor(Math.random() * 3),
  }));
};

export const sendChatMessage = async (conversationId: string, recipientId: string, message: string) => {
  if (recipientId) {
    emitToUser(recipientId, 'NEW_CHAT_MESSAGE', {
      conversationId,
      sender: 'DOHS Sheba Admin Support',
      message,
      createdAt: new Date(),
    });
  }
  return { conversationId, message, sentAt: new Date() };
};

export const sendEmailBroadcast = async (targetRole: string, subject: string, message: string) => {
  const where: any = {};
  if (targetRole && targetRole !== 'ALL') {
    where.role = targetRole;
  }

  const recipientCount = await prisma.user.count({ where });

  const targetUsers = await prisma.user.findMany({ where, select: { id: true } });
  if (targetUsers.length > 0) {
    await prisma.notification.createMany({
      data: targetUsers.map((u) => ({
        userId: u.id,
        title: subject,
        message: message.replace(/<[^>]*>?/gm, ''),
        type: 'BROADCAST',
      })),
    });
  }

  return {
    targetRole,
    subject,
    recipientCount,
    sentAt: new Date(),
  };
};



// ─── Site Settings Service ───────────────────────────────────────────────────

export const getSiteSettings = async () => {
  try {
    let settings = await (prisma as any).siteSetting?.findUnique({ where: { id: 'default' } }).catch(() => null);
    if (!settings && (prisma as any).siteSetting) {
      settings = await (prisma as any).siteSetting?.create({
        data: {
          id: 'default',
          siteName: 'DOHS Sheba',
          tagline: 'Home Services & Express Grocery Marketplace for Savar DOHS',
          supportPhone: '01306031982',
          supportEmail: 'support@dohssheba.com',
        },
      }).catch(() => null);
    }
    return settings || {
      id: 'default',
      siteName: 'DOHS Sheba',
      tagline: 'Home Services & Express Grocery Marketplace for Savar DOHS',
      supportPhone: '01306031982',
      supportEmail: 'support@dohssheba.com',
    };
  } catch {
    return {
      id: 'default',
      siteName: 'DOHS Sheba',
      tagline: 'Home Services & Express Grocery Marketplace for Savar DOHS',
      supportPhone: '01306031982',
      supportEmail: 'support@dohssheba.com',
    };
  }
};

export const updateSiteSettings = async (data: any) => {
  if (!(prisma as any).siteSetting) return { id: 'default', ...data };
  return (prisma as any).siteSetting.upsert({
    where: { id: 'default' },
    create: { id: 'default', ...data },
    update: data,
  });
};

// ─── Withdrawal Requests Management ──────────────────────────────────────────

export const getAllWithdrawalRequests = async (status?: string, role?: string) => {
  const where: any = {};
  if (status && status !== 'ALL') where.status = status as any;
  if (role && role !== 'ALL')     where.userRole = role as any;

  const [requests, stats] = await Promise.all([
    prisma.withdrawalRequest.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            riderProfile: { select: { vehicleType: true, rating: true, totalEarnings: true } },
          },
        },
      },
    }),
    Promise.all([
      prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
      prisma.withdrawalRequest.aggregate({ where: { status: 'PENDING' }, _sum: { amount: true } }),
      prisma.withdrawalRequest.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
    ]),
  ]);

  return {
    requests,
    summary: {
      pendingCount: stats[0],
      pendingAmount: stats[1]._sum.amount ?? 0,
      totalPaidAmount: stats[2]._sum.amount ?? 0,
    },
  };
};

export const updateWithdrawalStatus = async (id: string, payload: {
  status: 'APPROVED' | 'REJECTED' | 'PAID';
  adminNote?: string;
  transactionId?: string;
}) => {
  const request = await prisma.withdrawalRequest.findUnique({ where: { id } });
  if (!request) throw new Error('Withdrawal request not found');

  const oldStatus = request.status;
  const newStatus = payload.status;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedReq = await tx.withdrawalRequest.update({
      where: { id },
      data: {
        status: newStatus,
        adminNote: payload.adminNote,
        transactionId: payload.transactionId,
        processedAt: new Date(),
      },
    });

    // ── 1. If transition is to PAID (and was not previously PAID): Deduct from balance & log DEBIT transaction
    if (newStatus === 'PAID' && oldStatus !== 'PAID') {
      // Deduct from Rider Profile total earnings if rider
      await tx.riderProfile.updateMany({
        where: { userId: request.userId },
        data: { totalEarnings: { decrement: request.amount } },
      });

      // Get or create user wallet and deduct balance
      let wallet = await tx.wallet.findUnique({ where: { userId: request.userId } });
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId: request.userId, balance: 0 },
        });
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: request.amount } },
      });

      // Log DEBIT Transaction
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEBIT',
          amount: request.amount,
          description: `Withdrawal payout via ${request.paymentMethod} (${request.accountNumber})${payload.transactionId ? ` - Trx: ${payload.transactionId}` : ''}`,
        },
      });

      // Send Rider In-App Notification
      await tx.notification.create({
        data: {
          userId: request.userId,
          title: 'Withdrawal Payout Processed',
          message: `Your withdrawal of ৳${request.amount} via ${request.paymentMethod} (${request.accountNumber}) has been approved and paid out. ৳${request.amount} has been deducted from your wallet balance.`,
          type: 'TRANSACTION',
        },
      });
    }

    // ── 2. If transition was PAID and is now REJECTED: Refund amount back
    if (oldStatus === 'PAID' && newStatus === 'REJECTED') {
      await tx.riderProfile.updateMany({
        where: { userId: request.userId },
        data: { totalEarnings: { increment: request.amount } },
      });

      const wallet = await tx.wallet.findUnique({ where: { userId: request.userId } });
      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: request.amount } },
        });

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'CREDIT',
            amount: request.amount,
            description: `Withdrawal request #${request.id.slice(-6)} rejected and refunded`,
          },
        });
      }
    }

    return updatedReq;
  });

  emitToUser(request.userId, 'WITHDRAWAL_STATUS_UPDATED', {
    id: request.id,
    status: newStatus,
    amount: request.amount,
    adminNote: payload.adminNote,
    transactionId: payload.transactionId,
  });

  emitToUser(request.userId, 'WALLET_UPDATED', {
    userId: request.userId,
    amount: request.amount,
    type: newStatus === 'PAID' ? 'DEBIT' : 'REFUND',
  });

  return updated;
};

export const deleteWithdrawalRequest = async (id: string) => {
  const reqItem = await prisma.withdrawalRequest.findUnique({ where: { id } });
  if (!reqItem) throw new Error('Withdrawal request not found');
  return prisma.withdrawalRequest.delete({ where: { id } });
};
