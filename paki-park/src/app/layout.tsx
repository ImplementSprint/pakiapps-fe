import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'PakiPark — Smart Parking Reservation',
  description: 'Reserve your parking spot in advance with PakiPark. Convenient, secure, and hassle-free parking management system for the Philippines.',
  keywords: ['PakiPark', 'parking', 'reservation', 'Philippines', 'smart parking'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
