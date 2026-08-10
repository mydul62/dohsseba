import { prisma } from '../lib/prisma';
import { dairyDataset } from '../data/dairy_dataset';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function extractUnit(name: string): { unit: string; unitAmount?: number } {
  const match = name.match(/(\d+(?:\.\d+)?)\s*(gm|g|kg|ml|ltr|l|pcs|pc|pack|pt|slices|pcs)/i);
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

export async function runDairySeed() {
  console.log('🚀 Running Dairy Products Seed on Database...');

  // 1. Get Seller user
  let seller = await prisma.user.findFirst({ where: { role: 'SELLER' } });
  if (!seller) {
    seller = await prisma.user.findFirst({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } } });
  }
  if (!seller) {
    throw new Error('No SELLER or ADMIN user found in database.');
  }

  // 2. Ensure Main Category 'Dairy, Eggs & Bakery' or 'Dairy' exists
  let mainCategory = await prisma.productCategory.findFirst({
    where: {
      OR: [
        { slug: 'dairy-eggs-bakery' },
        { slug: 'dairy' },
        { name: { equals: 'Dairy, Eggs & Bakery', mode: 'insensitive' } },
        { name: { equals: 'Dairy', mode: 'insensitive' } },
      ],
      parentId: null
    }
  });

  if (!mainCategory) {
    mainCategory = await prisma.productCategory.create({
      data: {
        name: 'Dairy, Eggs & Bakery',
        slug: 'dairy-eggs-bakery',
        icon: '🥛',
        description: 'Fresh milk, butter, cheese, yogurt, eggs and bakery essentials delivered in Savar DOHS.',
        image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500'
      }
    });
  }

  // 3. Load dataset
  const subcatList: any[] = dairyDataset;
  let addedCount = 0;
  let updatedCount = 0;

  for (const config of subcatList) {
    let subCat = await prisma.productCategory.findFirst({
      where: {
        OR: [
          { slug: config.slug },
          { name: { equals: config.name, mode: 'insensitive' }, parentId: mainCategory.id }
        ]
      }
    });

    if (!subCat) {
      subCat = await prisma.productCategory.create({
        data: {
          name: config.name,
          slug: config.slug,
          icon: config.icon || '🥛',
          image: config.image,
          parentId: mainCategory.id,
          isActive: true
        }
      });
    } else {
      subCat = await prisma.productCategory.update({
        where: { id: subCat.id },
        data: {
          name: config.name,
          slug: config.slug,
          image: subCat.image || config.image,
          icon: config.icon || subCat.icon,
          parentId: mainCategory.id,
          isActive: true
        }
      });
    }

    for (let i = 0; i < config.products.length; i++) {
      const p = config.products[i];
      if (!p.name) continue;

      const price = Number(p.price) || 0;
      const { unit, unitAmount } = extractUnit(p.name);
      const baseSlug = slugify(p.name);
      const images = p.imageUrl ? [p.imageUrl] : ['https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500'];

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
            description: `${p.name} - Fresh, wholesome dairy & egg item available for express delivery in Savar DOHS.`,
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

  console.log(`✅ Dairy Products Seed Completed! Added: ${addedCount}, Updated: ${updatedCount}`);
  return { success: true, addedCount, updatedCount, totalCategories: subcatList.length };
}

if (require.main === module) {
  runDairySeed()
    .then(() => {
      console.log('🎉 Dairy Seed Completed!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed Error:', err);
      process.exit(1);
    });
}
