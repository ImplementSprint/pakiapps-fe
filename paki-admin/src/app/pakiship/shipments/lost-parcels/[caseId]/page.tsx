'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import LostParcelCaseDetailPage from '@/modules/pages/pakiship/LostParcelCaseDetailPage';

export default function Page({ params }: { params: { caseId: string } }) {
  return (
    <ProtectedRoute app="pakiship">
      <LostParcelCaseDetailPage caseId={params.caseId} />
    </ProtectedRoute>
  );
}
