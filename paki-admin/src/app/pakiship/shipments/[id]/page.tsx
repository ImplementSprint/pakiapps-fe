'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import ShipmentDetailPage from '@/modules/pages/pakiship/shipments/[id]/page';

export default function Page() {
  return (
    <ProtectedRoute app="pakiship">
      <ShipmentDetailPage />
    </ProtectedRoute>
  );
}
