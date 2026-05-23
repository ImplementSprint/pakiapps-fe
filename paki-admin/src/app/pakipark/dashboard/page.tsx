'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import PakiParkDashboard from '@/modules/pages/pakipark/DashboardPage';

export default function Page() {
  return (
    <ProtectedRoute app="pakipark">
      <PakiParkDashboard />
    </ProtectedRoute>
  );
}
