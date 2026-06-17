'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import DriverDetailPage from '@/modules/pages/pakiship/DriverDetailPage';

export default function Page({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute app="pakiship">
      <DriverDetailPage driverId={params.id} />
    </ProtectedRoute>
  );
}
