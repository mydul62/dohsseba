import { prisma } from '../lib/prisma';
import { meatFishDataset } from '../data/meat_fish_dataset';

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
    return { unit: unitStr, unitAmount: amount };
  }
  return { unit: '1 kg', unitAmount: 1 };
}

export async function runMeatFishSeed() {
  console.log('🚀 Running Meat & Fish Products Seed on Database...');

  // 1. Get Seller user
  let seller = await prisma.user.findFirst({ where: { role: 'SELLER' } });
  if (!seller) {
    seller = await prisma.user.findFirst({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } } });
  }
  if (!seller) {
    throw new Error('No SELLER or ADMIN user found in database.');
  }

  // 2. Ensure Main Category 'Meat & Fish' exists
  let mainCategory = await prisma.productCategory.findFirst({
    where: {
      OR: [
        { slug: 'meat-fish' },
        { name: { equals: 'Meat & Fish', mode: 'insensitive' } },
      ],
      parentId: null
    }
  });

  if (!mainCategory) {
    mainCategory = await prisma.productCategory.create({
      data: {
        name: 'Meat & Fish',
        slug: 'meat-fish',
        icon: '🥩',
        description: 'Fresh chicken, beef, mutton, sea fish, and river fish delivered in Savar DOHS.',
        image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500'
      }
    });
  }

  // 3. Load dataset
  const subcatList: any[] = meatFishDataset;
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
          icon: config.icon || '🥩',
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
      const images = p.imageUrl ? [p.imageUrl] : ['https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500'];

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
            description: `${p.name} - Fresh, premium meat or fish delivered straight to your doorstep in Savar DOHS.`,
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

  console.log(`✅ Meat & Fish Products Seed Completed! Added: ${addedCount}, Updated: ${updatedCount}`);
  return { success: true, addedCount, updatedCount, totalCategories: subcatList.length };
}

if (require.main === module) {
  runMeatFishSeed()
    .then(() => {
      console.log('🎉 Meat & Fish Seed Completed!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed Error:', err);
      process.exit(1);
    });
}
