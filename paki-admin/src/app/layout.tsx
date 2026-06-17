'use client';

import type { ReactNode } from 'react';

import { AuthProvider } from '@/modules/contexts/AuthContext';
import { Toaster } from 'sonner';
import '@/styles/index.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
