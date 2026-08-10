import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { generateSlug } from '../../utils/auth.util';
import { expandSearchTerms } from '../../utils/searchHelper';

// ─── Auto-ensure Default Company Services & Categories ─────────────────────
const ensureCompanyServices = async () => {
  try {
    const categoryCount = await prisma.serviceCategory.count();
    if (categoryCount === 0) {
      await prisma.serviceCategory.createMany({
        data: [
          { name: 'AC Service & Repair', slug: 'ac-service', icon: 'Wind', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80', isActive: true },
          { name: 'Electrician', slug: 'electrician', icon: 'Zap', image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500&q=80', isActive: true },
          { name: 'Plumbing Service', slug: 'plumber', icon: 'Droplet', image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500&q=80', isActive: true },
          { name: 'House & Deep Cleaning', slug: 'cleaner', icon: 'Sparkles', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80', isActive: true },
          { name: 'Pest Control', slug: 'pest-control', icon: 'ShieldAlert', image: 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=500&q=80', isActive: true },
          { name: 'Appliance Repair', slug: 'appliance-repair', icon: 'Wrench', image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=500&q=80', isActive: true },
        ],
        skipDuplicates: true,
      });

      // Update existing categories if images are missing
      const catImages: Record<string, string> = {
        'ac-service': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80',
        'electrician': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500&q=80',
        'plumber': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500&q=80',
        'cleaner': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80',
        'pest-control': 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=500&q=80',
        'appliance-repair': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=500&q=80',
      };
      for (const [slug, imgUrl] of Object.entries(catImages)) {
        await prisma.serviceCategory.updateMany({
          where: { slug, image: null },
          data: { image: imgUrl },
        }).catch(() => null);
      }
    }

    const serviceCount = await prisma.service.count();
    if (serviceCount === 0) {
      let provider = await prisma.user.findFirst({ where: { role: 'PROVIDER' } });
      if (!provider) provider = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (!provider) provider = await prisma.user.findFirst();

      if (provider) {
        const catAC = await prisma.serviceCategory.findFirst({ where: { slug: 'ac-service' } });
        const catElec = await prisma.serviceCategory.findFirst({ where: { slug: 'electrician' } });
        const catPlumb = await prisma.serviceCategory.findFirst({ where: { slug: 'plumber' } });
        const catClean = await prisma.serviceCategory.findFirst({ where: { slug: 'cleaner' } });

        if (catAC && catElec && catPlumb && catClean) {
          await prisma.service.createMany({
            data: [
              {
                title: 'AC Jet Cleaning & Master Servicing',
                description: 'Complete jet wash indoor & outdoor unit cleaning with anti-bacterial foam treatment.',
                price: 1200,
                startingPrice: 1200,
                priceUnit: 'job',
                estimatedDuration: '1-2 Hours',
                features: ['High-pressure jet wash', 'Gas leakage check', '90-day warranty'],
                addons: [
                  { id: 'add_gas', title: 'R22/R410 Refrigerant Gas Top-Up', price: 800, description: 'Up to 50% gas pressure refill' },
                  { id: 'add_filter', title: 'Antibacterial Anti-Allergen Filter Replacement', price: 450, description: 'Medical grade air filter' },
                  { id: 'add_out', title: 'Outdoor Bracket Safety Reinforcement', price: 300, description: 'Anti-rust steel bracket fitting' },
                ],
                categoryId: catAC.id,
                providerId: provider.id,
                isActive: true,
                rating: 4.9,
                images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80'],
              },
              {
                title: 'Gas Refilling & Leakage Repair',
                description: 'R22 / R410 / R32 refrigerant gas refill with pressure testing and leak fix.',
                price: 2500,
                startingPrice: 2500,
                priceUnit: 'job',
                estimatedDuration: '1-2 Hours',
                features: ['Refrigerant pressure check', 'Leakage detection', '100% cooling test'],
                addons: [
                  { id: 'add_leak', title: 'Copper Pipe Flare Nut Repair', price: 400, description: 'Leakproof brass flare nut replacement' },
                  { id: 'add_cap', title: 'AC Compressor Capacitor Replacement', price: 650, description: 'Heavy duty Japanese capacitor' },
                ],
                categoryId: catAC.id,
                providerId: provider.id,
                isActive: true,
                rating: 4.8,
                images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80'],
              },
              {
                title: 'Full House Deep Cleaning Package',
                description: 'Whole house vacuuming, floor scrubbing, window cleaning & bathroom disinfection.',
                price: 4500,
                startingPrice: 4500,
                priceUnit: 'job',
                estimatedDuration: '3-4 Hours',
                features: ['Deep floor scrubbing', 'Bathroom disinfection', 'Kitchen grease wash'],
                addons: [
                  { id: 'add_sofa', title: '5-Seater Sofa Shampoo Wash', price: 1200, description: 'Deep foam shampooing & stain removal' },
                  { id: 'add_fridge', title: 'Refrigerator Interior Disinfection', price: 500, description: 'Odour removal & sanitization' },
                ],
                categoryId: catClean.id,
                providerId: provider.id,
                isActive: true,
                rating: 5.0,
                images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80'],
              },
              {
                title: 'Plumbing Leakage & Pipe Repair',
                description: 'Expert plumber visit for pipe leak detection, basin connection & tap replacement.',
                price: 850,
                startingPrice: 850,
                priceUnit: 'job',
                estimatedDuration: '1 Hour',
                features: ['Concealed leak fix', 'Sanitary fitting', 'Tap replacement'],
                addons: [
                  { id: 'add_tap', title: 'High Pressure Brass Tap Fitting', price: 350, description: 'Heavy duty chrome brass tap' },
                  { id: 'add_filter', title: 'Water Line Filter Connection', price: 600, description: 'Dual stage sediment filter' },
                ],
                categoryId: catPlumb.id,
                providerId: provider.id,
                isActive: true,
                rating: 4.8,
                images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80'],
              },
              {
                title: 'Electrical Short-Circuit Inspection',
                description: 'Diagnostic inspection for tripped breakers, burnt switches, and wire short-circuits.',
                price: 500,
                startingPrice: 500,
                priceUnit: 'job',
                estimatedDuration: '1 Hour',
                features: ['Breaker diagnostic', 'Burnt wire replace', 'Safety check'],
                addons: [
                  { id: 'add_mcb', title: 'Schneider 32A Circuit Breaker', price: 450, description: 'Original Schneider Electric MCB' },
                  { id: 'add_switch', title: 'Modular Touch Switch Socket Box', price: 300, description: 'Fireproof polycarbonate gang switch' },
                ],
                categoryId: catElec.id,
                providerId: provider.id,
                isActive: true,
                rating: 4.9,
                images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80'],
              },
            ],
          });
        }
      }
    }

    if ((prisma as any).technician) {
      const techCount = await (prisma as any).technician.count();
      if (techCount === 0) {
        await (prisma as any).technician.createMany({
          data: [
            { name: 'Rakib Ahmed', phone: '+8801711223344', specialty: 'Electrical & AC', isActive: true },
            { name: 'Hasan Mahmud', phone: '+8801722556677', specialty: 'Plumbing & Sanitary', isActive: true },
            { name: 'Mahmudul Islam', phone: '+8801733889900', specialty: 'Appliance Repair', isActive: true },
            { name: 'Sabbir Hossain', phone: '+8801744112233', specialty: 'General Handyman', isActive: true },
          ],
        });
      }
    }

    const bookingCount = await prisma.booking.count();
    if (bookingCount === 0) {
      let sampleCustomer = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
      if (!sampleCustomer) sampleCustomer = await prisma.user.findFirst();

      if (sampleCustomer) {
        let sampleAddress = await prisma.address.findFirst({ where: { userId: sampleCustomer.id } }).catch(() => null);
        if (!sampleAddress) {
          sampleAddress = await prisma.address.create({
            data: {
              userId: sampleCustomer.id,
              label: 'Resident DOHS Address',
              line1: 'House 14, Road 5, Mohakhali DOHS',
              area: 'Mohakhali DOHS',
              city: 'Dhaka',
              isDefault: true,
            },
          }).catch(() => null);
        }

        const firstService = await prisma.service.findFirst({ where: { title: { contains: 'AC Jet Cleaning' } } });
        const secondService = await prisma.service.findFirst({ where: { title: { contains: 'Plumbing' } } });

        if (firstService && sampleAddress) {
          await prisma.booking.createMany({
            data: [
              {
                id: 'BK-1001',
                customerId: sampleCustomer.id,
                serviceId: firstService.id,
                addressId: sampleAddress.id,
                scheduledAt: new Date(Date.now() + 86400000),
                totalAmount: 1200,
                notes: 'Master AC Jet cleaning requested for Mohakhali DOHS House #14. Phone: +880 1800-000005',
                status: 'PENDING',
              },
              {
                id: 'BK-1002',
                customerId: sampleCustomer.id,
                serviceId: secondService ? secondService.id : firstService.id,
                addressId: sampleAddress.id,
                scheduledAt: new Date(Date.now() + 172800000),
                totalAmount: 850,
                technicianName: 'Rakib Ahmed',
                technicianPhone: '+880 1711-223344',
                notes: 'Bathroom pipe leakage repair',
                status: 'TECHNICIAN_ASSIGNED',
              },
            ],
            skipDuplicates: true,
          }).catch(() => null);
        }
      }
    }
  } catch (err) {
    console.warn('ensureCompanyServices notice:', err);
  }
};

// ─── Service Categories ───────────────────────────────────────────────────────

export const getAllServiceCategories = async () => {
  await ensureCompanyServices();
  return prisma.serviceCategory.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
};

export const createServiceCategory = async (data: {
  name: string;
  description?: string;
  icon?: string;
  image?: string;
}) => {
  const slug = generateSlug(data.name);
  return prisma.serviceCategory.create({ data: { ...data, slug } });
};

export const updateServiceCategory = async (id: string, data: object) => {
  const existing = await prisma.serviceCategory.findUnique({ where: { id } });
  if (!existing) throw new AppError('Category not found.', 404);
  return prisma.serviceCategory.update({ where: { id }, data });
};

export const deleteServiceCategory = async (id: string) => {
  const existing = await prisma.serviceCategory.findUnique({ where: { id } });
  if (!existing) throw new AppError('Category not found.', 404);
  return prisma.serviceCategory.update({ where: { id }, data: { isActive: false } });
};

// ─── Services ─────────────────────────────────────────────────────────────────

interface ServiceFilter {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}

export const getServices = async (filters: ServiceFilter) => {
  await ensureCompanyServices();
  const { page = 1, limit = 100, category, search, minPrice, maxPrice, sort } = filters;
  const skip = (page - 1) * limit;

  const where: any = { isActive: true };

  if (category && category !== 'all') {
    const slugClean = category.toLowerCase().trim();
    const keyword = slugClean
      .replace(/-(service|repair|cleaner|plumber|services)$/i, '')
      .toLowerCase();

    where.OR = [
      { categoryId: category },
      { category: { id: category } },
      { category: { slug: { equals: slugClean, mode: 'insensitive' } } },
      { category: { slug: { contains: keyword, mode: 'insensitive' } } },
      { category: { name: { equals: category, mode: 'insensitive' } } },
    ];
  }

  if (search) {
    const terms = expandSearchTerms(search);
    const searchCondition = terms.flatMap((term) => [
      { title:       { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { category: { name: { contains: term, mode: 'insensitive' } } },
      { category: { slug: { contains: term, mode: 'insensitive' } } },
    ]);
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchCondition }];
      delete where.OR;
    } else {
      where.OR = searchCondition;
    }
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  const orderBy: any =
    sort === 'price_asc'  ? { price: 'asc' }     :
    sort === 'price_desc' ? { price: 'desc' }    :
    sort === 'rating'     ? { rating: 'desc' }   :
    { createdAt: 'desc' };

  const [rawServices, total] = await Promise.all([
    prisma.service.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true, icon: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.service.count({ where }),
  ]);

  // Format services to represent DOHS Sheba Service Team
  const services = rawServices.map((s) => ({
    ...s,
    provider: {
      id: 'dohsheba-service-team',
      name: 'DOHS Sheba Service Team',
      avatar: '🛡️',
      isVerified: true,
    },
  }));

  return { services, total };
};

export const getServiceById = async (id: string) => {
  const rawService = await prisma.service.findFirst({
    where: { id, isActive: true },
    include: {
      category: true,
      reviews: {
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: { select: { bookings: true } },
    },
  });
  if (!rawService) throw new AppError('Service not found.', 404);

  return {
    ...rawService,
    provider: {
      id: 'dohsheba-service-team',
      name: 'DOHS Sheba Service Team',
      title: 'Professional Verified Team',
      avatar: '🛡️',
      isVerified: true,
      bio: 'Managed directly by DOHS Sheba operations. Certified background-checked technicians.',
    },
  };
};

export const createService = async (
  providerId: string,
  data: {
    title: string;
    description: string;
    price: number;
    priceUnit?: string;
    categoryId: string;
    images?: string[];
    addons?: any[];
  }
) => {
  return prisma.service.create({
    data: {
      title: data.title,
      description: data.description,
      price: Number(data.price),
      priceUnit: data.priceUnit || 'hour',
      categoryId: data.categoryId,
      images: data.images ?? [],
      addons: data.addons ?? [],
      providerId,
    },
  });
};

export const updateService = async (
  providerId: string,
  serviceId: string,
  role: string,
  data: object
) => {
  const existing = await prisma.service.findFirst({ where: { id: serviceId } });
  if (!existing) throw new AppError('Service not found.', 404);

  return prisma.service.update({ where: { id: serviceId }, data });
};

export const deleteService = async (providerId: string, serviceId: string, role: string) => {
  const existing = await prisma.service.findFirst({ where: { id: serviceId } });
  if (!existing) throw new AppError('Service not found.', 404);

  return prisma.service.update({ where: { id: serviceId }, data: { isActive: false } });
};

export const getProviderServices = async (providerId: string) => {
  return prisma.service.findMany({
    where: { isActive: true },
    include: {
      category: { select: { name: true, slug: true } },
      _count: { select: { bookings: true, reviews: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};
