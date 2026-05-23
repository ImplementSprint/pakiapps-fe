'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import { Navigate } from '@/modules/lib/router';

export default function Page() {
  return (
    <ProtectedRoute app="pakiadmin">
      <Navigate to="/pakiadmin/super-admin" replace />
    </ProtectedRoute>
  );
}
