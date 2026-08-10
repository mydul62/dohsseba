import React from 'react';
import { homepageService } from '@/services/homepageService';
import { ProductService } from '@/services/product';
import { HeroBanner } from '@/components/home/HeroBanner';
import { PopularCategoriesSection } from '@/components/home/PopularCategoriesSection';
import { ServiceCategoriesGrid } from '@/components/home/ServiceCategoriesGrid';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { DailyDealsSection } from '@/components/home/DailyDealsSection';
import { ForYouProductsSection } from '@/components/home/ForYouProductsSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { PageTransition } from '@/components/ui/PageTransition';

export default async function HomePage() {
  // Fetch homepage data and featured products server-side in parallel
  const [homepageData, featuredData] = await Promise.all([
    homepageService.getFullHomepageDataServer(),
    ProductService.getProductsServer({ featured: true, limit: 10 }),
  ]);

  return (
    <PageTransition className="w-full">
      <HeroBanner initialData={homepageData} />
      <PopularCategoriesSection />
      <ServiceCategoriesGrid />
      <FeaturedProductsSection initialProducts={featuredData?.products || []} />
      <DailyDealsSection />
      <ForYouProductsSection />
      <HowItWorksSection />
      <TestimonialsSection />
    </PageTransition>
  );
}
