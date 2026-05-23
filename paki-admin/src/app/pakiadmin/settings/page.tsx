'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import AdminSettingsPage from '@/modules/pages/pakiadmin/AdminSettingsPage';

export default function Page() {
  return (
    <ProtectedRoute app="pakiadmin" requiredRole="super-admin">
      <AdminSettingsPage />
    </ProtectedRoute>
  );
}
