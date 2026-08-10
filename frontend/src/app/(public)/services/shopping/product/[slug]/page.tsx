import React from 'react';
import { ProductService } from '@/services/product';
import { getProductBySlugOrId } from '@/constants/products';
import { ProductDetailClient } from '@/components/shopping/ProductDetailClient';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const serverProduct = await ProductService.getProductBySlugServer(slug);
  const initialProduct = serverProduct || getProductBySlugOrId(slug);

  return (
    <div className="py-8 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 w-full max-w-[1720px] mx-auto space-y-8">
      <ProductDetailClient product={initialProduct} slug={slug} />
    </div>
  );
}
