import React from 'react';
import { HeroBanner } from '@/components/home/HeroBanner';
import { PopularCategoriesSection } from '@/components/home/PopularCategoriesSection';
import { ServiceCategoriesGrid } from '@/components/home/ServiceCategoriesGrid';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { DailyDealsSection } from '@/components/home/DailyDealsSection';
import { ForYouProductsSection } from '@/components/home/ForYouProductsSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { PageTransition } from '@/components/ui/PageTransition';

export default function HomePage() {
  return (
    <PageTransition className="w-full">
      <HeroBanner />
      <PopularCategoriesSection />
      <ServiceCategoriesGrid />
      <FeaturedProductsSection />
      <DailyDealsSection />
      <ForYouProductsSection />
      <HowItWorksSection />
      <TestimonialsSection />
    </PageTransition>
  );
}
