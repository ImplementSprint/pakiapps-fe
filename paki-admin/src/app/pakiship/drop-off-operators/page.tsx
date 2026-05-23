'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import PakiShipDropOffOperators from '@/modules/pages/pakiship/DropOffOperatorsPage';

export default function Page() {
  return (
    <ProtectedRoute app="pakiship">
      <PakiShipDropOffOperators />
    </ProtectedRoute>
  );
}
