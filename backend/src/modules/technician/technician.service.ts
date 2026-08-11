import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/error.middleware';

export const getTechnicians = async () => {
  if (!(prisma as any).technician) return [];
  return (prisma as any).technician.findMany({
    orderBy: { createdAt: 'desc' },
  });
};

export const getActiveTechnicians = async () => {
  if (!(prisma as any).technician) return [];
  const all: any[] = await (prisma as any).technician.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  // Deduplicate by id (guard against duplicate rows from DB joins)
  const seen = new Set<string>();
  return all.filter((t: any) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
};

export const createTechnician = async (data: {
  name: string;
  phone: string;
  specialty?: string;
  avatar?: string;
}) => {
  if (!data.name || !data.phone) {
    throw new AppError('Name and phone number are required.', 400);
  }
  if (!(prisma as any).technician) {
    return { id: Date.now().toString(), ...data, isActive: true };
  }
  return (prisma as any).technician.create({ data });
};

export const updateTechnician = async (
  id: string,
  data: { name?: string; phone?: string; specialty?: string; avatar?: string; isActive?: boolean }
) => {
  if (!(prisma as any).technician) return { id, ...data };
  const existing = await (prisma as any).technician.findUnique({ where: { id } });
  if (!existing) throw new AppError('Technician not found.', 404);
  return (prisma as any).technician.update({ where: { id }, data });
};

export const deleteTechnician = async (id: string) => {
  if (!(prisma as any).technician) return true;
  const existing = await (prisma as any).technician.findUnique({ where: { id } });
  if (!existing) throw new AppError('Technician not found.', 404);
  return (prisma as any).technician.update({ where: { id }, data: { isActive: false } });
};
