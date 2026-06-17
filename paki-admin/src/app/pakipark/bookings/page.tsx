'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import PakiParkBookings from '@/modules/pages/pakipark/BookingsPage';

export default function Page() {
  return (
    <ProtectedRoute app="pakipark">
      <PakiParkBookings />
    </ProtectedRoute>
  );
}
