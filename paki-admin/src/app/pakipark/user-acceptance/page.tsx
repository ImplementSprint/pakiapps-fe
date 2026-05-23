'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import OperationalFeaturePage from '@/modules/pages/pakipark/OperationalFeaturePage';

export default function Page() {
  return (
    <ProtectedRoute app="pakipark">
      <OperationalFeaturePage feature="user-acceptance" />
    </ProtectedRoute>
  );
}
