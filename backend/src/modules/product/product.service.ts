import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { generateSlug } from '../../utils/auth.util';
import { expandSearchTerms } from '../../utils/searchHelper';

interface ProductFilter {
  page?: number; limit?: number;
  category?: string; search?: string;
  minPrice?: number; maxPrice?: number;
  sort?: string; featured?: boolean; flashSale?: boolean;
}

// ─── Product Categories ───────────────────────────────────────────────────────

export const getAllProductCategories = async () => {
  try {
    let cats = await prisma.productCategory.findMany({
      where: { isActive: true },
      include: {
        children: {
          where: { isActive: true },
          include: { _count: { select: { products: true } } },
          orderBy: [{ displayOrder: 'asc' } as any, { name: 'asc' }],
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: [{ displayOrder: 'asc' } as any, { name: 'asc' }],
    });

    return (cats || []).map((cat: any) => {
      const subcategoryProductCount = Array.isArray(cat.children)
        ? cat.children.reduce((sum: number, c: any) => sum + (c._count?.products || 0), 0)
        : 0;
      const totalItemCount = (cat._count?.products || 0) + subcategoryProductCount;

      return {
        ...cat,
        totalItems: totalItemCount,
        _count: {
          ...cat._count,
          totalItems: totalItemCount,
        },
      };
    });
  } catch (err) {
    console.error('Error fetching product categories:', err);
    return [];
  }
};

export const getCategoryBySlug = async (slug: string) => {
  const category = await prisma.productCategory.findFirst({
    where: {
      slug: { equals: slug, mode: 'insensitive' },
      isActive: true,
    },
    include: {
      parent: true,
      children: {
        where: { isActive: true },
        include: { _count: { select: { products: { where: { isActive: true } } } } },
        orderBy: { name: 'asc' },
      },
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });
  if (!category) throw new AppError('Category not found.', 404);
  return category;
};

export const createProductCategory = async (data: {
  name: string; description?: string; icon?: string;
  image?: string; parentId?: string; slug?: string;
}) => {
  const rawSlug = data.slug && data.slug.trim() !== '' ? data.slug.trim() : data.name;
  let slug = generateSlug(rawSlug);
  if (!slug) {
    slug = `cat-${Date.now()}`;
  }

  const existing = await prisma.productCategory.findFirst({
    where: { slug: { equals: slug, mode: 'insensitive' } },
  });
  if (existing) {
    throw new AppError(`Category slug "${slug}" is already in use. Please enter a unique slug.`, 400);
  }

  return prisma.productCategory.create({ data: { ...data, slug } });
};

export const reorderCategories = async (items: { id: string; displayOrder?: number; isPopular?: boolean }[]) => {
  for (const item of items) {
    const updateData: any = {};
    if (typeof item.displayOrder === 'number') updateData.displayOrder = item.displayOrder;
    if (typeof item.isPopular === 'boolean') updateData.isPopular = item.isPopular;

    if (Object.keys(updateData).length > 0) {
      await prisma.productCategory.update({
        where: { id: item.id },
        data: updateData,
      }).catch((e) => console.warn('Category reorder notice:', e));
    }
  }
  return { success: true };
};

export const updateProductCategory = async (id: string, data: any) => {
  const existing = await prisma.productCategory.findUnique({ where: { id } });
  if (!existing) throw new AppError('Category not found.', 404);

  if (data.slug !== undefined && data.slug !== null) {
    const rawSlug = String(data.slug).trim();
    if (!rawSlug) {
      throw new AppError('Category slug cannot be empty.', 400);
    }
    const cleanSlug = generateSlug(rawSlug);
    if (!cleanSlug) {
      throw new AppError('Invalid category slug format.', 400);
    }
    const duplicate = await prisma.productCategory.findFirst({
      where: {
        slug: { equals: cleanSlug, mode: 'insensitive' },
        id: { not: id },
      },
    });
    if (duplicate) {
      throw new AppError(`Category slug "${cleanSlug}" is already in use by another category.`, 400);
    }
    data.slug = cleanSlug;
  }

  return prisma.productCategory.update({ where: { id }, data });
};

export const deleteProductCategory = async (id: string) => {
  const existing = await prisma.productCategory.findUnique({
    where: { id },
    include: {
      children: true,
    },
  });
  if (!existing) throw new AppError('Category not found.', 404);

  const childIds = existing.children.map((c) => c.id);
  const allCatIds = [id, ...childIds];

  // 1. Check if category or any of its subcategories has linked ACTIVE products
  const activeProductCount = await prisma.product.count({
    where: {
      categoryId: { in: allCatIds },
      isActive: true,
    },
  });

  if (activeProductCount > 0) {
    throw new AppError(
      `Cannot delete category "${existing.name}". It is currently in use by ${activeProductCount} active product(s). Please reassign or delete those active products first.`,
      400
    );
  }

  // 2. Fallback category for past ordered products
  let fallbackCat = await prisma.productCategory.findFirst({
    where: { slug: 'uncategorized' },
  });
  if (!fallbackCat && !allCatIds.includes('uncategorized')) {
    fallbackCat = await prisma.productCategory.create({
      data: {
        name: 'Uncategorized',
        slug: 'uncategorized',
        description: 'Default category for unassigned products',
      },
    }).catch(() => null);
  }

  // 3. Process products linked to target category or subcategories
  const linkedProducts = await prisma.product.findMany({
    where: { categoryId: { in: allCatIds } },
    select: { id: true, categoryId: true, _count: { select: { orderItems: true } } },
  });

  for (const p of linkedProducts) {
    if (p._count.orderItems === 0) {
      // Un-ordered product: hard delete to clean database
      await prisma.cartItem.deleteMany({ where: { productId: p.id } }).catch(() => null);
      await prisma.wishlistItem.deleteMany({ where: { productId: p.id } }).catch(() => null);
      await prisma.review.deleteMany({ where: { productId: p.id } }).catch(() => null);
      await prisma.product.delete({ where: { id: p.id } }).catch(() => null);
    } else if (fallbackCat && fallbackCat.id !== p.categoryId) {
      // Past ordered product: reassign to fallback category & set inactive
      await prisma.product.update({
        where: { id: p.id },
        data: { categoryId: fallbackCat.id, isActive: false },
      }).catch(() => null);
    }
  }

  // 4. Delete subcategories if any
  if (existing.children.length > 0) {
    for (const child of existing.children) {
      await prisma.productCategory.delete({ where: { id: child.id } }).catch(() => null);
    }
  }

  // 5. Delete target parent category safely
  return prisma.productCategory.delete({ where: { id } });
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const getProducts = async (filters: ProductFilter) => {
  const { page = 1, limit = 12, category, search, minPrice, maxPrice, sort, featured, flashSale } = filters;
  const skip = (page - 1) * limit;

  const where: any = { isActive: true };
  if (category) {
    const catObj = await prisma.productCategory.findFirst({
      where: {
        OR: [
          { slug: { equals: category, mode: 'insensitive' } },
          { name: { equals: category.replace(/-/g, ' '), mode: 'insensitive' } },
          { id: category },
        ],
      },
      include: { children: { select: { id: true } } },
    });

    if (catObj) {
      if (catObj.children && catObj.children.length > 0) {
        const catIds = [catObj.id, ...catObj.children.map((c) => c.id)];
        where.categoryId = { in: catIds };
      } else {
        where.categoryId = catObj.id;
      }
    } else {
      where.OR = [
        { category: { slug: { equals: category, mode: 'insensitive' } } },
        { category: { name: { contains: category, mode: 'insensitive' } } },
      ];
    }
  }
  if (featured)   where.isFeatured = true;
  if (flashSale)  where.isFlashSale = true;
  if (search) {
    const terms = expandSearchTerms(search);
    where.OR = terms.flatMap((term) => [
      { name:        { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { category: { name: { contains: term, mode: 'insensitive' } } },
      { category: { slug: { contains: term, mode: 'insensitive' } } },
    ]);
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  const orderBy: any =
    sort === 'price_asc'  ? { price: 'asc' }       :
    sort === 'price_desc' ? { price: 'desc' }      :
    sort === 'rating'     ? { rating: 'desc' }     :
    sort === 'popular'    ? { totalReviews: 'desc' } :
    { createdAt: 'desc' };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true } },
        seller: {
          select: {
            id: true, name: true,
            sellerProfile: { select: { shopName: true } },
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total };
};

export const getProductById = async (id: string) => {
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { id },
        { slug: id },
      ],
      isActive: true,
    },
    include: {
      category: true,
      brand: true,
      seller: {
        select: {
          id: true, name: true, avatar: true,
          sellerProfile: true,
        },
      },
      reviews: {
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: { select: { reviews: true } },
    },
  });
  if (!product) throw new AppError('Product not found.', 404);
  return product;
};

export const createProduct = async (
  sellerId: string,
  data: any
) => {
  const {
    name, description, price, salePrice, costPrice, discount,
    categoryId, brand, brandId, images, stock, unit, unitAmount, amount,
    isFeatured, isFlashSale, isActive,
    sku, barcode, weight, length, width, height,
    videoUrl, metaTitle, metaDescription, relatedProductIds, relatedProducts
  } = data;
  const slug = data.slug ? `${generateSlug(data.slug)}-${Date.now().toString().slice(-4)}` : `${generateSlug(name || 'product')}-${Date.now()}`;

  // Resolve Brand ID from brand string if provided
  let resolvedBrandId = brandId || null;
  let brandName = typeof brand === 'string' ? brand.trim() : undefined;

  if (!resolvedBrandId && brandName) {
    let b = await prisma.brand.findFirst({
      where: { name: { equals: brandName, mode: 'insensitive' } },
    });
    if (!b) {
      b = await prisma.brand.create({
        data: { name: brandName, slug: generateSlug(brandName) },
      }).catch(() => null);
    }
    if (b) resolvedBrandId = b.id;
  }

  // Resolve Category ID fallback
  let resolvedCategoryId = categoryId;
  if (!resolvedCategoryId) {
    const firstCat = await prisma.productCategory.findFirst();
    if (firstCat) resolvedCategoryId = firstCat.id;
    else {
      const newCat = await prisma.productCategory.create({ data: { name: 'General', slug: `gen-${Date.now()}` } });
      resolvedCategoryId = newCat.id;
    }
  }

  // Resolve related product IDs array
  let relIds: string[] = [];
  if (Array.isArray(relatedProductIds)) {
    relIds = relatedProductIds;
  } else if (Array.isArray(relatedProducts)) {
    relIds = relatedProducts.map((r: any) => typeof r === 'string' ? r : r.id).filter(Boolean);
  }

  const parseAmt = (val: any) => (val !== undefined && val !== null && val !== '') ? Number(val) : null;
  const resolvedUnitAmount = parseAmt(unitAmount) ?? parseAmt(amount);

  return prisma.product.create({
    data: {
      sellerId,
      categoryId: resolvedCategoryId,
      brandId:     resolvedBrandId,
      brandName:   brandName || undefined,
      name:        name || 'Untitled Product',
      slug,
      description: description || '',
      price:       Number(price || 0),
      salePrice:   salePrice ? Number(salePrice) : undefined,
      costPrice:   costPrice ? Number(costPrice) : undefined,
      discount:    Number(discount || 0),
      stock:       Number(stock || 0),
      unit:        unit || 'unit',
      unitAmount:  resolvedUnitAmount,
      isFeatured:  Boolean(isFeatured),
      isFlashSale: Boolean(isFlashSale),
      isActive:    isActive !== undefined ? Boolean(isActive) : true,
      images:      Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600'],
      sku:         sku || undefined,
      barcode:     barcode || undefined,
      weight:      weight ? Number(weight) : undefined,
      length:      length ? Number(length) : undefined,
      width:       width ? Number(width) : undefined,
      height:      height ? Number(height) : undefined,
      videoUrl:    videoUrl || undefined,
      metaTitle:   metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      relatedProductIds: relIds,
    },
    include: {
      category: true,
      brand: true,
    },
  });
};

export const updateProduct = async (
  sellerId: string, productId: string, role: string, data: any
) => {
  const existing = await prisma.product.findUnique({ where: { id: productId } });

  const {
    name, description, price, salePrice, costPrice, discount,
    categoryId, brand, brandId, images, stock, unit, unitAmount, amount,
    isFeatured, isFlashSale, isActive,
    sku, barcode, weight, length, width, height,
    videoUrl, metaTitle, metaDescription, relatedProductIds, relatedProducts
  } = data;
  const updateData: any = {};
  if (name !== undefined)        updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (price !== undefined)       updateData.price = Number(price);
  if (salePrice !== undefined)   updateData.salePrice = salePrice ? Number(salePrice) : null;
  if (costPrice !== undefined)   updateData.costPrice = costPrice ? Number(costPrice) : null;
  if (discount !== undefined)    updateData.discount = Number(discount);
  if (categoryId !== undefined)  updateData.categoryId = categoryId;
  if (sku !== undefined)         updateData.sku = sku || null;
  if (barcode !== undefined)     updateData.barcode = barcode || null;
  if (weight !== undefined)      updateData.weight = weight ? Number(weight) : null;
  if (length !== undefined)      updateData.length = length ? Number(length) : null;
  if (width !== undefined)       updateData.width = width ? Number(width) : null;
  if (height !== undefined)      updateData.height = height ? Number(height) : null;
  if (videoUrl !== undefined)    updateData.videoUrl = videoUrl || null;
  if (metaTitle !== undefined)   updateData.metaTitle = metaTitle || null;
  if (metaDescription !== undefined) updateData.metaDescription = metaDescription || null;

  const rawAmt = unitAmount !== undefined ? unitAmount : amount;
  if (rawAmt !== undefined) {
    updateData.unitAmount = (rawAmt !== null && rawAmt !== '') ? Number(rawAmt) : null;
  }

  if (Array.isArray(relatedProductIds)) {
    updateData.relatedProductIds = relatedProductIds;
  } else if (Array.isArray(relatedProducts)) {
    updateData.relatedProductIds = relatedProducts.map((r: any) => typeof r === 'string' ? r : r.id).filter(Boolean);
  }

  // Resolve Brand ID
  if (brandId !== undefined) updateData.brandId = brandId || null;
  else if (brand && typeof brand === 'string') {
    const cleanBrandName = brand.trim();
    if (cleanBrandName) {
      updateData.brandName = cleanBrandName;
      let b = await prisma.brand.findFirst({
        where: { name: { equals: cleanBrandName, mode: 'insensitive' } },
      });
      if (!b) {
        b = await prisma.brand.create({
          data: { name: cleanBrandName, slug: generateSlug(cleanBrandName) },
        }).catch(() => null);
      }
      if (b) updateData.brandId = b.id;
    }
  }

  if (images !== undefined)      updateData.images = Array.isArray(images) ? images : [];
  if (stock !== undefined)       updateData.stock = Number(stock);
  if (unit !== undefined)        updateData.unit = unit;
  if (isFeatured !== undefined)  updateData.isFeatured = Boolean(isFeatured);
  if (isFlashSale !== undefined) updateData.isFlashSale = Boolean(isFlashSale);
  if (isActive !== undefined)    updateData.isActive = Boolean(isActive);

  if (existing) {
    return prisma.product.update({ where: { id: productId }, data: updateData });
  } else {
    return createProduct(sellerId, { id: productId, ...data });
  }
};

export const deleteProduct = async (sellerId: string, productId: string, role: string) => {
  const existing = await prisma.product.findUnique({ where: { id: productId }, include: { category: true } });
  if (!existing) throw new AppError('Product not found.', 404);

  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  if (!isAdmin && existing.sellerId && existing.sellerId !== sellerId) {
    if (existing.category?.slug !== 'uncategorized') {
      throw new AppError('Unauthorized to delete this product.', 403);
    }
  }

  // Permanently clean up relations and hard-delete product from database
  await prisma.cartItem.deleteMany({ where: { productId } }).catch(() => null);
  await prisma.wishlistItem.deleteMany({ where: { productId } }).catch(() => null);
  await prisma.review.deleteMany({ where: { productId } }).catch(() => null);
  await prisma.orderItem.deleteMany({ where: { productId } }).catch(() => null);

  return prisma.product.delete({ where: { id: productId } });
};

export const getSellerProducts = async (sellerId: string) => {
  const user = await prisma.user.findUnique({ where: { id: sellerId }, select: { role: true } });
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // If admin show all, if seller show seller's products OR uncategorized/seed items so they can be deleted
  const where: any = isAdmin ? {} : {
    OR: [
      { sellerId },
      { category: { slug: 'uncategorized' } },
    ],
  };

  return prisma.product.findMany({
    where,
    include: {
      category: { select: { name: true, slug: true } },
      _count: { select: { reviews: true, orderItems: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// ─── Stock Adjustment ────────────────────────────────────────────────────────

export const adjustStock = async (
  sellerId: string, productId: string,
  adjustment?: number, stock?: number, role?: string
) => {
  const where: any = { id: productId };
  if (role !== 'ADMIN') where.sellerId = sellerId;

  const existing = await prisma.product.findFirst({ where });
  if (!existing) throw new AppError('Product not found.', 404);

  // If absolute stock is provided, set it directly
  // Otherwise apply the relative adjustment (+/-)
  const newStock = stock !== undefined
    ? Math.max(0, stock)
    : Math.max(0, existing.stock + (adjustment ?? 0));

  return prisma.product.update({
    where: { id: productId },
    data:  { stock: newStock },
    include: { category: { select: { name: true } } },
  });
};

export const bulkDeleteProducts = async (sellerId: string, productIds: string[], role: string) => {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return { count: 0 };
  }

  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  const whereCondition: any = isAdmin
    ? { id: { in: productIds } }
    : {
        id: { in: productIds },
        OR: [
          { sellerId },
          { category: { slug: 'uncategorized' } },
        ],
      };

  const productsToDelete = await prisma.product.findMany({
    where: whereCondition,
    select: { id: true }
  });

  const validIds = productsToDelete.map(p => p.id);
  if (validIds.length === 0) return { count: 0 };

  await prisma.cartItem.deleteMany({ where: { productId: { in: validIds } } }).catch(() => null);
  await prisma.wishlistItem.deleteMany({ where: { productId: { in: validIds } } }).catch(() => null);
  await prisma.review.deleteMany({ where: { productId: { in: validIds } } }).catch(() => null);
  await prisma.orderItem.deleteMany({ where: { productId: { in: validIds } } }).catch(() => null);

  const result = await prisma.product.deleteMany({
    where: { id: { in: validIds } }
  });

  return { count: result.count };
};

const getSmartProductImage = (name: string, customImg?: string, categoryName?: string): string => {
  if (customImg && typeof customImg === 'string' && customImg.trim() && !customImg.includes('undefined')) {
    const clean = customImg.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
      return clean;
    }
  }

  const t = `${name || ''} ${categoryName || ''}`.toLowerCase();

  // 1. Spices & Seasoning
  if (/mori|chilli|chili|মরিচ|halud|হলুদ|jira|জিরা|dhonia|ধনিয়া|masala|মসলা|curry|spice|radhuni|pran|aci/i.test(t)) {
    return 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80';
  }

  // 2. Oil & Ghee
  if (/oil|tel|তেল|সয়াবিন|সরিষা|ghee|ঘি|mustard|rupchanda|teer|parachute|soyabean|fortune|bashundhara/i.test(t)) {
    return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80';
  }

  // 3. Rice, Flour & Grains
  if (/ময়দা|ময়দা|আটা|চাল|ধান|সুজি|flour|atta|maida|rice|grain|nazir|miniket|chinigura|basmati|suji|kalizira/i.test(t)) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80';
  }

  // 4. Fish & Seafood
  if (/মাছ|ইলিশ|রুই|কাতলা|চিংড়ি|fish|ilish|hilsha|prawn|shrimp|rui|katla|seafood|catfish|pangash/i.test(t)) {
    return 'https://images.unsplash.com/photo-1534942519507-769d4679447d?w=600&auto=format&fit=crop&q=80';
  }

  // 5. Meat & Poultry
  if (/মাংস|মুরগি|গরু|খাসি|chicken|meat|beef|mutton|poultry|broiler|cock|layer/i.test(t)) {
    return 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&auto=format&fit=crop&q=80';
  }

  // 6. Milk, Egg & Dairy
  if (/দুধ|ডিম|দই|মাখন|পনির|milk|egg|dudh|dima|dairy|butter|cheese|curd|yogurt|aarong|dano|nido|horlicks|diploma|cowhead/i.test(t)) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80';
  }

  // 7. Cleaning & Dishwash
  if (/vim|liquid|soap|clean|wash|harpic|wheel|rin|surf|tik|লিকুইড|ডিশওয়াশ|সাবান|ডিটারজেন্ট|ক্লিনিং/i.test(t)) {
    return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80';
  }

  // 8. Personal Care & Cosmetics
  if (/shampoo|lotion|paste|cream|perfume|sunsilk|lux|dettol|meril|dove|facewash|pepsodent|closeup|savlon|শ্যাম্পু|লোশন|পেস্ট|ক্রিম|বিউটি|care/i.test(t)) {
    return 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80';
  }

  // 9. Baby Care & Diapers
  if (/baby|diaper|pampers|molfix|cerelac|child|kid|বাচ্চা|ডায়াপার|টয়|kids|huggies|nappies/i.test(t)) {
    return 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&auto=format&fit=crop&q=80';
  }

  // 10. Fruits & Vegetables
  if (/potato|onion|tomato|fruit|apple|mango|banana|veg|potato|chili|cucumber|garlic|ginger|আলু|পেঁয়াজ|টমেটো|ফল|আপেল|আম|কলা|শাক|সবজি|রশুন|আদা/i.test(t)) {
    return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop&q=80';
  }

  // 11. Snacks, Biscuits & Noodles
  if (/biscuit|chanachur|noodle|chip|cake|snack|maggi|cocola|pasta|wafer|toast|bormi|বিস্কুট|চানাচুর|নুডলস|চিপস|কেক|স্ন্যাক্স|টোস্ট/i.test(t)) {
    return 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80';
  }

  // 12. Tea, Coffee & Beverages
  if (/tea|coffee|juice|drink|beverage|cola|water|mojo|clemon|speed|7up|pepsi|sprite|fanta|tang|চা|কফি|জুস|পানি|পানীয়/i.test(t)) {
    return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80';
  }

  // 13. Household & Electronics
  if (/light|fan|battery|electric|appliance|hardware|tool|switch|socket|bulb|লাইট|ফ্যান|ব্যাটারি|ইলেকট্রনিক্স/i.test(t)) {
    return 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&auto=format&fit=crop&q=80';
  }

  // 14. Stationeries & Books
  if (/pen|paper|notebook|book|stationery|pencil|eraser|khata|কলম|কাগজ|বই|খাতা/i.test(t)) {
    return 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80';
  }

  // 15. Seed-based dynamic Unsplash fallback images (Ensures distinct images for any unknown product name!)
  const seed = Array.from(t).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fallbackImages = [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506617429158-171e54d45840?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579113800032-c38bd7725844?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=600&auto=format&fit=crop&q=80',
  ];

  return fallbackImages[seed % fallbackImages.length];
};

export const bulkImportProducts = async (sellerId: string, items: any[]) => {
  if (!Array.isArray(items) || items.length === 0) {
    return { count: 0, categoriesCreated: 0, brandsCreated: 0 };
  }

  const categoryCache = new Map<string, string>();
  const brandCache = new Map<string, { id: string; name: string }>();
  let categoriesCreated = 0;
  let brandsCreated = 0;

  // Pre-fetch categories & brands dynamically
  const categories = await prisma.productCategory.findMany();
  for (const c of categories) {
    categoryCache.set(c.name.toLowerCase(), c.id);
    if (c.slug) categoryCache.set(c.slug.toLowerCase(), c.id);
  }

  const brands = await prisma.brand.findMany();
  for (const b of brands) {
    brandCache.set(b.name.toLowerCase(), { id: b.id, name: b.name });
    if (b.slug) brandCache.set(b.slug.toLowerCase(), { id: b.id, name: b.name });
  }

  let defaultCatId = categoryCache.get('daily essentials') || categoryCache.get('groceries') || Array.from(categoryCache.values())[0];
  if (!defaultCatId) {
    const newCat = await prisma.productCategory.create({
      data: {
        name: 'Daily Essentials',
        slug: 'daily-essentials',
        description: 'Fresh daily essentials & groceries',
      },
    });
    defaultCatId = newCat.id;
    categoryCache.set('daily essentials', newCat.id);
  }

  const newProductsPayload: any[] = [];

  for (const row of items) {
    // Smart Row Keys Extractor
    let rawName = '';
    const nameCandidateKeys = [
      'Product Name', 'ProductName', 'product_name', 'Item Name', 'ItemName', 'item_name',
      'Name', 'name', 'Title', 'title', 'Product', 'product', 'Item', 'item',
      'Description', 'description', 'Details', 'details',
      'পণ্যের নাম', 'পণ্য', 'নাম', 'আইটেম', 'বিবরণ'
    ];

    for (const key of nameCandidateKeys) {
      if (row[key] && String(row[key]).trim().length > 0) {
        const val = String(row[key]).trim();
        // Skip if val is pure short unit like '1pcs', '1ltr', '1050ml'
        if (!/^\d+\s*(pcs|pc|ltr|ml|g|kg|gm|pack|bottle|box|set)$/i.test(val) && val.length > 1) {
          rawName = val;
          break;
        }
      }
    }

    if (!rawName) {
      for (const [k, v] of Object.entries(row)) {
        if (typeof v === 'string' && v.trim().length > 1) {
          const val = v.trim();
          if (!/^\d+\s*(pcs|pc|ltr|ml|g|kg|gm|pack|bottle|box|set)$/i.test(val)) {
            rawName = val;
            break;
          }
        }
      }
    }

    if (!rawName) {
      rawName = String(row.name || row.title || row['Product Name'] || row['Item Name'] || '').trim();
    }

    if (!rawName) continue;

    let rawUnit = 'unit';
    const unitCandidateKeys = ['Unit', 'unit', 'Pack Size', 'pack_size', 'Variant', 'variant', 'Weight', 'weight', 'একক', 'পরিমাপ'];
    for (const key of unitCandidateKeys) {
      if (row[key] && String(row[key]).trim()) {
        rawUnit = String(row[key]).trim();
        break;
      }
    }

    let rawCat = '';
    const catCandidateKeys = ['Category', 'category', 'Main Category', 'Category Name', 'category_name', 'ক্যাটাগরি'];
    for (const key of catCandidateKeys) {
      if (row[key] && String(row[key]).trim()) {
        rawCat = String(row[key]).trim();
        break;
      }
    }

    let rawSubCat = '';
    const subCatCandidateKeys = ['SubCategory', 'subcategory', 'Sub Category', 'sub_category', 'সাব ক্যাটাগরি', 'সাবক্যাটাগরি'];
    for (const key of subCatCandidateKeys) {
      if (row[key] && String(row[key]).trim()) {
        rawSubCat = String(row[key]).trim();
        break;
      }
    }

    let rawBrand = '';
    const brandCandidateKeys = ['Brand', 'brand', 'Brand Name', 'brand_name', 'ব্র্যান্ড'];
    for (const key of brandCandidateKeys) {
      if (row[key] && String(row[key]).trim()) {
        rawBrand = String(row[key]).trim();
        break;
      }
    }

    let price = 100;
    const priceCandidateKeys = ['Price', 'price', 'MRP', 'mrp', 'Rate', 'rate', 'Selling Price', 'selling_price', 'মূল্য', 'দাম'];
    for (const key of priceCandidateKeys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        const p = Number(row[key]);
        if (!isNaN(p) && p > 0) {
          price = p;
          break;
        }
      }
    }

    let stock = 50;
    const stockCandidateKeys = ['Stock', 'stock', 'Quantity', 'quantity', 'Qty', 'qty', 'পরিমাণ', 'স্টক'];
    for (const key of stockCandidateKeys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        const s = Number(row[key]);
        if (!isNaN(s)) {
          stock = s;
          break;
        }
      }
    }

    let catId = defaultCatId;

    // 1. Process Main Category
    if (rawCat) {
      const cKey = rawCat.toLowerCase();
      if (categoryCache.has(cKey)) {
        catId = categoryCache.get(cKey)!;
      } else {
        const slug = rawCat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        try {
          const createdCat = await prisma.productCategory.create({
            data: { name: rawCat, slug: `${slug}-${Math.floor(Math.random() * 899 + 100)}` },
          });
          catId = createdCat.id;
          categoryCache.set(cKey, createdCat.id);
          categoriesCreated++;
        } catch {
          catId = defaultCatId;
        }
      }
    }

    // 2. Process SubCategory (linked to Main Category)
    if (rawSubCat) {
      const subKey = `${rawSubCat.toLowerCase()}::${catId}`;
      if (categoryCache.has(subKey)) {
        catId = categoryCache.get(subKey)!;
      } else {
        const slug = rawSubCat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        try {
          const createdSubCat = await prisma.productCategory.create({
            data: {
              name: rawSubCat,
              slug: `${slug}-${Math.floor(Math.random() * 899 + 100)}`,
              parentId: catId,
            },
          });
          catId = createdSubCat.id;
          categoryCache.set(subKey, createdSubCat.id);
          categoriesCreated++;
        } catch {}
      }
    }

    // 3. Process Brand (Auto Create Brand)
    let brandId: string | undefined = undefined;
    let brandName: string | undefined = undefined;

    if (rawBrand) {
      const bKey = rawBrand.toLowerCase();
      if (brandCache.has(bKey)) {
        const cached = brandCache.get(bKey)!;
        brandId = cached.id;
        brandName = cached.name;
      } else {
        const bSlug = rawBrand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        try {
          const createdBrand = await prisma.brand.create({
            data: {
              name: rawBrand,
              slug: `${bSlug}-${Math.floor(Math.random() * 899 + 100)}`,
            },
          });
          brandId = createdBrand.id;
          brandName = createdBrand.name;
          brandCache.set(bKey, { id: createdBrand.id, name: createdBrand.name });
          brandsCreated++;
        } catch {}
      }
    }

    const discount = Number(row.discount || row.Discount || 0);
    const description = String(row.description || row.Description || `High-quality ${rawName} sourced directly for DOHS marketplace.`).trim();
    const customImg = row.image || row.Image || (Array.isArray(row.images) ? row.images[0] : '');

    const imgUrl = getSmartProductImage(rawName, customImg, rawCat);
    const baseSlug = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uniqueSlug = `${baseSlug || 'prod'}-${Math.floor(Math.random() * 89999 + 10000)}`;
    const sku = String(row.sku || row.SKU || `DH-${baseSlug.slice(0, 8).toUpperCase()}-${Math.floor(Math.random() * 899 + 100)}`);
    const barcode = row.barcode || row.Barcode ? String(row.barcode || row.Barcode) : undefined;

    newProductsPayload.push({
      sellerId,
      categoryId: catId,
      brandId: brandId || null,
      brandName: brandName || (rawBrand || null),
      sku,
      barcode,
      name: rawName,
      slug: uniqueSlug,
      description,
      price: Math.max(1, price),
      discount: Math.max(0, discount),
      stock: Math.max(0, stock),
      unit: rawUnit,
      images: [imgUrl],
      isActive: false, // Default to DRAFT as requested!
      rating: 4.8,
      totalReviews: Math.floor(Math.random() * 15 + 5),
    });
  }

  if (newProductsPayload.length === 0) {
    return { count: 0, categoriesCreated: 0, brandsCreated: 0 };
  }

  // Insert in batches of 100 for maximum performance
  let totalInserted = 0;
  const batchSize = 100;
  for (let i = 0; i < newProductsPayload.length; i += batchSize) {
    const batch = newProductsPayload.slice(i, i + batchSize);
    const created = await prisma.product.createMany({
      data: batch,
      skipDuplicates: true,
    });
    totalInserted += created.count;
  }

  return { count: totalInserted, categoriesCreated, brandsCreated };
};

export const bulkPublishProducts = async (sellerId: string, productIds: string[], role: string) => {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return { count: 0 };
  }

  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const whereCondition: any = isAdmin
    ? { id: { in: productIds } }
    : { id: { in: productIds }, sellerId };

  const result = await prisma.product.updateMany({
    where: whereCondition,
    data: { isActive: true },
  });

  return { count: result.count };
};



