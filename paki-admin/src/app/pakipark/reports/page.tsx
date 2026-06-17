'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import PakiParkReports from '@/modules/pages/pakipark/ReportsPage';

export default function Page() {
  return (
    <ProtectedRoute app="pakipark">
      <PakiParkReports />
    </ProtectedRoute>
  );
}
