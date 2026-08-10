import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { emitToOrderRoom, emitToUser, emitToRole, emitToAdminRoom } from '../../lib/socket';

// ─── Profile ──────────────────────────────────────────────────────────────────

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, phone: true, bio: true,
      role: true, avatar: true, emailVerified: true,
      isActive: true, createdAt: true, updatedAt: true,
      providerProfile: true,
      sellerProfile: true,
      riderProfile: true,
      wallet: { select: { id: true, balance: true } },
      _count: {
        select: { orders: true, bookings: true, reviews: true },
      },
    },
  });
  if (!user) throw new AppError('User profile not found.', 404);
  return user;
};

export const updateUserProfile = async (
  userId: string,
  data: { name?: string; phone?: string; avatar?: string; bio?: string }
) => {
  // Whitelist only editable profile fields to prevent unauthorized mutations
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.avatar !== undefined) updateData.avatar = data.avatar;
  if (data.bio !== undefined) updateData.bio = data.bio;

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true, name: true, email: true, phone: true, bio: true,
      role: true, avatar: true, emailVerified: true,
      isActive: true, createdAt: true, updatedAt: true,
      sellerProfile: true,
      riderProfile: true,
      providerProfile: true,
    },
  });
};

// ─── Addresses ────────────────────────────────────────────────────────────────

export const getUserAddresses = async (userId: string) => {
  try {
    let addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });

    if (!addresses || addresses.length === 0) {
      try {
        await prisma.address.createMany({
          data: [
            {
              userId,
              label: 'Home',
              line1: 'House 42, Road 7, DOHS Mohakhali',
              area: 'DOHS Mohakhali',
              city: 'Dhaka',
              isDefault: true,
              latitude: 23.879,
              longitude: 90.278,
            },
            {
              userId,
              label: 'Office',
              line1: 'Tower B, Level 4, DOHS Commercial Zone',
              area: 'DOHS Mohakhali',
              city: 'Dhaka',
              isDefault: false,
              latitude: 23.876,
              longitude: 90.274,
            },
          ],
        });
        addresses = await prisma.address.findMany({
          where: { userId },
          orderBy: { isDefault: 'desc' },
        });
      } catch (seedErr) {
        console.warn('Address seed warning:', seedErr);
      }
    }
    return addresses || [];
  } catch (err) {
    console.error('Error fetching addresses:', err);
    return [];
  }
};

export const addUserAddress = async (
  userId: string,
  data: any
) => {
  const { label, line1, line2, area, city, postCode, latitude, longitude, isDefault } = data;
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }
  return prisma.address.create({
    data: {
      userId,
      label: label || 'Delivery Address',
      line1: line1 || 'DOHS Mohakhali',
      line2: line2 || null,
      area: area || 'DOHS Mohakhali',
      city: city || 'Dhaka',
      postCode: postCode || null,
      latitude: latitude ? Number(latitude) : 23.879,
      longitude: longitude ? Number(longitude) : 90.278,
      isDefault: Boolean(isDefault),
    },
  });
};

export const updateUserAddress = async (
  userId: string,
  addressId: string,
  data: Partial<{
    label: string;
    line1: string;
    line2: string;
    area: string;
    city: string;
    postCode: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
  }>
) => {
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) throw new AppError('Address not found.', 404);

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }
  const updatedAddress = await prisma.address.update({ where: { id: addressId }, data });

  // Sync active orders using this addressId
  const activeOrders = await prisma.order.findMany({
    where: {
      addressId,
      status: { notIn: ['DELIVERED', 'CANCELLED', 'REJECTED', 'REFUNDED'] },
    },
  });

  const fullAddrText = [updatedAddress.line1, updatedAddress.line2, updatedAddress.area, updatedAddress.city].filter(Boolean).join(', ');
  const lat = updatedAddress.latitude || 23.879;
  const lng = updatedAddress.longitude || 90.278;

  for (const o of activeOrders) {
    const updatedOrder = await prisma.order.update({
      where: { id: o.id },
      data: {
        deliveryAddress: fullAddrText,
        latitude: lat,
        longitude: lng,
        updatedAt: new Date(),
      },
      include: {
        address: true,
        items: { include: { product: { select: { name: true, images: true } } } },
        rider: { select: { id: true, name: true, phone: true } },
      },
    });

    const payload = {
      orderId: updatedOrder.id,
      deliveryAddress: fullAddrText,
      line1: updatedAddress.line1,
      line2: updatedAddress.line2,
      area: updatedAddress.area,
      city: updatedAddress.city,
      latitude: lat,
      longitude: lng,
      updatedAt: updatedOrder.updatedAt,
      order: updatedOrder,
    };

    emitToOrderRoom(o.id, 'ORDER_LOCATION_UPDATED', payload);
    if (updatedOrder.assignedRiderId) {
      emitToUser(updatedOrder.assignedRiderId, 'ORDER_LOCATION_UPDATED', payload);
    }
    if (updatedOrder.riderId) {
      emitToUser(updatedOrder.riderId, 'ORDER_LOCATION_UPDATED', payload);
    }
    if (updatedOrder.customerId) {
      emitToUser(updatedOrder.customerId, 'ORDER_LOCATION_UPDATED', payload);
    }
    emitToRole('RIDER', 'ORDER_LOCATION_UPDATED', payload);
    emitToAdminRoom('ORDER_LOCATION_UPDATED', payload);
  }

  return updatedAddress;
};

export const deleteUserAddress = async (userId: string, addressId: string) => {
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) throw new AppError('Address not found.', 404);
  await prisma.address.delete({ where: { id: addressId } });
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const getUserNotifications = async (
  userId: string,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { notifications, total, unreadCount };
};

export const markAllNotificationsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

export const markNotificationRead = async (userId: string, notificationId: string) => {
  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!existing) throw new AppError('Notification not found.', 404);
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};
