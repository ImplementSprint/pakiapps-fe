'use client';

import { Suspense } from 'react';
import PakiAdminResetPassword from '@/modules/pages/pakiadmin/ResetPasswordPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PakiAdminResetPassword />
    </Suspense>
  );
}
