import React from 'react';
import ProfileManagementContent from '@/components/dashboard/ProfileManagementContent';

export const metadata = {
  title: 'Admin Profile & Security | Admin Dashboard | DOHS Sheba',
  description: 'Manage administrator profile details, bio, avatar, and password credentials.',
};

export default function AdminProfilePage() {
  return <ProfileManagementContent />;
}
