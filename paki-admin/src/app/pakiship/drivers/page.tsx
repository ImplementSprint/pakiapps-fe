'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import PakiShipDrivers from '@/modules/pages/pakiship/DriversPage';

export default function Page() {
  return (
    <ProtectedRoute app="pakiship">
      <PakiShipDrivers />
    </ProtectedRoute>
  );
}
