import { prisma } from '../../lib/prisma';

// ─── Seller Dashboard Stats ───────────────────────────────────────────────────

export const getSellerDashboardStats = async (sellerId: string) => {
  const now    = new Date();
  const today  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo  = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);
  const yearAgo  = new Date(today); yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const sellerItemFilter = { items: { some: { product: { sellerId } } } };

  const [
    totalOrders, pendingOrders, processingOrders,
    deliveredOrders, cancelledOrders,
    activeProducts, outOfStockProducts, lowStockProducts,
  ] = await Promise.all([
    prisma.order.count({ where: sellerItemFilter }),
    prisma.order.count({ where: { status: 'PENDING',     ...sellerItemFilter } }),
    prisma.order.count({ where: { status: { in: ['SELLER_ACCEPTED', 'READY_FOR_RIDER', 'RIDER_ASSIGNED', 'PICKUP_STARTED', 'PICKED_UP', 'ON_THE_WAY', 'ARRIVED'] }, ...sellerItemFilter } }),
    prisma.order.count({ where: { status: 'DELIVERED',   ...sellerItemFilter } }),
    prisma.order.count({ where: { status: 'CANCELLED',   ...sellerItemFilter } }),
    prisma.product.count({ where: { sellerId, isActive: true, stock: { gt: 10 } } }),
    prisma.product.count({ where: { sellerId, isActive: true, stock: 0 } }),
    prisma.product.count({ where: { sellerId, isActive: true, stock: { gt: 0, lte: 10 } } }),
  ]);

  // Revenue aggregations via order items
  const allItems = await prisma.orderItem.findMany({
    where: { product: { sellerId } },
    include: { order: { select: { status: true, createdAt: true } } },
  });

  const calcRev = (items: typeof allItems, from?: Date, to?: Date) =>
    items
      .filter((i) => {
        if (i.order.status !== 'DELIVERED') return false;
        if (from && i.order.createdAt < from)  return false;
        if (to   && i.order.createdAt >= to)   return false;
        return true;
      })
      .reduce((s, i) => s + i.price * i.quantity, 0);

  const totalRevenue   = calcRev(allItems);
  const todaySales     = calcRev(allItems, today);
  const weeklySales    = calcRev(allItems, weekAgo);
  const monthlySales   = calcRev(allItems, monthAgo);
  const yearlySales    = calcRev(allItems, yearAgo);

  // Unique customer count
  const uniqueCustomers = await prisma.order.findMany({
    where: sellerItemFilter,
    select: { customerId: true },
    distinct: ['customerId'],
  });
  const totalCustomers = uniqueCustomers.length;

  // Wallet balance (mock: real integration would use wallet module)
  let walletBalance = 0;
  let withdrawableBalance = 0;
  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId: sellerId } });
    walletBalance         = wallet?.balance ?? 0;
    withdrawableBalance   = Math.floor((wallet?.balance ?? 0) * 0.9); // 90% of balance is withdrawable
  } catch (_) {}

  // Recent orders
  const recentOrders = await prisma.order.findMany({
    where: sellerItemFilter,
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      items: {
        where: { product: { sellerId } },
        include: { product: { select: { name: true, images: true, price: true } } },
      },
    },
  });

  // Low stock alerts
  const lowStockAlerts = await prisma.product.findMany({
    where: { sellerId, isActive: true, stock: { gt: 0, lte: 10 } },
    orderBy: { stock: 'asc' },
    take: 6,
    include: { category: { select: { name: true } } },
  });

  // Top products by order count
  const topProducts = await prisma.product.findMany({
    where: { sellerId, isActive: true },
    include: {
      _count: { select: { orderItems: true, reviews: true } },
      category: { select: { name: true } },
    },
    orderBy: { orderItems: { _count: 'desc' } },
    take: 5,
  });

  // Recent reviews
  const recentReviews = await prisma.review.findMany({
    where: { product: { sellerId } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      user:    { select: { name: true, avatar: true } },
      product: { select: { name: true, images: true } },
    },
  });

  // Monthly bar chart data (last 12 months sold)
  const monthlySalesChart = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const label = d.toLocaleString('en', { month: 'short' });
    const rev = allItems
      .filter((item) => {
        if (item.order.status !== 'DELIVERED') return false;
        const m = item.order.createdAt.getMonth();
        const y = item.order.createdAt.getFullYear();
        return m === d.getMonth() && y === d.getFullYear();
      })
      .reduce((s, i) => s + i.price * i.quantity, 0);
    return { label, value: Math.round(rev) };
  });

  return {
    stats: {
      totalRevenue,
      todaySales,
      weeklySales,
      monthlySales,
      yearlySales,
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders,
      refundRequests: 0,
      walletBalance,
      withdrawableBalance,
      activeProducts,
      outOfStockProducts,
      lowStockProducts,
      totalCustomers,
    },
    recentOrders,
    lowStockAlerts,
    topProducts,
    recentReviews,
    monthlySalesChart,
  };
};

// ─── Seller Reviews ───────────────────────────────────────────────────────────

export const getSellerReviews = async (sellerId: string) => {
  const reviews = await prisma.review.findMany({
    where:   { product: { sellerId } },
    orderBy: { createdAt: 'desc' },
    include: {
      user:    { select: { name: true, avatar: true } },
      product: { select: { id: true, name: true, images: true } },
    },
  });
  return reviews;
};

// ─── Store Profile ────────────────────────────────────────────────────────────

export const getStoreProfile = async (userId: string) => {
  let profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: { user: { select: { email: true, phone: true } } },
  });
  if (!profile) {
    profile = await prisma.sellerProfile.create({
      data: {
        userId,
        shopName: 'Fresh Bazaar',
        description: 'DOHS premier grocery marketplace seller supplying fresh organic milk, seasonal fruits, fish, meat and pantry staples.',
      },
      include: { user: { select: { email: true, phone: true } } },
    });
  }
  return profile;
};

export const updateStoreProfile = async (
  userId: string,
  data: {
    shopName?: string;
    description?: string;
    logo?: string;
    banner?: string;
    address?: string;
    openingHours?: string;
    phone?: string;
    email?: string;
  }
) => {
  const { phone, email, ...profileData } = data;

  if (phone || email) {
    const userUpdate: any = {};
    if (phone) userUpdate.phone = phone;
    if (email) userUpdate.email = email;
    await prisma.user.update({
      where: { id: userId },
      data: userUpdate,
    }).catch(() => {});
  }

  return (prisma.sellerProfile as any).upsert({
    where: { userId },
    create: { userId, shopName: profileData.shopName || 'Fresh Bazaar', ...profileData },
    update: profileData,
  });
};

export const toggleAutoAccept = async (userId: string, autoAcceptOrders: boolean) => {
  return prisma.sellerProfile.upsert({
    where: { userId },
    create: {
      userId,
      shopName: 'Fresh Bazaar',
      autoAcceptOrders,
    },
    update: {
      autoAcceptOrders,
    },
  });
};

