import { prisma } from '../lib/prisma';
import { cookingDataset } from '../data/cooking_dataset';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function extractUnit(name: string): { unit: string; unitAmount?: number } {
  const match = name.match(/(\d+(?:\.\d+)?)\s*(gm|g|kg|ml|ltr|l|pcs|pc|pack|pt)/i);
  if (match) {
    const amount = parseFloat(match[1]);
    const rawUnit = match[2].toLowerCase();
    let unitStr = `${amount} ${rawUnit}`;
    if (rawUnit === 'gm' || rawUnit === 'g') unitStr = `${amount} g`;
    if (rawUnit === 'kg') unitStr = `${amount} kg`;
    if (rawUnit === 'ml') unitStr = `${amount} ml`;
    if (rawUnit === 'ltr' || rawUnit === 'l') unitStr = `${amount} L`;
    return { unit: unitStr, unitAmount: amount };
  }
  return { unit: '1 pcs', unitAmount: 1 };
}

const SUB_IMAGES: Record<string, string> = {
  'colors-flavours': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=80',
  'dal-or-lentil': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
  'ghee': 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?w=400&auto=format&fit=crop&q=80',
  'oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80',
  'premium-ingredients': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&auto=format&fit=crop&q=80',
  'ready-mix': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80',
  'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
  'salt-sugar': 'https://images.unsplash.com/photo-1518110168401-f282472fc750?w=400&auto=format&fit=crop&q=80',
  'shemai-suji': 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400&auto=format&fit=crop&q=80',
  'special-ingredients-miscellaneous': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=80',
  'spices': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=80'
};

export async function runCookingSeed() {
  console.log('🚀 Running Cooking Products Seed on Database...');

  // 1. Get Seller user
  let seller = await prisma.user.findFirst({ where: { role: 'SELLER' } });
  if (!seller) {
    seller = await prisma.user.findFirst({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } } });
  }
  if (!seller) {
    throw new Error('No SELLER or ADMIN user found in database.');
  }

  // 2. Ensure Main Category 'Cooking' exists
  let mainCooking = await prisma.productCategory.findFirst({
    where: {
      OR: [
        { slug: 'cooking' },
        { name: { equals: 'Cooking', mode: 'insensitive' } }
      ],
      parentId: null
    }
  });

  if (!mainCooking) {
    mainCooking = await prisma.productCategory.create({
      data: {
        name: 'Cooking',
        slug: 'cooking',
        icon: '🍳',
        description: 'Explore top quality items under Cooking. Fast 45-min delivery in DOHS.',
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500'
      }
    });
  }

  // 3. Load dataset
  const subcatList: any[] = cookingDataset;
  const activeSubcatIds: string[] = [];
  let addedCount = 0;
  let updatedCount = 0;

  for (const config of subcatList) {
    // Find existing subcategory by slug or name under main Cooking category
    let subCat = await prisma.productCategory.findFirst({
      where: {
        OR: [
          { slug: config.slug },
          { name: { equals: config.name, mode: 'insensitive' }, parentId: mainCooking.id },
          config.name.startsWith('Special Ingredients') ? { name: { startsWith: 'Special Ingredients' }, parentId: mainCooking.id } : {}
        ]
      }
    });

    const validImg = SUB_IMAGES[config.slug] || config.image || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=80';

    if (!subCat) {
      subCat = await prisma.productCategory.create({
        data: {
          name: config.name,
          slug: config.slug,
          icon: config.icon || '🍳',
          image: validImg,
          parentId: mainCooking.id,
          isActive: true
        }
      });
    } else {
      subCat = await prisma.productCategory.update({
        where: { id: subCat.id },
        data: {
          name: config.name,
          slug: config.slug,
          image: validImg,
          icon: config.icon || subCat.icon,
          parentId: mainCooking.id,
          isActive: true
        }
      });
    }

    activeSubcatIds.push(subCat.id);

    // Insert/update products
    for (let i = 0; i < config.products.length; i++) {
      const p = config.products[i];
      if (!p.name) continue;

      const price = Number(p.price) || 0;
      const { unit, unitAmount } = extractUnit(p.name);
      const baseSlug = slugify(p.name);
      const images = p.imageUrl ? [p.imageUrl] : ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&q=80'];

      const existingProd = await prisma.product.findFirst({
        where: {
          OR: [
            { slug: baseSlug },
            { name: { equals: p.name, mode: 'insensitive' } }
          ]
        }
      });

      if (existingProd) {
        await prisma.product.update({
          where: { id: existingProd.id },
          data: {
            name: p.name,
            categoryId: subCat.id,
            sellerId: seller.id,
            price,
            images,
            unit,
            unitAmount,
            stock: 100,
            isActive: true
          }
        });
        updatedCount++;
      } else {
        await prisma.product.create({
          data: {
            name: p.name,
            slug: baseSlug,
            description: `${p.name} - Premium quality cooking ingredient available for express delivery in Savar DOHS.`,
            categoryId: subCat.id,
            sellerId: seller.id,
            price,
            images,
            unit,
            unitAmount,
            stock: 100,
            isActive: true,
            isFeatured: i <= 3
          }
        });
        addedCount++;
      }
    }
  }

  // 4. Deactivate/delete leftover empty subcategories under Cooking
  const leftoverSubcats = await prisma.productCategory.findMany({
    where: {
      parentId: mainCooking.id,
      id: { notIn: activeSubcatIds }
    },
    include: { products: true }
  });

  for (const sub of leftoverSubcats) {
    if (sub.products.length > 0 && activeSubcatIds.length > 0) {
      await prisma.product.updateMany({
        where: { categoryId: sub.id },
        data: { categoryId: activeSubcatIds[0] }
      });
    }
    await prisma.productCategory.delete({ where: { id: sub.id } }).catch(() => null);
  }

  // 5. Remove empty top-level Cooking Oil & Ghee
  const emptyCookingOilGhee = await prisma.productCategory.findFirst({
    where: { slug: 'cooking-oil-ghee' },
    include: { _count: { select: { products: true, children: true } } }
  });

  if (emptyCookingOilGhee && emptyCookingOilGhee._count.products === 0 && emptyCookingOilGhee._count.children === 0) {
    await prisma.productCategory.delete({ where: { id: emptyCookingOilGhee.id } }).catch(() => null);
  }

  console.log(`✅ Cooking Seed Completed! Added: ${addedCount}, Updated: ${updatedCount}`);
  return { success: true, addedCount, updatedCount, totalCategories: subcatList.length };
}

if (require.main === module) {
  runCookingSeed()
    .then(() => {
      console.log('🎉 Cooking Seed Completed!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed Error:', err);
      process.exit(1);
    });
}
