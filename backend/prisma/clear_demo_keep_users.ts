import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing all sample catalog & transactional data from database...\n');

  // 1. Delete transactional & dependent operational data
  console.log('  → Deleting Order Items & Rider Assignments...');
  await prisma.orderItem.deleteMany();
  await prisma.riderAssignment.deleteMany();

  console.log('  → Deleting Payments...');
  await prisma.payment.deleteMany();

  console.log('  → Deleting Orders...');
  await prisma.order.deleteMany();

  console.log('  → Deleting Bookings & Technicians...');
  await prisma.booking.deleteMany();
  await prisma.technician.deleteMany();

  console.log('  → Deleting Reviews...');
  await prisma.review.deleteMany();

  console.log('  → Deleting Carts & Cart Items...');
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();

  console.log('  → Deleting Wishlists & Wishlist Items...');
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();

  console.log('  → Deleting Products, Categories & Brands...');
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.brand.deleteMany();

  console.log('  → Deleting Services & Service Categories...');
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();

  console.log('  → Deleting Coupons & Banners...');
  await prisma.coupon.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.heroSlide.deleteMany();
  await prisma.promoCard.deleteMany();
  await prisma.featuredShortcut.deleteMany();
  await prisma.homepageSection.deleteMany();

  console.log('  → Deleting Transactions, Notifications & Logs...');
  await prisma.transaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.withdrawalRequest.deleteMany();
  await prisma.riderLocation.deleteMany();
  await prisma.refreshToken.deleteMany();

  // 2. Reset Wallets
  console.log('  → Resetting Wallet Balances...');
  await prisma.wallet.updateMany({
    data: { balance: 0 },
  });

  // 3. Ensure Core System Users exist so dashboard login works
  console.log('\n👤 Ensuring Core System Users exist...');
  const defaultPass = await bcrypt.hash('password123', 10);

  // Super Admin
  await prisma.user.upsert({
    where: { email: 'superadmin@dohssheba.com' },
    update: { isActive: true },
    create: {
      name: 'Super Admin',
      email: 'superadmin@dohssheba.com',
      password: defaultPass,
      phone: '+8801700000001',
      role: Role.SUPER_ADMIN,
      isActive: true,
      emailVerified: true,
    },
  });

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@dohssheba.com' },
    update: { isActive: true },
    create: {
      name: 'DOHS Admin',
      email: 'admin@dohssheba.com',
      password: defaultPass,
      phone: '+8801700000002',
      role: Role.ADMIN,
      isActive: true,
      emailVerified: true,
    },
  });

  // Seller
  const seller = await prisma.user.upsert({
    where: { email: 'seller@dohssheba.com' },
    update: { isActive: true },
    create: {
      name: 'Green Market DOHS',
      email: 'seller@dohssheba.com',
      password: defaultPass,
      phone: '+8801700000003',
      role: Role.SELLER,
      isActive: true,
      emailVerified: true,
    },
  });

  await prisma.sellerProfile.upsert({
    where: { userId: seller.id },
    update: {},
    create: {
      userId: seller.id,
      shopName: 'Green Market DOHS',
      description: 'DOHS Market Seller',
      isVerified: true,
      rating: 5,
    },
  });

  // Rider
  const rider = await prisma.user.upsert({
    where: { email: 'rider@dohssheba.com' },
    update: { isActive: true },
    create: {
      name: 'Rider Akash',
      email: 'rider@dohssheba.com',
      password: defaultPass,
      phone: '+8801700000004',
      role: Role.RIDER,
      isActive: true,
      emailVerified: true,
    },
  });

  await prisma.riderProfile.upsert({
    where: { userId: rider.id },
    update: {},
    create: {
      userId: rider.id,
      vehicleType: 'Motorbike',
      vehicleNo: 'Dhaka Metro L-1234',
      isOnline: true,
      isOnDuty: true,
      isAvailable: true,
      rating: 5,
      totalTrips: 0,
      totalEarnings: 0,
    },
  });

  // Customer
  await prisma.user.upsert({
    where: { email: 'customer@dohssheba.com' },
    update: { isActive: true },
    create: {
      name: 'Sharmin Sultana',
      email: 'customer@dohssheba.com',
      password: defaultPass,
      phone: '+8801800000005',
      role: Role.CUSTOMER,
      isActive: true,
      emailVerified: true,
    },
  });

  // Provider
  const provider = await prisma.user.upsert({
    where: { email: 'provider@dohssheba.com' },
    update: { isActive: true },
    create: {
      name: 'DOHS Home Services',
      email: 'provider@dohssheba.com',
      password: defaultPass,
      phone: '+8801900000006',
      role: Role.PROVIDER,
      isActive: true,
      emailVerified: true,
    },
  });

  await prisma.providerProfile.upsert({
    where: { userId: provider.id },
    update: {},
    create: {
      userId: provider.id,
      bio: 'Verified Home Service Provider',
      experience: 5,
      isVerified: true,
      rating: 5,
      totalJobs: 0,
    },
  });

  console.log('\n============================================================');
  console.log('✅ DATABASE SAMPLE DATA CLEARED SUCCESSFULLY!');
  console.log('   All sample products, services, categories, orders, coupons & banners removed.');
  console.log('   Core login accounts ready (Password: password123):');
  console.log('   - Admin:    admin@dohssheba.com');
  console.log('   - Seller:   seller@dohssheba.com');
  console.log('   - Rider:    rider@dohssheba.com');
  console.log('   - Provider: provider@dohssheba.com');
  console.log('   - Customer: customer@dohssheba.com');
  console.log('============================================================\n');
}

main()
  .catch((err) => {
    console.error('❌ Error clearing database sample data:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
