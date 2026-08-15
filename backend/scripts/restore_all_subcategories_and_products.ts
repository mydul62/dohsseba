import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Restoring ALL products & categories (Rice, Atta, Moida, Frozen, Fish, Chilli, Meat)...');

  // 1. Get or create seller user
  let seller = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'seller@dohssheba.com' },
        { role: 'SELLER' }
      ]
    }
  });

  if (!seller) {
    seller = await prisma.user.create({
      data: {
        email: 'seller@dohssheba.com',
        name: 'Green Market DOHS',
        role: 'SELLER',
        password: '$2a$10$hashedpassword'
      }
    });
  }

  // 2. Main Categories
  const categoriesList = [
    { name: 'Bakery & Sweets', slug: 'bakery-sweets', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80' },
    { name: 'Electronics', slug: 'electronics', image: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=80' },
    { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&auto=format&fit=crop&q=80' },
    { name: 'Home & Cleaning', slug: 'home-cleaning', image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=80' },
    { name: 'Live food', slug: 'live-food', image: 'https://images.unsplash.com/photo-1534942519507-769d4679447d?w=500&auto=format&fit=crop&q=80' },
    { name: 'Medicine & Healthcare', slug: 'medicine-healthcare', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80' },
    { name: 'Milk', slug: 'milk', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80' },
    { name: 'Uncategorized', slug: 'uncategorized', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80' },
    { name: 'কিচেন সামগ্রী', slug: 'kitchen-items', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=80' },
    { name: 'প্রসাধনী', slug: 'cosmetics', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=80' },
    { name: 'ফ্রোজেন আইটেম', slug: 'frozen-items', image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80' },
    { name: 'রান্না ও মুদিখানা', slug: 'cooking-grocery', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80' }
  ];

  const catIdMap: Record<string, string> = {};

  for (const c of categoriesList) {
    let exist = await prisma.productCategory.findFirst({
      where: { OR: [{ name: c.name }, { slug: c.slug }] }
    });
    if (exist) {
      exist = await prisma.productCategory.update({
        where: { id: exist.id },
        data: { name: c.name, slug: c.slug, image: c.image }
      });
    } else {
      exist = await prisma.productCategory.create({
        data: { name: c.name, slug: c.slug, image: c.image }
      });
    }
    catIdMap[c.slug] = exist.id;
    catIdMap[c.name] = exist.id;
  }

  // 3. Subcategories
  const cookingId = catIdMap['cooking-grocery'];
  const frozenId = catIdMap['frozen-items'];
  const liveFoodId = catIdMap['live-food'];

  const subDefs = [
    { parentId: cookingId, name: 'চাল, আটা ও ময়দা', slug: 'rice-flour-atta', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80' },
    { parentId: cookingId, name: 'মসলা 🌶️', slug: 'spices', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=80' },
    { parentId: frozenId, name: 'ফ্রোজেন স্ন্যাক্স', slug: 'frozen-snacks', image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80' },
    { parentId: liveFoodId, name: 'মাছ ও মাংস', slug: 'meat-fish', image: 'https://images.unsplash.com/photo-1534942519507-769d4679447d?w=500&auto=format&fit=crop&q=80' }
  ];

  for (const sub of subDefs) {
    let exist = await prisma.productCategory.findFirst({
      where: { OR: [{ name: sub.name }, { slug: sub.slug }] }
    });
    if (exist) {
      exist = await prisma.productCategory.update({
        where: { id: exist.id },
        data: { parentId: sub.parentId, name: sub.name, slug: sub.slug, image: sub.image }
      });
    } else {
      exist = await prisma.productCategory.create({
        data: { parentId: sub.parentId, name: sub.name, slug: sub.slug, image: sub.image }
      });
    }
    catIdMap[sub.slug] = exist.id;
    catIdMap[sub.name] = exist.id;
  }

  // 4. Products Master Data
  const productsToUpsert = [
    // 🌾 Rice, Atta & Moida Items
    { name: 'নাজিরশাইল চাল (Jamuna VIP)', slug: 'najirshail-rice', price: 80, unit: 'kg', amount: 1, catSlug: 'rice-flour-atta', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80' },
    { name: 'রশিদ মিনিকেট চাল', slug: 'rashid-miniket-rice', price: 70, unit: 'kg', amount: 1, catSlug: 'rice-flour-atta', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80' },
    { name: 'বিরি ২৮ চাল', slug: 'biri-28-rice', price: 55, unit: 'kg', amount: 1, catSlug: 'rice-flour-atta', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80' },
    { name: '২৯ চাল', slug: '29-rice', price: 55, unit: 'kg', amount: 1, catSlug: 'rice-flour-atta', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80' },
    { name: 'সর্ণা চাল', slug: 'shorna-rice', price: 45, unit: 'kg', amount: 1, catSlug: 'rice-flour-atta', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80' },
    { name: 'বসুন্ধারা আটা (৫ কেজি)', slug: 'bashundhara-atta', price: 310, unit: 'kg', amount: 5, catSlug: 'rice-flour-atta', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80' },
    { name: 'আকিজ আটা (৫ কেজি)', slug: 'akij-atta', price: 310, unit: 'kg', amount: 5, catSlug: 'rice-flour-atta', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80' },
    { name: 'সেনা আটা (২ কেজি)', slug: 'sena-atta', price: 100, unit: 'kg', amount: 2, catSlug: 'rice-flour-atta', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80' },
    { name: 'তীর ফ্রেশ ময়দা (২ কেজি)', slug: 'teer-fresh-moida', price: 130, unit: 'kg', amount: 2, catSlug: 'rice-flour-atta', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80' },

    // ❄️ Frozen Items
    { name: 'চিকেন সমোসা (Chicken Samosa)', slug: 'chicken-samosa', price: 220, unit: 'pack', amount: 1, catSlug: 'frozen-items', image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80' },
    { name: 'চিকেন রোল (Chicken Roll)', slug: 'chicken-roll', price: 250, unit: 'pack', amount: 1, catSlug: 'frozen-items', image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80' },
    { name: 'ফ্রোজেন পরোটা (Frozen Paratha)', slug: 'frozen-paratha', price: 180, unit: 'pack', amount: 1, catSlug: 'frozen-items', image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80' },

    // 🌶️ Spices & Chilli Items
    { name: 'মরিচ গুঁড়া (Red Chilli Powder)', slug: 'red-chilli-powder', price: 100, unit: 'gm', amount: 200, catSlug: 'spices', image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80' },
    { name: 'কাঁচা মরিচ (Green Chilli)', slug: 'green-chilli', price: 120, unit: 'kg', amount: 1, catSlug: 'spices', image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80' },
    { name: 'হলুদ গুঁড়া (Turmeric Powder)', slug: 'turmeric-powder', price: 100, unit: 'gm', amount: 200, catSlug: 'spices', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80' },

    // 🐟 Fish & Meat (Live food)
    { name: 'তাজা রুই মাছ (Live Rui Fish)', slug: 'live-rui-fish', price: 380, unit: 'kg', amount: 1, catSlug: 'live-food', image: 'https://images.unsplash.com/photo-1534942519507-769d4679447d?w=600&auto=format&fit=crop&q=80' },
    { name: 'পদ্মার খাঁটি ইলিশ মাছ (Hilsa Fish)', slug: 'hilsa-fish', price: 1200, unit: 'kg', amount: 1, catSlug: 'live-food', image: 'https://images.unsplash.com/photo-1534942519507-769d4679447d?w=600&auto=format&fit=crop&q=80' },
    { name: 'দেশি ব্রয়লার মুরগি (Live Chicken)', slug: 'live-chicken', price: 180, unit: 'kg', amount: 1, catSlug: 'live-food', image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&auto=format&fit=crop&q=80' },
    { name: 'গরুর তাজা মাংস (Fresh Beef)', slug: 'fresh-beef', price: 750, unit: 'kg', amount: 1, catSlug: 'live-food', image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&auto=format&fit=crop&q=80' },

    // 🍪 Bakery & Sweets
    { name: 'এনার্জি প্লাস বিস্কুট', slug: 'energy-plus-biscuit', price: 10, unit: 'pack', amount: 1, catSlug: 'bakery-sweets', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80' },
    { name: 'নাটি বিস্কুট', slug: 'nutty-biscuit', price: 20, unit: 'pack', amount: 1, catSlug: 'bakery-sweets', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80' },
    { name: 'টিপ বিস্কুট', slug: 'tip-biscuit', price: 20, unit: 'pack', amount: 1, catSlug: 'bakery-sweets', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80' },
    { name: 'লেকশাস বিস্কুট', slug: 'lexus-biscuit', price: 100, unit: 'pack', amount: 1, catSlug: 'bakery-sweets', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80' },

    // 🥛 Milk
    { name: 'Pran UHT Milk 200ml', slug: 'pran-uht-milk-200ml', price: 30, unit: 'ml', amount: 200, catSlug: 'milk', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80' }
  ];

  for (const p of productsToUpsert) {
    const categoryId = catIdMap[p.catSlug] || Object.values(catIdMap)[0];

    let prod = await prisma.product.findFirst({
      where: { OR: [{ name: p.name }, { slug: p.slug }] }
    });

    if (prod) {
      await prisma.product.update({
        where: { id: prod.id },
        data: {
          name: p.name,
          price: p.price,
          unit: p.unit,
          unitAmount: p.amount,
          images: [p.image],
          categoryId: categoryId,
          sellerId: seller.id,
          isActive: true,
          isFeatured: true,
          stock: 100
        }
      });
    } else {
      await prisma.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          description: `${p.name} high quality item in DOHS Sheba market.`,
          price: p.price,
          unit: p.unit,
          unitAmount: p.amount,
          images: [p.image],
          categoryId: categoryId,
          sellerId: seller.id,
          isActive: true,
          isFeatured: true,
          stock: 100
        }
      });
    }
  }

  // Set ALL products in DB to active, featured and stock 100
  await prisma.product.updateMany({
    data: {
      isActive: true,
      isFeatured: true,
      sellerId: seller.id,
      stock: 100
    }
  });

  console.log(`🎉 ALL products & subcategories successfully updated and linked!`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
