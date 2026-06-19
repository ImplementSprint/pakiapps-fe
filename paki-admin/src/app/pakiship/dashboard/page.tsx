'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import PakiShipDashboard from '@/modules/pages/pakiship/DashboardPage';

export default function Page() {
  return (
    <ProtectedRoute app="pakiship">
      <PakiShipDashboard />
    </ProtectedRoute>
  );
}
