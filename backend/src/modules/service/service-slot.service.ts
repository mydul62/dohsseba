import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { SlotStatus } from '@prisma/client';
import { emitToRole, emitToUser, emitToAdminRoom } from '../../lib/socket';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Day boundaries (UTC) for a given date string or Date */
function dayBounds(dateInput: string | Date) {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput);
  const start = new Date(d);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

/** Count active bookings for a given slotId on a given date */
async function countBookingsForSlotOnDate(slotId: string, date: string | Date, tx?: any): Promise<number> {
  const db = tx ?? prisma;
  const { start, end } = dayBounds(date);
  return db.booking.count({
    where: {
      slotId,
      scheduledAt: { gte: start, lte: end },
      status: { notIn: ['CANCELLED', 'REJECTED'] as any },
    },
  });
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Get available slots for customer booking on a specific date.
 * Recurring slots (no date stored). Availability calculated per Provider+Date+Slot.
 * Full slots are returned but marked as FULL (not hidden).
 */
export const getAvailableSlots = async (params: { serviceId?: string; providerId?: string; date?: string }) => {
  const { serviceId, providerId, date } = params;
  const queryDate = date || new Date().toISOString().split('T')[0];

  // Build where clause — find the recurring slot templates
  let whereClause: any = {
    status: { notIn: ['BLOCKED', 'CANCELLED'] },
  };

  if (serviceId) {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (service) {
      // Show all slots belonging to this provider:
      // - slots for this specific service
      // - provider-wide slots (serviceId = null)
      // - slots created for any other service of this provider (backward compat)
      whereClause.providerId = service.providerId;
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

  // For each slot, compute how many bookings exist on this specific date
  const results = await Promise.all(
    slots.map(async (slot) => {
      const bookedForDate = await countBookingsForSlotOnDate(slot.id, queryDate);
      const remainingForDate = Math.max(0, slot.maxCapacity - bookedForDate);
      const isFull = remainingForDate <= 0;
      return {
        ...slot,
        bookedCapacity: bookedForDate,        // override with per-date count
        remainingCapacity: remainingForDate,
        status: isFull ? 'FULL' : (bookedForDate > 0 ? 'PARTIALLY_BOOKED' : 'AVAILABLE') as SlotStatus,
      };
    })
  );

  return results;
};

/**
 * Get all recurring slots for provider dashboard.
 * Optionally also returns per-date availability if a date is passed.
 */
export const getProviderSlots = async (providerId: string, date?: string) => {
  const slots = await prisma.serviceSlot.findMany({
    where: { providerId },
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
        // If a date is passed, filter bookings to that date for display
        ...(date ? {
          where: {
            scheduledAt: (() => {
              const { start, end } = dayBounds(date);
              return { gte: start, lte: end };
            })(),
          },
        } : {}),
      },
    },
    orderBy: { startTime: 'asc' },
  });

  // Compute per-date capacity if date is given, else show overall status
  return Promise.all(slots.map(async (slot) => {
    const bookedForDate = date ? await countBookingsForSlotOnDate(slot.id, date) : 0;
    const remainingForDate = date ? Math.max(0, slot.maxCapacity - bookedForDate) : slot.maxCapacity;
    let displayStatus: SlotStatus = slot.status;
    if (slot.status !== 'BLOCKED' && slot.status !== 'CANCELLED') {
      if (date) {
        displayStatus = remainingForDate <= 0 ? 'FULL' : bookedForDate > 0 ? 'PARTIALLY_BOOKED' : 'AVAILABLE';
      } else {
        displayStatus = 'AVAILABLE';
      }
    }
    return {
      ...slot,
      bookedCapacity: bookedForDate,
      remainingCapacity: remainingForDate,
      status: displayStatus,
    };
  }));
};

/**
 * Create a new recurring Service Slot (no date required).
 */
export const createSlot = async (
  providerId: string,
  data: {
    serviceId?: string;
    startTime: string;
    endTime: string;
    maxCapacity?: number;
    // date is ignored — slots are date-independent (recurring)
    date?: string;
  }
) => {
  if (!data.startTime || !data.endTime) {
    throw new AppError('Start Time and End Time are required.', 400);
  }

  const maxCap = Number(data.maxCapacity) > 0 ? Number(data.maxCapacity) : 1;

  // Prevent duplicate recurring slot for same provider + startTime
  const existing = await prisma.serviceSlot.findFirst({
    where: {
      providerId,
      startTime: data.startTime.trim(),
      endTime: data.endTime.trim(),
      date: null,                 // only check among recurring slots
      ...(data.serviceId ? { serviceId: data.serviceId } : { serviceId: null }),
    },
  });

  if (existing) {
    throw new AppError('A recurring slot for this time already exists.', 400);
  }

  const slot = await prisma.serviceSlot.create({
    data: {
      providerId,
      serviceId: data.serviceId || null,
      date: null,                 // recurring — no date
      startTime: data.startTime.trim(),
      endTime: data.endTime.trim(),
      maxCapacity: maxCap,
      bookedCapacity: 0,          // always 0; availability is computed dynamically
      status: 'AVAILABLE',
    },
    include: {
      service: { select: { id: true, title: true } },
    },
  });

  emitToUser(providerId, 'service:slot:created', slot);
  emitToRole('PROVIDER', 'service:slot:created', slot);
  emitToAdminRoom('service:slot:created', slot);

  return slot;
};

/**
 * Update a Service Slot.
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

  const updated = await prisma.serviceSlot.update({
    where: { id: slotId },
    data: {
      startTime: data.startTime !== undefined ? data.startTime.trim() : existing.startTime,
      endTime: data.endTime !== undefined ? data.endTime.trim() : existing.endTime,
      maxCapacity: newMaxCap,
      serviceId: data.serviceId !== undefined ? (data.serviceId || null) : existing.serviceId,
    },
    include: {
      service: { select: { id: true, title: true } },
    },
  });

  emitToUser(providerId, 'service:slot:updated', updated);
  emitToRole('PROVIDER', 'service:slot:updated', updated);
  emitToAdminRoom('service:slot:updated', updated);
  emitToRole('CUSTOMER', 'service:slot:availability_updated', {
    slotId: updated.id,
    remainingCapacity: updated.maxCapacity,
  });

  return updated;
};

/**
 * Toggle Block/Unblock a Service Slot.
 */
export const toggleBlockSlot = async (slotId: string, providerId: string) => {
  const existing = await prisma.serviceSlot.findFirst({
    where: { id: slotId, providerId },
  });

  if (!existing) {
    throw new AppError('Service slot not found.', 404);
  }

  const nextStatus: SlotStatus = existing.status === 'BLOCKED' ? 'AVAILABLE' : 'BLOCKED';

  const updated = await prisma.serviceSlot.update({
    where: { id: slotId },
    data: { status: nextStatus },
    include: {
      service: { select: { id: true, title: true } },
    },
  });

  emitToUser(providerId, 'service:slot:availability_updated', updated);
  emitToRole('PROVIDER', 'service:slot:availability_updated', updated);
  emitToAdminRoom('service:slot:availability_updated', updated);
  emitToRole('CUSTOMER', 'service:slot:availability_updated', {
    slotId: updated.id,
    status: updated.status,
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

  emitToUser(providerId, 'service:slot:deleted', { slotId });
  emitToRole('PROVIDER', 'service:slot:deleted', { slotId });
  emitToAdminRoom('service:slot:deleted', { slotId });

  return { message: 'Slot deleted successfully.' };
};

// Re-export for backward compat (booking.service.ts imports this)
export const recalculateSlotStatus = (_max: number, _booked: number, current?: SlotStatus): SlotStatus => {
  if (current === 'BLOCKED' || current === 'CANCELLED') return current;
  return 'AVAILABLE'; // No longer used for permanent status — computed dynamically
};

// Export the per-date count helper for use in booking service
export { countBookingsForSlotOnDate };
