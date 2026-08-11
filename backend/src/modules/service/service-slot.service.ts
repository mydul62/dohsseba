import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { SlotStatus } from '@prisma/client';
import { emitToRole, emitToUser, emitToAdminRoom } from '../../lib/socket';

export const recalculateSlotStatus = (maxCapacity: number, bookedCapacity: number, currentStatus?: SlotStatus): SlotStatus => {
  if (currentStatus === 'BLOCKED' || currentStatus === 'CANCELLED') {
    return currentStatus;
  }
  if (bookedCapacity >= maxCapacity) {
    return 'FULL';
  }
  if (bookedCapacity > 0) {
    return 'PARTIALLY_BOOKED';
  }
  return 'AVAILABLE';
};

/**
 * Get available time slots for customer booking.
 * Returns only slots that have remaining technician capacity (not FULL, BLOCKED, or CANCELLED).
 */
export const getAvailableSlots = async (params: { serviceId?: string; providerId?: string; date?: string }) => {
  const { serviceId, providerId, date } = params;

  let targetDate = date ? new Date(date) : new Date();
  if (isNaN(targetDate.getTime())) {
    targetDate = new Date();
  }

  // Calculate date boundaries (start of day to end of day in UTC/local)
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  let whereClause: any = {
    date: {
      gte: startOfDay,
      lte: endOfDay,
    },
    status: { in: ['AVAILABLE', 'PARTIALLY_BOOKED'] },
  };

  if (serviceId) {
    // Service specific OR provider-wide slots
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (service) {
      whereClause.OR = [
        { serviceId: service.id },
        { providerId: service.providerId, serviceId: null },
      ];
    } else {
      whereClause.serviceId = serviceId;
    }
  } else if (providerId) {
    whereClause.providerId = providerId;
  }

  const slots = await prisma.serviceSlot.findMany({
    where: whereClause,
    include: {
      provider: { select: { id: true, name: true, phone: true } },
      service: { select: { id: true, title: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  // Filter out any slot where bookedCapacity >= maxCapacity and compute metrics
  return slots
    .filter((slot) => slot.bookedCapacity < slot.maxCapacity)
    .map((slot) => {
      const remainingCapacity = Math.max(0, slot.maxCapacity - slot.bookedCapacity);
      return {
        ...slot,
        remainingCapacity,
      };
    });
};

/**
 * Get all slots created by a Provider (for Provider Dashboard).
 */
export const getProviderSlots = async (providerId: string, date?: string) => {
  let whereClause: any = { providerId };

  if (date) {
    const targetDate = new Date(date);
    if (!isNaN(targetDate.getTime())) {
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }
  }

  const slots = await prisma.serviceSlot.findMany({
    where: whereClause,
    include: {
      service: { select: { id: true, title: true } },
      bookings: {
        select: {
          id: true,
          status: true,
          scheduledAt: true,
          customer: { select: { id: true, name: true, phone: true } },
          technician: { select: { id: true, name: true, phone: true } },
        },
      },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  return slots.map((slot) => {
    const remainingCapacity = Math.max(0, slot.maxCapacity - slot.bookedCapacity);
    const calculatedStatus = recalculateSlotStatus(slot.maxCapacity, slot.bookedCapacity, slot.status);
    return {
      ...slot,
      status: calculatedStatus,
      remainingCapacity,
    };
  });
};

/**
 * Create a new Service Slot (Provider Dashboard).
 */
export const createSlot = async (
  providerId: string,
  data: {
    serviceId?: string;
    date: string;
    startTime: string;
    endTime: string;
    maxCapacity?: number;
  }
) => {
  if (!data.date || !data.startTime || !data.endTime) {
    throw new AppError('Date, Start Time, and End Time are required.', 400);
  }

  const maxCap = Number(data.maxCapacity) > 0 ? Number(data.maxCapacity) : 1;
  const slotDate = new Date(data.date);
  if (isNaN(slotDate.getTime())) {
    throw new AppError('Invalid date provided.', 400);
  }

  // Prevent duplicate slot for exact same provider, date & startTime
  const existing = await prisma.serviceSlot.findFirst({
    where: {
      providerId,
      date: slotDate,
      startTime: data.startTime.trim(),
      ...(data.serviceId ? { serviceId: data.serviceId } : {}),
    },
  });

  if (existing) {
    throw new AppError('A time slot for this time already exists.', 400);
  }

  const slot = await prisma.serviceSlot.create({
    data: {
      providerId,
      serviceId: data.serviceId || null,
      date: slotDate,
      startTime: data.startTime.trim(),
      endTime: data.endTime.trim(),
      maxCapacity: maxCap,
      bookedCapacity: 0,
      status: 'AVAILABLE',
    },
    include: {
      service: { select: { id: true, title: true } },
    },
  });

  // Emit real-time Socket.IO event AFTER DB operation succeeds
  emitToUser(providerId, 'service:slot:created', slot);
  emitToRole('PROVIDER', 'service:slot:created', slot);
  emitToAdminRoom('service:slot:created', slot);

  return slot;
};

/**
 * Update a Service Slot (Provider Dashboard).
 */
export const updateSlot = async (
  slotId: string,
  providerId: string,
  data: {
    startTime?: string;
    endTime?: string;
    maxCapacity?: number;
    serviceId?: string;
  }
) => {
  const existing = await prisma.serviceSlot.findFirst({
    where: { id: slotId, providerId },
  });

  if (!existing) {
    throw new AppError('Service slot not found.', 404);
  }

  const newMaxCap = data.maxCapacity !== undefined ? Math.max(1, Number(data.maxCapacity)) : existing.maxCapacity;
  const newStatus = recalculateSlotStatus(newMaxCap, existing.bookedCapacity, existing.status);

  const updated = await prisma.serviceSlot.update({
    where: { id: slotId },
    data: {
      startTime: data.startTime !== undefined ? data.startTime.trim() : existing.startTime,
      endTime: data.endTime !== undefined ? data.endTime.trim() : existing.endTime,
      maxCapacity: newMaxCap,
      serviceId: data.serviceId !== undefined ? (data.serviceId || null) : existing.serviceId,
      status: newStatus,
    },
    include: {
      service: { select: { id: true, title: true } },
    },
  });

  // Emit real-time Socket.IO events AFTER DB operation succeeds
  emitToUser(providerId, 'service:slot:updated', updated);
  emitToRole('PROVIDER', 'service:slot:updated', updated);
  emitToAdminRoom('service:slot:updated', updated);
  emitToRole('CUSTOMER', 'service:slot:availability_updated', {
    slotId: updated.id,
    status: updated.status,
    remainingCapacity: Math.max(0, updated.maxCapacity - updated.bookedCapacity),
  });

  return updated;
};

/**
 * Toggle Block/Unblock status of a Service Slot.
 */
export const toggleBlockSlot = async (slotId: string, providerId: string) => {
  const existing = await prisma.serviceSlot.findFirst({
    where: { id: slotId, providerId },
  });

  if (!existing) {
    throw new AppError('Service slot not found.', 404);
  }

  let nextStatus: SlotStatus;
  if (existing.status === 'BLOCKED') {
    nextStatus = recalculateSlotStatus(existing.maxCapacity, existing.bookedCapacity);
  } else {
    nextStatus = 'BLOCKED';
  }

  const updated = await prisma.serviceSlot.update({
    where: { id: slotId },
    data: { status: nextStatus },
    include: {
      service: { select: { id: true, title: true } },
    },
  });

  // Emit real-time Socket.IO events AFTER DB operation succeeds
  emitToUser(providerId, 'service:slot:availability_updated', updated);
  emitToRole('PROVIDER', 'service:slot:availability_updated', updated);
  emitToAdminRoom('service:slot:availability_updated', updated);
  emitToRole('CUSTOMER', 'service:slot:availability_updated', {
    slotId: updated.id,
    status: updated.status,
    remainingCapacity: nextStatus === 'BLOCKED' ? 0 : Math.max(0, updated.maxCapacity - updated.bookedCapacity),
  });

  return updated;
};

/**
 * Delete a Service Slot.
 */
export const deleteSlot = async (slotId: string, providerId: string) => {
  const existing = await prisma.serviceSlot.findFirst({
    where: { id: slotId, providerId },
    include: { bookings: { where: { status: { notIn: ['CANCELLED', 'REJECTED'] as any } } } },
  });

  if (!existing) {
    throw new AppError('Service slot not found.', 404);
  }

  if (existing.bookings.length > 0) {
    throw new AppError('Cannot delete slot with active customer bookings. Block the slot instead.', 400);
  }

  await prisma.serviceSlot.delete({ where: { id: slotId } });

  // Emit real-time Socket.IO event AFTER DB operation succeeds
  emitToUser(providerId, 'service:slot:deleted', { slotId });
  emitToRole('PROVIDER', 'service:slot:deleted', { slotId });
  emitToAdminRoom('service:slot:deleted', { slotId });

  return { message: 'Slot deleted successfully.' };
};
