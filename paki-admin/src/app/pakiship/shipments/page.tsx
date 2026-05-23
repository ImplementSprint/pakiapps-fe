'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import PakiShipShipments from '@/modules/pages/pakiship/ShipmentsPage';

export default function Page() {
  return (
    <ProtectedRoute app="pakiship">
      <PakiShipShipments />
    </ProtectedRoute>
  );
}
