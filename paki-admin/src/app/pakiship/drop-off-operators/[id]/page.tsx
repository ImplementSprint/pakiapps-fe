'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import DropOffOperatorDetailPage from '@/modules/pages/pakiship/DropOffOperatorDetailPage';

export default function Page({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute app="pakiship">
      <DropOffOperatorDetailPage operatorId={params.id} />
    </ProtectedRoute>
  );
}
