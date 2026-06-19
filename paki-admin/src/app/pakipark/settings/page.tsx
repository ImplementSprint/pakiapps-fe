'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import PakiParkSettings from '@/modules/pages/pakipark/SettingsPage';

export default function Page() {
  return (
    <ProtectedRoute app="pakipark">
      <PakiParkSettings />
    </ProtectedRoute>
  );
}
