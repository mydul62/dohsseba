import React from 'react';
import { CheckoutClient } from '@/components/shopping/CheckoutClient';

export const dynamic = 'force-dynamic';

export default function DirectCheckoutPage() {
  return (
    <div className="py-10 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 w-full max-w-[1720px] mx-auto space-y-8">
      <CheckoutClient />
    </div>
  );
}
