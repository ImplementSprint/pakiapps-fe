'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import SuperAdminDashboardPage from '@/modules/pages/pakiadmin/SuperAdminDashboardPage';

export default function Page() {
  return (
    <ProtectedRoute app="pakiadmin" requiredRole="super-admin">
      <SuperAdminDashboardPage />
    </ProtectedRoute>
  );
}
