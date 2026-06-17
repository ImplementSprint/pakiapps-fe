'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import LostParcelCasesPage from '@/modules/pages/pakiship/LostParcelCasesPage';

export default function Page() {
  return (
    <ProtectedRoute app="pakiship">
      <LostParcelCasesPage />
    </ProtectedRoute>
  );
}
