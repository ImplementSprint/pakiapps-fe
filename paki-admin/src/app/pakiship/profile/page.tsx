'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import PakiShipProfile from '@/modules/pages/pakiship/ProfilePage';

export default function Page() {
  return (
    <ProtectedRoute app="pakiship">
      <PakiShipProfile />
    </ProtectedRoute>
  );
}
