'use client';

import { ProtectedRoute } from '@/modules/components/ProtectedRoute';
import PakiShipSettings from '@/modules/pages/pakiship/SettingsPage';

export default function Page() {
  return (
    <ProtectedRoute app="pakiship">
      <PakiShipSettings />
    </ProtectedRoute>
  );
}
