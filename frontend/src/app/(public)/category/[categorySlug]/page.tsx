import React from 'react';
import { fetchServerApi } from '@/lib/server-api';
import { CategoryPageClient } from '@/components/shopping/CategoryPageClient';

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const safeSlug = categorySlug || '';

  // Fetch Category info & Products on the server in parallel
  const [catRes, prodRes] = await Promise.all([
    fetchServerApi<any>(`/product-categories/slug/${encodeURIComponent(safeSlug)}`),
    fetchServerApi<any>(`/products?category=${encodeURIComponent(safeSlug)}&limit=100`),
  ]);

  const initialCategory = catRes?.success && catRes.data ? catRes.data : null;
  const initialProducts = prodRes?.success && Array.isArray(prodRes.data)
    ? prodRes.data
    : (prodRes?.success && Array.isArray(prodRes.data?.products) ? prodRes.data.products : []);

  return (
    <CategoryPageClient
      categorySlug={safeSlug}
      initialCategory={initialCategory}
      initialProducts={initialProducts}
    />
  );
}
