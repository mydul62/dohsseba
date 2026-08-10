import React from 'react';
import ProfileManagementContent from '@/components/dashboard/ProfileManagementContent';

export const metadata = {
  title: 'Seller Profile & Security | Seller Dashboard | DOHS Sheba',
  description: 'Manage seller profile details, bio, avatar, and password credentials.',
};

export default function SellerProfilePage() {
  return <ProfileManagementContent />;
}
