'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import PakiParkReservations from '@/modules/pages/pakipark/ReservationsPage';

export default function Page() {
  return (
    <ProtectedRoute app="pakipark">
      <PakiParkReservations />
    </ProtectedRoute>
  );
}
