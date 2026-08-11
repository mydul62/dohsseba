import 'dotenv/config';
import { PrismaClient, Role, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── 1. CLEAR ALL EXISTING DATA ───────────────────────────────────────────────
async function clearAll() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DB_RESET !== 'true') {
    console.warn('🛡️ [SAFETY GUARD] Database reset is BLOCKED in production mode to protect real user data.');
    return;
  }

  console.log('🧹 Resetting database & clearing all existing data...');
  await prisma.orderItem.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.deliveryRule.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.wallet.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.sellerProfile.deleteMany({});
  await prisma.riderProfile.deleteMany({});
  await prisma.providerProfile.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.serviceCategory.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.productCategory.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('   ✓ Database reset complete.');
}

// ─── 2. USERS ─────────────────────────────────────────────────────────────────
async function seedUsers() {
  console.log('👤 Seeding core system users...');
  const pass = await bcrypt.hash('password123', 10);

  const superAdmin = await prisma.user.create({
    data: { name: 'Super Admin', email: 'superadmin@dohssheba.com', password: pass, role: Role.SUPER_ADMIN, phone: '+8801700000001', emailVerified: true, isActive: true }
  });
  const admin = await prisma.user.create({
    data: { name: 'DOHS Admin', email: 'admin@dohssheba.com', password: pass, role: Role.ADMIN, phone: '+8801700000002', emailVerified: true, isActive: true }
  });
  const seller = await prisma.user.create({
    data: { name: 'Green Market DOHS', email: 'seller@dohssheba.com', password: pass, role: Role.SELLER, phone: '+8801700000003', emailVerified: true, isActive: true }
  });
  const rider = await prisma.user.create({
    data: { name: 'Rider Akash', email: 'rider@dohssheba.com', password: pass, role: Role.RIDER, phone: '+8801700000004', emailVerified: true, isActive: true }
  });
  const customer = await prisma.user.create({
    data: { name: 'Sharmin Sultana', email: 'customer@dohssheba.com', password: pass, role: Role.CUSTOMER, phone: '+8801800000005', emailVerified: true, isActive: true }
  });
  const provider = await prisma.user.create({
    data: { name: 'DOHS Home Services', email: 'provider@dohssheba.com', password: pass, role: Role.PROVIDER, phone: '+8801900000006', emailVerified: true, isActive: true }
  });

  console.log('   ✓ 6 core users created with password: password123');
  return { superAdmin, admin, seller, rider, customer, provider };
}

// ─── 3. PROFILES & SITE SETTINGS ───────────────────────────────────────────────
async function seedProfiles(seller: any, rider: any, provider: any) {
  console.log('📋 Seeding seller, rider, provider profiles, and site settings...');
  await prisma.sellerProfile.create({
    data: {
      userId: seller.id,
      shopName: 'Green Market DOHS',
      description: 'Premium Fresh Groceries & Daily Supplies in DOHS Area',
      isVerified: true,
      rating: 4.9,
    }
  });

  await prisma.riderProfile.create({
    data: {
      userId: rider.id,
      vehicleType: 'Motorbike',
      vehicleNo: 'DHAKA-METRO-HA-1234',
      isOnline: true,
      isOnDuty: true,
      isAvailable: true,
      totalTrips: 24,
      totalEarnings: 3200,
      rating: 4.95,
    }
  });

  await prisma.providerProfile.create({
    data: {
      userId: provider.id,
      bio: 'Expert DOHS Maintenance Technician & AC Specialist',
      experience: 6,
      nid: '19922691234500',
      isVerified: true,
      rating: 4.9,
      totalJobs: 18,
    }
  });

  try {
    await (prisma as any).siteSetting.upsert({
      where: { id: 'default' },
      update: {
        siteName: 'DOHS Sheba',
        freeDeliveryThreshold: 500,
        defaultDeliveryFee: 50,
      },
      create: {
        id: 'default',
        siteName: 'DOHS Sheba',
        freeDeliveryThreshold: 500,
        defaultDeliveryFee: 50,
      },
    });

    const defaultRules = [
      { minAmount: 0, maxAmount: 499, charge: 50, isFree: false, isActive: true },
      { minAmount: 500, maxAmount: 999, charge: 80, isFree: false, isActive: true },
      { minAmount: 1000, maxAmount: null, charge: 0, isFree: true, isActive: true },
    ];

    for (const rule of defaultRules) {
      await prisma.deliveryRule.create({ data: rule });
    }
  } catch (err) {
    console.warn('SiteSetting & DeliveryRules notice:', err);
  }

  console.log('   ✓ Profiles, Site Settings & Delivery Rules created.');
}

// ─── 4. BRANDS ────────────────────────────────────────────────────────────────
async function seedBrands() {
  console.log('🏷️ Seeding brands...');
  const brandData = [
    { name: 'Pran', logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80', description: 'Leading Agro & Food Brand' },
    { name: 'Radhuni', logo: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&q=80', description: 'Pure Spices & Cooking Ingredients' },
    { name: 'Nestle', logo: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80', description: 'Global Nutrition & Dairy Products' },
    { name: 'Aarong Dairy', logo: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&q=80', description: 'Farm Fresh Dairy & Dairy Items' },
    { name: 'Teer', logo: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&q=80', description: 'Refined Oil & Essential Grains' },
    { name: 'Fresh', logo: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80', description: 'Meghna Group Fresh Products' },
    { name: 'Unilever', logo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&q=80', description: 'Personal Hygiene & Home Care' },
    { name: 'Kazi Farms', logo: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=200&q=80', description: 'Organic Eggs & Frozen Poultry' },
    { name: 'Dano', logo: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80', description: 'Full Cream Milk Powder' },
    { name: 'Square', logo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&q=80', description: 'Consumer Goods & Hygiene Products' },
    { name: 'Ispahani', logo: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&q=80', description: 'Premium Mirzapore Tea' },
    { name: 'Cocola', logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=80', description: 'Snacks & Biscuit Products' },
  ];

  const createdBrands: any[] = [];
  for (const b of brandData) {
    const slug = b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const brand = await prisma.brand.create({
      data: {
        name: b.name,
        slug,
        logo: b.logo,
        description: b.description,
        isActive: true,
      }
    });
    createdBrands.push(brand);
  }

  console.log(`   ✓ ${createdBrands.length} brands created.`);
  return createdBrands;
}

// ─── 5. CATEGORIES & SUBCATEGORIES (Min 4 Subcategories per Category) ──────
async function seedCategories() {
  console.log('📁 Seeding main categories and subcategories (min 4 subcategories per main category)...');

  const mainCategoriesData = [
    {
      name: 'Fresh Fruits & Vegetables',
      slug: 'fresh-fruits-vegetables',
      icon: '🥗',
      subcategories: [
        { name: 'Fresh Vegetables', slug: 'fresh-vegetables', icon: '🥦' },
        { name: 'Organic Fruits', slug: 'organic-fruits', icon: '🍎' },
        { name: 'Leafy Greens & Herbs', slug: 'leafy-greens-herbs', icon: '🥬' },
        { name: 'Exotic Imports', slug: 'exotic-imports', icon: '🥑' },
      ],
    },
    {
      name: 'Dairy, Eggs & Bakery',
      slug: 'dairy-eggs-bakery',
      icon: '🥛',
      subcategories: [
        { name: 'Fresh Milk & Cream', slug: 'fresh-milk-cream', icon: '🥛' },
        { name: 'Butter & Cheese', slug: 'butter-cheese', icon: '🧀' },
        { name: 'Farm Eggs', slug: 'farm-eggs', icon: '🥚' },
        { name: 'Fresh Bread & Bakery', slug: 'fresh-bread-bakery', icon: '🍞' },
      ],
    },
    {
      name: 'Meat, Fish & Seafood',
      slug: 'meat-fish-seafood',
      icon: '🥩',
      subcategories: [
        { name: 'Fresh Chicken & Poultry', slug: 'fresh-chicken-poultry', icon: '🍗' },
        { name: 'Beef & Mutton', slug: 'beef-mutton', icon: '🥩' },
        { name: 'River & Sea Fish', slug: 'river-sea-fish', icon: '🐟' },
        { name: 'Frozen Seafood', slug: 'frozen-seafood', icon: '🦐' },
      ],
    },
    {
      name: 'Snacks, Beverages & Drinks',
      slug: 'snacks-beverages-drinks',
      icon: '🥤',
      subcategories: [
        { name: 'Chips & Crisps', slug: 'chips-crisps', icon: '🍟' },
        { name: 'Tea & Coffee', slug: 'tea-coffee', icon: '☕' },
        { name: 'Soft Drinks & Juices', slug: 'soft-drinks-juices', icon: '🥤' },
        { name: 'Chocolates & Sweets', slug: 'chocolates-sweets', icon: '🍫' },
      ],
    },
    {
      name: 'Household & Daily Cleaning',
      slug: 'household-daily-cleaning',
      icon: '🧹',
      subcategories: [
        { name: 'Detergents & Cleaners', slug: 'detergents-cleaners', icon: '🧼' },
        { name: 'Dishwashing Supplies', slug: 'dishwashing-supplies', icon: '🧽' },
        { name: 'Paper & Tissues', slug: 'paper-tissues', icon: '🧻' },
        { name: 'Air Fresheners', slug: 'air-fresheners', icon: '🌸' },
      ],
    },
    {
      name: 'Personal Care & Beauty',
      slug: 'personal-care-beauty',
      icon: '🧴',
      subcategories: [
        { name: 'Soap & Body Wash', slug: 'soap-body-wash', icon: '🧼' },
        { name: 'Hair Care & Shampoo', slug: 'hair-care-shampoo', icon: '🧴' },
        { name: 'Oral Care & Hygiene', slug: 'oral-care-hygiene', icon: '🪥' },
        { name: 'Skincare & Lotions', slug: 'skincare-lotions', icon: '✨' },
      ],
    },
  ];

  const categoryMap: Record<string, { main: any; subs: any[] }> = {};

  for (const catData of mainCategoriesData) {
    const mainCat = await prisma.productCategory.create({
      data: {
        name: catData.name,
        slug: catData.slug,
        icon: catData.icon,
      },
    });

    const subs: any[] = [];
    for (const subData of catData.subcategories) {
      const subCat = await prisma.productCategory.create({
        data: {
          name: subData.name,
          slug: subData.slug,
          icon: subData.icon,
          parentId: mainCat.id,
        },
      });
      subs.push(subCat);
    }

    categoryMap[mainCat.slug] = { main: mainCat, subs };
  }

  console.log(`   ✓ 6 main categories and 24 subcategories seeded.`);
  return categoryMap;
}

// ─── 6. PRODUCTS (Min 8 Products per Subcategory = 192+ Products) ──────────
async function seedProducts(seller: any, categoryMap: any, brands: any[]) {
  console.log('🛒 Seeding products (min 8 products per subcategory)...');

  const brandPran = brands.find((b) => b.name === 'Pran') || brands[0];
  const brandNestle = brands.find((b) => b.name === 'Nestle') || brands[2];
  const brandAarong = brands.find((b) => b.name === 'Aarong Dairy') || brands[3];
  const brandFresh = brands.find((b) => b.name === 'Fresh') || brands[5];
  const brandUnilever = brands.find((b) => b.name === 'Unilever') || brands[6];
  const brandIspahani = brands.find((b) => b.name === 'Ispahani') || brands[7] || brands[0];

  const productTemplates: Record<string, { title: string; price: number; salePrice?: number; unit: string; image: string; brand: any }[]> = {
    // ── Fresh Vegetables ──
    'fresh-vegetables': [
      { title: 'Fresh Green Potato (Deshi)', price: 45, unit: '1 kg', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=80', brand: brandFresh },
      { title: 'Red Fresh Tomato', price: 65, salePrice: 55, unit: '1 kg', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80', brand: brandFresh },
      { title: 'Organic Cucumber (Kira)', price: 50, unit: '1 kg', image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=500&q=80', brand: brandFresh },
      { title: 'Fresh Onion (Deshi Red)', price: 85, salePrice: 78, unit: '1 kg', image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&q=80', brand: brandFresh },
      { title: 'Green Chilli (Kacha Morich)', price: 120, unit: '250 g', image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=500&q=80', brand: brandFresh },
      { title: 'Fresh Brinjal (Begun)', price: 60, unit: '1 kg', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&q=80', brand: brandFresh },
      { title: 'Garlic (Deshi Rosun)', price: 180, unit: '1 kg', image: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=500&q=80', brand: brandFresh },
      { title: 'Fresh Ginger (Ada)', price: 210, unit: '500 g', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&q=80', brand: brandFresh },
    ],

    // ── Organic Fruits ──
    'organic-fruits': [
      { title: 'Sweet Honey Mango (Rajshahi)', price: 130, salePrice: 115, unit: '1 kg', image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&q=80', brand: brandFresh },
      { title: 'Fresh Green Apple (Gala)', price: 260, unit: '1 kg', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&q=80', brand: brandFresh },
      { title: 'Organic Banana (Sagor)', price: 90, unit: 'Dozen (12 pcs)', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&q=80', brand: brandFresh },
      { title: 'Juicy Orange (Imported Malta)', price: 240, unit: '1 kg', image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=500&q=80', brand: brandFresh },
      { title: 'Fresh Guava (Peyara)', price: 80, unit: '1 kg', image: 'https://images.unsplash.com/photo-1536511135760-5847e7040d87?w=500&q=80', brand: brandFresh },
      { title: 'Sweet Papaya (Ata)', price: 95, unit: '1 kg', image: 'https://images.unsplash.com/photo-1517260739337-6799d239ce83?w=500&q=80', brand: brandFresh },
      { title: 'Red Dragon Fruit', price: 320, unit: '1 kg', image: 'https://images.unsplash.com/photo-1527325678964-54921646f988?w=500&q=80', brand: brandFresh },
      { title: 'Seedless Red Grapes', price: 420, unit: '500 g', image: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&q=80', brand: brandFresh },
    ],

    // ── Leafy Greens ──
    'leafy-greens-herbs': [
      { title: 'Fresh Spinach (Palong Shak)', price: 30, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80', brand: brandFresh },
      { title: 'Red Amaranth (Lal Shak)', price: 25, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=80', brand: brandFresh },
      { title: 'Fresh Coriander Leaves (Dhone Pata)', price: 20, unit: '100 g', image: 'https://images.unsplash.com/photo-1588879460418-874b12e3e5c9?w=500&q=80', brand: brandFresh },
      { title: 'Mint Leaves (Pudina Pata)', price: 25, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1608683134044-a0684f885e3c?w=500&q=80', brand: brandFresh },
      { title: 'Bottle Gourd Greens (Lau Shak)', price: 35, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80', brand: brandFresh },
      { title: 'Mustard Greens (Shorishe Shak)', price: 30, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=80', brand: brandFresh },
      { title: 'Spring Onion (Piaj Pata)', price: 40, unit: '250 g', image: 'https://images.unsplash.com/photo-1588879460418-874b12e3e5c9?w=500&q=80', brand: brandFresh },
      { title: 'Curry Leaves (Kari Pata)', price: 30, unit: '1 Pack', image: 'https://images.unsplash.com/photo-1608683134044-a0684f885e3c?w=500&q=80', brand: brandFresh },
    ],

    // ── Exotic Imports ──
    'exotic-imports': [
      { title: 'Fresh Avocado (Hass)', price: 380, unit: '2 pcs', image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&q=80', brand: brandFresh },
      { title: 'Imported Broccoli', price: 160, unit: '1 pc (500g)', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500&q=80', brand: brandFresh },
      { title: 'Zucchini Green', price: 210, unit: '500 g', image: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=500&q=80', brand: brandFresh },
      { title: 'Red Capsicum (Bell Pepper)', price: 280, unit: '500 g', image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500&q=80', brand: brandFresh },
      { title: 'Yellow Capsicum', price: 290, unit: '500 g', image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500&q=80', brand: brandFresh },
      { title: 'Button Mushroom', price: 180, unit: '200 g Pack', image: 'https://images.unsplash.com/photo-1504470695779-75300268aa0e?w=500&q=80', brand: brandFresh },
      { title: 'Fresh Baby Corn', price: 150, unit: '250 g Pack', image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&q=80', brand: brandFresh },
      { title: 'Lettuce Iceberg', price: 140, unit: '1 Head', image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=500&q=80', brand: brandFresh },
    ],

    // ── Fresh Milk & Cream ──
    'fresh-milk-cream': [
      { title: 'Aarong Pasteurized Liquid Milk', price: 90, unit: '1 Liter', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&q=80', brand: brandAarong },
      { title: 'Pran Pasteurised Milk Box', price: 85, unit: '1 Liter', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80', brand: brandPran },
      { title: 'Dano Full Cream Milk Powder', price: 890, salePrice: 840, unit: '1 kg Foil Pack', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80', brand: brandNestle },
      { title: 'Aarong Fresh Heavy Cream', price: 210, unit: '250 ml', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&q=80', brand: brandAarong },
      { title: 'Pran Chocolate Flavored Milk', price: 35, unit: '200 ml', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80', brand: brandPran },
      { title: 'Aarong Sweetened Condensed Milk', price: 95, unit: '397 g Can', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&q=80', brand: brandAarong },
      { title: 'Nestle Everyday Dairy Whitener', price: 460, unit: '500 g Pack', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80', brand: brandNestle },
      { title: 'Farm Fresh UHT Milk', price: 95, unit: '1 Liter Box', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&q=80', brand: brandFresh },
    ],

    // ── Butter & Cheese ──
    'butter-cheese': [
      { title: 'Aarong Premium Salted Butter', price: 240, unit: '200 g', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&q=80', brand: brandAarong },
      { title: 'Aarong Fresh Paneer (Cottage Cheese)', price: 310, unit: '250 g', image: 'https://images.unsplash.com/photo-1634487359989-3e90c735339c?w=500&q=80', brand: brandAarong },
      { title: 'Pran Unsalted Cooking Butter', price: 220, unit: '200 g Pack', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&q=80', brand: brandPran },
      { title: 'Amul Processed Cheese Slices', price: 340, unit: '200 g (10 Slices)', image: 'https://images.unsplash.com/photo-1634487359989-3e90c735339c?w=500&q=80', brand: brandAarong },
      { title: 'Shredded Mozzarella Cheese', price: 450, unit: '200 g Pack', image: 'https://images.unsplash.com/photo-1634487359989-3e90c735339c?w=500&q=80', brand: brandAarong },
      { title: 'Aarong Pure Cow Ghee', price: 780, salePrice: 720, unit: '400 g Jar', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&q=80', brand: brandAarong },
      { title: 'Cheddar Cheese Block', price: 520, unit: '250 g', image: 'https://images.unsplash.com/photo-1634487359989-3e90c735339c?w=500&q=80', brand: brandAarong },
      { title: 'Garlic Herb Butter Spread', price: 280, unit: '150 g Tub', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&q=80', brand: brandAarong },
    ],

    // ── Farm Eggs ──
    'farm-eggs': [
      { title: 'Kazi Farms Organic Brown Eggs', price: 165, salePrice: 150, unit: 'Dozen (12 pcs)', image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=500&q=80', brand: brandFresh },
      { title: 'White Layer Farm Eggs', price: 145, unit: 'Dozen (12 pcs)', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&q=80', brand: brandFresh },
      { title: 'Deshi Duck Eggs (Hanser Dim)', price: 230, unit: 'Dozen (12 pcs)', image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=500&q=80', brand: brandFresh },
      { title: 'Quail Eggs Pack', price: 120, unit: '20 pcs Pack', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&q=80', brand: brandFresh },
      { title: 'Omega 3 Enriched Eggs', price: 195, unit: 'Dozen (12 pcs)', image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=500&q=80', brand: brandFresh },
      { title: 'Organic Free Range Eggs', price: 220, unit: 'Dozen (12 pcs)', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&q=80', brand: brandFresh },
      { title: 'Small Egg Tray', price: 75, unit: '6 pcs Pack', image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=500&q=80', brand: brandFresh },
      { title: 'Bulk Egg Crate', price: 390, unit: '30 pcs Crate', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&q=80', brand: brandFresh },
    ],

    // ── Fresh Bread & Bakery ──
    'fresh-bread-bakery': [
      { title: 'White Sandwich Family Bread', price: 70, unit: '400 g Pack', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80', brand: brandPran },
      { title: 'Whole Wheat Brown Bread', price: 95, unit: '400 g Pack', image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500&q=80', brand: brandPran },
      { title: 'Fresh Butter Buns', price: 50, unit: '4 pcs Pack', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80', brand: brandPran },
      { title: 'Garlic Cheese Rusk', price: 80, unit: '250 g Pack', image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500&q=80', brand: brandPran },
      { title: 'Croissant French Bakery', price: 120, unit: '2 pcs Pack', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&q=80', brand: brandPran },
      { title: 'Multigrain Fitness Toast', price: 110, unit: '350 g Pack', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80', brand: brandPran },
      { title: 'Sweet Milk Bread', price: 75, unit: '350 g Pack', image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500&q=80', brand: brandPran },
      { title: 'Fruit Cake Slices', price: 140, unit: '250 g Box', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&q=80', brand: brandPran },
    ],

    // ── Fresh Chicken & Poultry ──
    'fresh-chicken-poultry': [
      { title: 'Fresh Broiler Chicken (Skin Off Curry Cut)', price: 210, salePrice: 195, unit: '1 kg', image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&q=80', brand: brandFresh },
      { title: 'Boneless Chicken Breast Fillet', price: 390, unit: '1 kg', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&q=80', brand: brandFresh },
      { title: 'Deshi Farm Chicken (Sonali)', price: 340, unit: '1 Full Chicken (~1 kg)', image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&q=80', brand: brandFresh },
      { title: 'Chicken Drumsticks', price: 290, unit: '500 g Pack', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&q=80', brand: brandFresh },
      { title: 'Chicken Wings Pack', price: 220, unit: '500 g Pack', image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&q=80', brand: brandFresh },
      { title: 'Minced Chicken (Kima)', price: 360, unit: '500 g Pack', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&q=80', brand: brandFresh },
      { title: 'Kazi Farms Frozen Chicken Strips', price: 320, unit: '300 g Pack', image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&q=80', brand: brandFresh },
      { title: 'Full Whole Roasting Chicken', price: 380, unit: '1.2 kg Whole', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&q=80', brand: brandFresh },
    ],

    // ── Beef & Mutton ──
    'beef-mutton': [
      { title: 'Fresh Beef Bone-In (Deshi Curry Cut)', price: 780, salePrice: 750, unit: '1 kg', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80', brand: brandFresh },
      { title: 'Boneless Premium Beef Steak Cut', price: 950, unit: '1 kg', image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=500&q=80', brand: brandFresh },
      { title: 'Fresh Goat Mutton (Khashir Mangsho)', price: 1150, unit: '1 kg', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80', brand: brandFresh },
      { title: 'Minced Beef (Gorur Kima)', price: 820, unit: '1 kg', image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=500&q=80', brand: brandFresh },
      { title: 'Beef Liver (Gorur Kolija)', price: 680, unit: '500 g', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80', brand: brandFresh },
      { title: 'Mutton Ribs Chops', price: 1200, unit: '1 kg', image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=500&q=80', brand: brandFresh },
      { title: 'Beef Brain (Gorur Moghoj)', price: 420, unit: '1 pc', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80', brand: brandFresh },
      { title: 'Beef Nehari Bones (Noli)', price: 450, unit: '1 kg Pack', image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=500&q=80', brand: brandFresh },
    ],

    // ── River & Sea Fish ──
    'river-sea-fish': [
      { title: 'Fresh Padma Ilish (Hilsha Fish)', price: 1450, salePrice: 1350, unit: '1 pc (~1 kg)', image: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=500&q=80', brand: brandFresh },
      { title: 'Rui Fish (Cleaned Cut Blocks)', price: 420, unit: '1 kg', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80', brand: brandFresh },
      { title: 'Katla Fish Whole', price: 380, unit: '1.5 kg Whole', image: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=500&q=80', brand: brandFresh },
      { title: 'Boal Fish Slices', price: 850, unit: '1 kg', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80', brand: brandFresh },
      { title: 'Fresh Pabda Fish', price: 580, unit: '500 g Pack', image: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=500&q=80', brand: brandFresh },
      { title: 'Telapia Fish Cleaned', price: 240, unit: '1 kg', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80', brand: brandFresh },
      { title: 'Pangash Fish Fillet', price: 220, unit: '1 kg', image: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=500&q=80', brand: brandFresh },
      { title: 'Tengra Fish Small', price: 620, unit: '500 g Pack', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80', brand: brandFresh },
    ],

    // ── Frozen Seafood ──
    'frozen-seafood': [
      { title: 'Tiger Prawn (Golda Chingri)', price: 980, unit: '1 kg', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&q=80', brand: brandFresh },
      { title: 'Peeled & Deveined Small Shrimp', price: 650, unit: '500 g Pack', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&q=80', brand: brandFresh },
      { title: 'Frozen Calamari Squid Rings', price: 520, unit: '350 g Pack', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&q=80', brand: brandFresh },
      { title: 'Seafood Mix Medley', price: 740, unit: '500 g Pack', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&q=80', brand: brandFresh },
      { title: 'Crab Whole Frozen', price: 680, unit: '1 kg', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&q=80', brand: brandFresh },
      { title: 'Salmon Fish Fillet Steak', price: 1650, unit: '300 g Pack', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&q=80', brand: brandFresh },
      { title: 'Rupchanda Fish (Pomfret)', price: 1100, unit: '500 g Pack', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&q=80', brand: brandFresh },
      { title: 'Lobster Tail Frozen', price: 2100, unit: '2 pcs Pack', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&q=80', brand: brandFresh },
    ],

    // ── Chips & Crisps ──
    'chips-crisps': [
      { title: 'Pran Potato Crackers (Classic)', price: 20, unit: '45 g Pack', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80', brand: brandPran },
      { title: 'Lays Magic Masala Chips', price: 60, unit: '90 g Pack', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80', brand: brandPran },
      { title: 'Kurkure Masala Munch', price: 35, unit: '75 g Pack', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80', brand: brandPran },
      { title: 'Pringles Sour Cream & Onion', price: 240, unit: '158 g Can', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80', brand: brandPran },
      { title: 'Cocola Chanachur Spicy', price: 80, unit: '300 g Pack', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80', brand: brandPran },
      { title: 'Pran Mr. Mango Candy Pack', price: 90, unit: '200 g Pack', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80', brand: brandPran },
      { title: 'Tortilla Chips Salted', price: 140, unit: '150 g Pack', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80', brand: brandPran },
      { title: 'Popcorn Butter Salted', price: 65, unit: '100 g Tub', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80', brand: brandPran },
    ],

    // ── Tea & Coffee ──
    'tea-coffee': [
      { title: 'Ispahani Mirzapore Black Tea', price: 125, unit: '400 g Box', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80', brand: brandIspahani },
      { title: 'Nescafe Classic Instant Coffee Jar', price: 460, salePrice: 420, unit: '200 g Jar', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&q=80', brand: brandNestle },
      { title: 'Taaza Black Tea Leaf', price: 110, unit: '400 g Pack', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80', brand: brandUnilever },
      { title: 'Green Tea Organic Tea Bags', price: 210, unit: '50 Tea Bags', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80', brand: brandIspahani },
      { title: 'Nescafe Gold Premium Blend', price: 890, unit: '100 g Jar', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&q=80', brand: brandNestle },
      { title: 'Kazi & Kazi Organic Earl Grey', price: 280, unit: '25 Tea Bags', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80', brand: brandIspahani },
      { title: 'Coffee Mate Creamer Powder', price: 380, unit: '400 g Can', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&q=80', brand: brandNestle },
      { title: 'Finlay Loose Leaf Tea', price: 95, unit: '200 g Pack', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80', brand: brandIspahani },
    ],

    // ── Soft Drinks & Juices ──
    'soft-drinks-juices': [
      { title: 'Coca-Cola Original Taste', price: 80, unit: '1.25 Liter Bottle', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80', brand: brandPran },
      { title: 'Pran Frooto Mango Juice', price: 45, unit: '500 ml Bottle', image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&q=80', brand: brandPran },
      { title: 'Sprite Lemon Lime Drink', price: 80, unit: '1.25 Liter Bottle', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80', brand: brandPran },
      { title: '7UP Refreshing Soda', price: 75, unit: '1.25 Liter', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80', brand: brandPran },
      { title: 'Mojo Cola Beverage', price: 65, unit: '1 Liter', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80', brand: brandPran },
      { title: 'Real Orange Nectar Juice', price: 190, unit: '1 Liter Carton', image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&q=80', brand: brandPran },
      { title: 'Red Bull Energy Drink', price: 210, unit: '250 ml Can', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80', brand: brandPran },
      { title: 'Kinley Mineral Water 6-Pack', price: 120, unit: '6 x 500ml', image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&q=80', brand: brandFresh },
    ],

    // ── Chocolates & Sweets ──
    'chocolates-sweets': [
      { title: 'Dairy Milk Silk Chocolate', price: 220, unit: '150 g Bar', image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&q=80', brand: brandNestle },
      { title: 'KitKat 4 Finger Chocolate', price: 65, unit: '38 g Bar', image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&q=80', brand: brandNestle },
      { title: 'Ferrero Rocher Box', price: 780, unit: '16 pcs Box', image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&q=80', brand: brandNestle },
      { title: 'Snickers Peanut Bar', price: 75, unit: '50 g Bar', image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&q=80', brand: brandNestle },
      { title: 'Bournville Dark Chocolate', price: 180, unit: '80 g Bar', image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&q=80', brand: brandNestle },
      { title: 'Nutella Hazelnut Spread', price: 460, unit: '350 g Jar', image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&q=80', brand: brandNestle },
      { title: 'Toblerone Milk Chocolate', price: 240, unit: '100 g Bar', image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&q=80', brand: brandNestle },
      { title: 'Cadbury Celebrations Box', price: 550, unit: '250 g Box', image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&q=80', brand: brandNestle },
    ],

    // ── Detergents & Cleaners ──
    'detergents-cleaners': [
      { title: 'Rin Washing Powder', price: 180, unit: '1 kg Pack', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Wheel Wash Powder Lemon', price: 140, unit: '1 kg Pack', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Harpic Toilet Cleaner Liquid', price: 190, unit: '750 ml Bottle', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Lysol Surface Disinfectant Spray', price: 420, unit: '500 ml', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Comfort Fabric Conditioner', price: 260, unit: '800 ml Bottle', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Vim Liquid Dish Cleaner', price: 145, unit: '500 ml Bottle', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Bleach Liquid Sanitizer', price: 90, unit: '500 ml', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Glass Cleaner Spray (Collin)', price: 160, unit: '500 ml Spray', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
    ],

    // ── Dishwashing Supplies ──
    'dishwashing-supplies': [
      { title: 'Vim Dishwash Bar Soap', price: 35, unit: '300 g Bar', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Scotch-Brite Sponge Scrubber', price: 40, unit: '2 pcs Pack', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Steel Wool Wire Scrubber', price: 25, unit: '2 pcs Pack', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Vim Gel Refill Pouch', price: 95, unit: '250 ml Pouch', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Dishwasher Detergent Pods', price: 680, unit: '20 Pods Box', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Lemon Fresh Dishwash Tub', price: 60, unit: '500 g Tub', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Microfiber Kitchen Towel', price: 120, unit: '3 pcs Pack', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Sink Drain Strainer Mesh', price: 50, unit: '2 pcs Pack', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
    ],

    // ── Paper & Tissues ──
    'paper-tissues': [
      { title: 'Bashundhara Facial Tissue', price: 85, unit: '200 Sheets Box', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandFresh },
      { title: 'Fresh Toilet Paper Roll 4-Pack', price: 130, unit: '4 Rolls Pack', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandFresh },
      { title: 'Kitchen Towel Paper Rolls', price: 160, unit: '2 Rolls Pack', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandFresh },
      { title: 'Wet Wipes Antibacterial', price: 140, unit: '80 Wipes Pack', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandFresh },
      { title: 'Pocket Handkerchief Tissues', price: 45, unit: '10 Packets', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandFresh },
      { title: 'Napkin Table Paper Tissues', price: 65, unit: '100 Sheets', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandFresh },
      { title: 'Aluminum Foil Wrapping Roll', price: 210, unit: '10 Meters', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandFresh },
      { title: 'Cling Film Food Wrap', price: 180, unit: '30 Meters', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandFresh },
    ],

    // ── Air Fresheners ──
    'air-fresheners': [
      { title: 'Godrej Aer Pocket Bathroom Freshener', price: 65, unit: '10 g Pack', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Air Wick Automatic Spray Refill', price: 380, unit: '250 ml Spray', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Odonil Bathroom Air Freshener Blocks', price: 75, unit: '75 g Pack', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Rose Garden Room Spray', price: 240, unit: '300 ml Can', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Lavender Scented Gel Can', price: 190, unit: '150 g Can', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Car Air Freshener Clip', price: 180, unit: '1 pc', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Aromatherapy Essential Oil Fragrance', price: 320, unit: '15 ml Bottle', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
      { title: 'Camphor Moth Balls', price: 45, unit: '100 g Pack', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', brand: brandUnilever },
    ],

    // ── Soap & Body Wash ──
    'soap-body-wash': [
      { title: 'Lux Soft Rose Soap', price: 65, unit: '150 g Bar', image: 'https://images.unsplash.com/photo-1607006482602-76ca0fd2f47b?w=500&q=80', brand: brandUnilever },
      { title: 'Dettol Original Germ Protection Soap', price: 70, unit: '125 g Bar', image: 'https://images.unsplash.com/photo-1607006482602-76ca0fd2f47b?w=500&q=80', brand: brandUnilever },
      { title: 'Lifebuoy Total 10 Handwash', price: 140, unit: '200 ml Pump', image: 'https://images.unsplash.com/photo-1607006482602-76ca0fd2f47b?w=500&q=80', brand: brandUnilever },
      { title: 'Dove Cream Beauty Bath Bar', price: 110, unit: '100 g Bar', image: 'https://images.unsplash.com/photo-1607006482602-76ca0fd2f47b?w=500&q=80', brand: brandUnilever },
      { title: 'Nivea Refreshing Body Wash', price: 380, unit: '250 ml Bottle', image: 'https://images.unsplash.com/photo-1607006482602-76ca0fd2f47b?w=500&q=80', brand: brandUnilever },
      { title: 'Pears Pure Gentle Soap', price: 85, unit: '125 g Bar', image: 'https://images.unsplash.com/photo-1607006482602-76ca0fd2f47b?w=500&q=80', brand: brandUnilever },
      { title: 'Santoor Sandal Turmeric Soap', price: 60, unit: '125 g Bar', image: 'https://images.unsplash.com/photo-1607006482602-76ca0fd2f47b?w=500&q=80', brand: brandUnilever },
      { title: 'Loofah Bath Sponge', price: 50, unit: '1 pc', image: 'https://images.unsplash.com/photo-1607006482602-76ca0fd2f47b?w=500&q=80', brand: brandUnilever },
    ],

    // ── Hair Care & Shampoo ──
    'hair-care-shampoo': [
      { title: 'Sunsilk Thick & Long Shampoo', price: 290, unit: '375 ml Bottle', image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&q=80', brand: brandUnilever },
      { title: 'Clear Anti-Dandruff Cool Sport', price: 340, unit: '330 ml Bottle', image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&q=80', brand: brandUnilever },
      { title: 'Dove Intense Repair Conditioner', price: 260, unit: '170 ml Tube', image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&q=80', brand: brandUnilever },
      { title: 'Parachute Coconut Hair Oil', price: 180, unit: '200 ml Bottle', image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&q=80', brand: brandUnilever },
      { title: 'Pantene Pro-V Hair Fall Control', price: 360, unit: '340 ml Bottle', image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&q=80', brand: brandUnilever },
      { title: 'L’Oreal Paris Total Repair Hair Mask', price: 620, unit: '200 ml Tub', image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&q=80', brand: brandUnilever },
      { title: 'Tresemme Keratin Smooth Conditioner', price: 420, unit: '190 ml Bottle', image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&q=80', brand: brandUnilever },
      { title: 'Nihar Black Seed Hair Oil', price: 195, unit: '200 ml Bottle', image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&q=80', brand: brandUnilever },
    ],

    // ── Oral Care & Hygiene ──
    'oral-care-hygiene': [
      { title: 'Colgate Strong Teeth Toothpaste', price: 110, unit: '150 g Tube', image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500&q=80', brand: brandUnilever },
      { title: 'Close Up Deep Action Red Gel', price: 105, unit: '140 g Tube', image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500&q=80', brand: brandUnilever },
      { title: 'Sensodyne Rapid Relief Toothpaste', price: 230, unit: '75 g Tube', image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500&q=80', brand: brandUnilever },
      { title: 'Oral-B Medium Toothbrush 3-Pack', price: 150, unit: '3 pcs Pack', image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500&q=80', brand: brandUnilever },
      { title: 'Listerine Cool Mint Mouthwash', price: 320, unit: '250 ml Bottle', image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500&q=80', brand: brandUnilever },
      { title: 'Pepsodent Cavity Protection', price: 95, unit: '140 g Tube', image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500&q=80', brand: brandUnilever },
      { title: 'Dental Floss Picks Pack', price: 120, unit: '50 Picks Pack', image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500&q=80', brand: brandUnilever },
      { title: 'Tongue Cleaner Stainless Steel', price: 60, unit: '1 pc', image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500&q=80', brand: brandUnilever },
    ],

    // ── Skincare & Lotions ──
    'skincare-lotions': [
      { title: 'Garnier Bright Complete Face Wash', price: 210, unit: '100 g Tube', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80', brand: brandUnilever },
      { title: 'Vaseline Healthy Bright Body Lotion', price: 340, unit: '200 ml Bottle', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80', brand: brandUnilever },
      { title: 'Nivea Soft Refreshing Moisturizer', price: 280, unit: '100 ml Tub', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80', brand: brandUnilever },
      { title: 'Ponds White Beauty Cream', price: 190, unit: '50 g Box', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80', brand: brandUnilever },
      { title: 'Himalaya Neem Purifying Face Wash', price: 185, unit: '100 ml Tube', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80', brand: brandUnilever },
      { title: 'Neutrogena Hydro Boost Water Gel', price: 950, unit: '50 g Jar', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80', brand: brandUnilever },
      { title: 'Biore UV Aqua Rich Sunscreen SPF50+', price: 820, unit: '50 g Tube', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80', brand: brandUnilever },
      { title: 'Aloe Vera Soothing Gel 99%', price: 290, unit: '300 ml Tub', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80', brand: brandUnilever },
    ],
  };

  const createdProducts: any[] = [];

  for (const mainCatSlug in categoryMap) {
    const { subs } = categoryMap[mainCatSlug];

    for (const subCat of subs) {
      const templates = productTemplates[subCat.slug] || productTemplates['fresh-vegetables'];

      for (const t of templates) {
        const slug = `${t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.floor(1000 + Math.random() * 9000)}`;

        const prod = await prisma.product.create({
          data: {
            name: t.title,
            slug,
            description: `${t.title} - Guaranteed fresh quality grocery delivered straight to your doorstep in DOHS area within 45 minutes.`,
            price: t.price,
            salePrice: t.salePrice || null,
            unit: t.unit,
            stock: Math.floor(20 + Math.random() * 80),
            rating: Number((4.5 + Math.random() * 0.49).toFixed(1)),
            images: [t.image],
            isFeatured: Math.random() > 0.7,
            sellerId: seller.id,
            brandId: t.brand?.id || null,
            categoryId: subCat.id,
          },
        });

        createdProducts.push(prod);
      }
    }
  }

  console.log(`   ✓ Total ${createdProducts.length} products created across all subcategories.`);
  return createdProducts;
}

// ─── 7. COUPONS & ADDRESSES ──────────────────────────────────────────────────
async function seedCouponsAndAddresses(customer: any, seller: any) {
  console.log('🎟️ Seeding coupons & delivery addresses...');

  const coupon1 = await prisma.coupon.create({
    data: {
      code: 'DOHS50',
      discountType: 'FLAT',
      discountValue: 50,
      minOrderAmount: 300,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    }
  });

  const customerAddr = await prisma.address.create({
    data: {
      userId: customer.id,
      label: 'Home',
      line1: 'House #42, Road #05, Block C',
      area: 'Mohakhali DOHS',
      city: 'Dhaka',
      postCode: '1206',
      isDefault: true,
    }
  });

  await prisma.address.create({
    data: {
      userId: seller.id,
      label: 'Shop Storefront',
      line1: 'Shop #12, DOHS Central Market',
      area: 'Mohakhali DOHS',
      city: 'Dhaka',
      postCode: '1206',
      isDefault: true,
    }
  });

  console.log('   ✓ Coupons & Addresses created.');
  return { coupon1, customerAddr };
}

// ─── 8. ORDERS & DISPATCH LIFECYCLE ──────────────────────────────────────────
async function seedOrders(customer: any, rider: any, customerAddr: any, products: any[]) {
  console.log('📦 Seeding active orders across dispatch lifecycle...');
  const p1 = products[0];
  const p2 = products[1];

  if (!p1) return;

  // Order 1: Pending Registered Order
  await prisma.order.create({
    data: {
      trackingCode: 'TRK-98401928',
      isGuest: false,
      customerId: customer.id,
      addressId: customerAddr.id,
      customerPhone: '+8801800000005',
      subtotal: p1.price,
      deliveryFee: 50,
      discount: 0,
      totalAmount: p1.price + 50,
      status: OrderStatus.PENDING,
      items: {
        create: [
          { productId: p1.id, quantity: 1, price: p1.price }
        ]
      },
      payment: {
        create: {
          amount: p1.price + 50,
          method: PaymentMethod.CASH,
          status: PaymentStatus.PENDING,
        }
      }
    }
  });

  // Order 2: Guest Express Order (Ready for Rider)
  await prisma.order.create({
    data: {
      trackingCode: 'TRK-48190284',
      isGuest: true,
      guestName: 'Guest Resident',
      guestPhone: '+8801712345678',
      guestAddress: 'House 14, Road 2, Mohakhali DOHS',
      customerPhone: '+8801712345678',
      subtotal: p1.price * 2,
      deliveryFee: 0,
      discount: 0,
      totalAmount: p1.price * 2,
      status: OrderStatus.READY_FOR_RIDER,
      items: {
        create: [
          { productId: p1.id, quantity: 2, price: p1.price }
        ]
      },
      payment: {
        create: {
          amount: p1.price * 2,
          method: PaymentMethod.CASH,
          status: PaymentStatus.PENDING,
        }
      }
    }
  });

  // Order 3: Delivered Order
  if (p2) {
    await prisma.order.create({
      data: {
        trackingCode: 'TRK-10293847',
        isGuest: false,
        customerId: customer.id,
        riderId: rider.id,
        assignedRiderId: rider.id,
        addressId: customerAddr.id,
        customerPhone: '+8801800000005',
        subtotal: p2.price,
        deliveryFee: 50,
        discount: 10,
        totalAmount: p2.price + 40,
        status: OrderStatus.DELIVERED,
        items: {
          create: [
            { productId: p2.id, quantity: 1, price: p2.price }
          ]
        },
        payment: {
          create: {
            amount: p2.price + 40,
            method: PaymentMethod.CASH,
            status: PaymentStatus.PAID,
          }
        }
      }
    });
  }

  console.log('   ✓ Sample orders seeded across lifecycle statuses.');
}

// ─── 9. COMPANY SERVICES & TECHNICIANS ────────────────────────────────────────
async function seedServicesAndTechnicians(provider: any) {
  console.log('🛠️ Seeding DOHS Sheba Company Managed Services & Technicians...');

  // Technicians
  if ((prisma as any).technician) {
    await (prisma as any).technician.createMany({
      data: [
        { name: 'Rakib Ahmed', phone: '+8801711223344', specialty: 'Electrical & AC', isActive: true },
        { name: 'Hasan Mahmud', phone: '+8801722556677', specialty: 'Plumbing & Sanitary', isActive: true },
        { name: 'Mahmudul Islam', phone: '+8801733889900', specialty: 'Appliance Repair', isActive: true },
        { name: 'Sabbir Hossain', phone: '+8801744112233', specialty: 'General Handyman', isActive: true },
      ],
    });
  }

  // Service Categories
  const catAC = await prisma.serviceCategory.create({
    data: { name: 'AC Service & Repair', slug: 'ac-service', icon: 'Wind', isActive: true },
  });
  const catElec = await prisma.serviceCategory.create({
    data: { name: 'Electrician', slug: 'electrician', icon: 'Zap', isActive: true },
  });
  const catPlumb = await prisma.serviceCategory.create({
    data: { name: 'Plumbing Service', slug: 'plumber', icon: 'Droplet', isActive: true },
  });
  const catClean = await prisma.serviceCategory.create({
    data: { name: 'House & Deep Cleaning', slug: 'cleaner', icon: 'Sparkles', isActive: true },
  });
  const catPest = await prisma.serviceCategory.create({
    data: { name: 'Pest Control', slug: 'pest-control', icon: 'ShieldAlert', isActive: true },
  });
  const catAppliance = await prisma.serviceCategory.create({
    data: { name: 'Appliance Repair', slug: 'appliance-repair', icon: 'Wrench', isActive: true },
  });

  // Services
  await prisma.service.createMany({
    data: [
      {
        title: 'AC Jet Cleaning & Master Servicing',
        description: 'Complete jet wash indoor & outdoor unit cleaning with anti-bacterial foam treatment.',
        price: 1200,
        priceUnit: 'job',
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
        priceUnit: 'job',
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
        priceUnit: 'job',
        categoryId: catClean.id,
        providerId: provider.id,
        isActive: true,
        rating: 5.0,
        images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80'],
      },
      {
        title: 'Sofa & Carpet Shampoo Cleaning',
        description: 'Deep extraction shampoo washing for 5-seater sofa set or large living room carpet.',
        price: 1800,
        priceUnit: 'job',
        categoryId: catClean.id,
        providerId: provider.id,
        isActive: true,
        rating: 4.9,
        images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80'],
      },
      {
        title: 'Plumbing Leakage & Pipe Repair',
        description: 'Expert plumber visit for pipe leak detection, basin connection & tap replacement.',
        price: 850,
        priceUnit: 'job',
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
        priceUnit: 'job',
        categoryId: catElec.id,
        providerId: provider.id,
        isActive: true,
        rating: 4.9,
        images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80'],
      },
    ],
  });

  // Fetch first service and customer for sample bookings
  const [firstService, secondService, sampleCustomer, sampleAddress] = await Promise.all([
    prisma.service.findFirst({ where: { title: { contains: 'AC Jet Cleaning' } } }),
    prisma.service.findFirst({ where: { title: { contains: 'Plumbing' } } }),
    prisma.user.findFirst({ where: { email: 'customer@dohssheba.com' } }),
    prisma.address.findFirst({}),
  ]);

  if (firstService && sampleCustomer && sampleAddress) {
    await prisma.booking.createMany({
      data: [
        {
          id: 'BK-1001',
          customerId: sampleCustomer.id,
          serviceId: firstService.id,
          addressId: sampleAddress.id,
          scheduledAt: new Date(Date.now() + 86400000),
          totalAmount: 1200,
          notes: 'Master AC Jet cleaning requested for Mohakhali DOHS House #12',
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
    });
  }

  console.log('   ✓ Company Services, Technicians & Sample Bookings seeded successfully.');
}

// ─── MAIN RUNNER ─────────────────────────────────────────────────────────────
async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    console.warn('🛡️ [SAFETY GUARD] Seed script execution BLOCKED in production to protect real user data.');
    return;
  }

  console.log('🚀 Running Full Project Audit & Database Reset Seed...');
  console.log('='.repeat(60));

  await clearAll();
  const users = await seedUsers();
  await seedProfiles(users.seller, users.rider, users.provider);
  const brands = await seedBrands();
  const categoryMap = await seedCategories();
  const products = await seedProducts(users.seller, categoryMap, brands);
  const { customerAddr } = await seedCouponsAndAddresses(users.customer, users.seller);
  await seedOrders(users.customer, users.rider, customerAddr, products);
  await seedServicesAndTechnicians(users.provider);

  console.log('='.repeat(60));
  console.log('✅ Seed completed successfully with zero errors!');
  console.log(`   Total Products: ${products.length}`);
  console.log(`   Admin: admin@dohssheba.com (Password: password123)`);
  console.log(`   Seller: seller@dohssheba.com (Password: password123)`);
  console.log(`   Rider: rider@dohssheba.com (Password: password123)`);
  console.log(`   Customer: customer@dohssheba.com (Password: password123)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
