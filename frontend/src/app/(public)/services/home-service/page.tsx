import React from 'react';
import { GetAllHomeServices } from '@/services/homeService';
import { HomeServiceOverviewClient } from '@/components/services/HomeServiceOverviewClient';

export default async function HomeServiceOverviewPage() {
  const data = await GetAllHomeServices();
  let services: any[] = [];
  if (data?.success && Array.isArray(data.data?.services)) {
    services = data.data.services;
  } else if (Array.isArray(data?.data)) {
    services = data.data;
  }

  return <HomeServiceOverviewClient initialServices={services} />;
}
