import { prisma } from '../lib/prisma';
import { fruitsVegetablesDataset } from '../data/fruits_vegetables_dataset';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function extractUnit(name: string): { unit: string; unitAmount?: number } {
  const match = name.match(/(\d+(?:\.\d+)?)\s*(gm|g|kg|ml|ltr|l|pcs|pc|pack|pt|dozen)/i);
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

export async function runFruitsVegetablesSeed() {
  console.log('🚀 Running Fruits & Vegetables Products Seed on Database...');

  // 1. Get Seller user
  let seller = await prisma.user.findFirst({ where: { role: 'SELLER' } });
  if (!seller) {
    seller = await prisma.user.findFirst({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } } });
  }
  if (!seller) {
    throw new Error('No SELLER or ADMIN user found in database.');
  }

  // 2. Ensure Main Category 'Fruits & Vegetables' exists
  let mainCategory = await prisma.productCategory.findFirst({
    where: {
      OR: [
        { slug: 'fruits-vegetables' },
        { slug: 'fresh-fruits-vegetables' },
        { name: { equals: 'Fruits & Vegetables', mode: 'insensitive' } },
        { name: { equals: 'Fresh Fruits & Vegetables', mode: 'insensitive' } },
      ],
      parentId: null
    }
  });

  if (!mainCategory) {
    mainCategory = await prisma.productCategory.create({
      data: {
        name: 'Fruits & Vegetables',
        slug: 'fruits-vegetables',
        icon: '🥗',
        description: 'Farm fresh organic vegetables and fresh fruits delivered in 45 mins in DOHS.',
        image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500'
      }
    });
  }

  // 3. Load dataset
  const subcatList: any[] = fruitsVegetablesDataset;
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
          icon: config.icon || '🥗',
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
      const images = p.imageUrl ? [p.imageUrl] : ['https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500'];

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
            description: `${p.name} - Fresh, premium quality produce delivered straight to your doorstep in Savar DOHS.`,
            categoryId: subCat.id,
            sellerId: seller.id,
            price,
            images,
            unit,
            unitAmount,
            stock: 100,
            isActive: true,
            isFeatured: i <= 5
          }
        });
        addedCount++;
      }
    }
  }

  console.log(`✅ Fruits & Vegetables Seed Completed! Added: ${addedCount}, Updated: ${updatedCount}`);
  return { success: true, addedCount, updatedCount, totalCategories: subcatList.length };
}

if (require.main === module) {
  runFruitsVegetablesSeed()
    .then(() => {
      console.log('🎉 Fruits & Vegetables Seed Completed!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed Error:', err);
      process.exit(1);
    });
}
