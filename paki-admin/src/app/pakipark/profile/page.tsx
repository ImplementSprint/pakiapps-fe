'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import PakiParkProfile from '@/modules/pages/pakipark/ProfilePage';

export default function Page() {
  return (
    <ProtectedRoute app="pakipark">
      <PakiParkProfile />
    </ProtectedRoute>
  );
}
