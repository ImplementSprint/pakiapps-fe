'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import PakiShipAnalytics from '@/modules/pages/pakiship/AnalyticsPage';

export default function Page() {
  return (
    <ProtectedRoute app="pakiship">
      <PakiShipAnalytics />
    </ProtectedRoute>
  );
}
