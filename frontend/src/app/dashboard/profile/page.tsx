import React from 'react';
import ProfileManagementContent from '@/components/dashboard/ProfileManagementContent';

export const metadata = {
  title: 'My Profile & Security | DOHS Sheba',
  description: 'Manage profile details, bio, avatar, and password credentials.',
};

export default function ProfilePage() {
  return <ProfileManagementContent />;
}
