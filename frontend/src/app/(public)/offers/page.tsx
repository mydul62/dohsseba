import React from 'react';
import { GetAllCoupons } from '@/services/coupon';
import { OffersClient } from '@/components/offers/OffersClient';

export default async function OffersPage() {
  const res = await GetAllCoupons();
  const coupons = res?.success && Array.isArray(res.data) ? res.data : [];

  return <OffersClient initialCoupons={coupons} />;
}
