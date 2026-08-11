import { fetchApi } from '@/lib/api-client';

export type SlotStatus = 'AVAILABLE' | 'PARTIALLY_BOOKED' | 'FULL' | 'BLOCKED' | 'CANCELLED';

export interface ServiceSlotItem {
  id: string;
  providerId: string;
  serviceId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  bookedCapacity: number;
  remainingCapacity?: number;
  status: SlotStatus;
  createdAt?: string;
  updatedAt?: string;
  service?: { id: string; title: string } | null;
  provider?: { id: string; name: string; phone?: string | null } | null;
  bookings?: any[];
}

export const fetchAvailableSlots = async (params?: { serviceId?: string; providerId?: string; date?: string }) => {
  const query = new URLSearchParams();
  if (params?.serviceId) query.set('serviceId', params.serviceId);
  if (params?.providerId) query.set('providerId', params.providerId);
  if (params?.date) query.set('date', params.date);

  const res = await fetchApi<ServiceSlotItem[]>(`/service-slots/available?${query.toString()}`);
  return res;
};

export const fetchProviderSlots = async (date?: string) => {
  const query = new URLSearchParams();
  if (date) query.set('date', date);

  const res = await fetchApi<ServiceSlotItem[]>(`/service-slots/provider?${query.toString()}`);
  return res;
};

export const createServiceSlot = async (data: {
  serviceId?: string;
  startTime: string;
  endTime: string;
  maxCapacity?: number;
  // date is intentionally omitted — slots are recurring (no fixed date)
}) => {
  const res = await fetchApi<ServiceSlotItem>('/service-slots', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res;
};

export const updateServiceSlot = async (
  slotId: string,
  data: {
    startTime?: string;
    endTime?: string;
    maxCapacity?: number;
    serviceId?: string;
  }
) => {
  const res = await fetchApi<ServiceSlotItem>(`/service-slots/${slotId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res;
};

export const toggleBlockServiceSlot = async (slotId: string) => {
  const res = await fetchApi<ServiceSlotItem>(`/service-slots/${slotId}/block`, {
    method: 'PATCH',
  });
  return res;
};

export const deleteServiceSlot = async (slotId: string) => {
  const res = await fetchApi<{ message: string }>(`/service-slots/${slotId}`, {
    method: 'DELETE',
  });
  return res;
};
