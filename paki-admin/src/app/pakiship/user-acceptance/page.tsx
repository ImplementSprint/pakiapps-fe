'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import PakiShipUserAcceptance from '@/modules/pages/pakiship/UserAcceptancePage';

export default function Page() {
  return (
    <ProtectedRoute app="pakiship">
      <PakiShipUserAcceptance />
    </ProtectedRoute>
  );
}
