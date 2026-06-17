'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import PakiShipTracking from '@/modules/pages/pakiship/TrackingPage';

export default function Page() {
  return (
    <ProtectedRoute app="pakiship">
      <PakiShipTracking />
    </ProtectedRoute>
  );
}
