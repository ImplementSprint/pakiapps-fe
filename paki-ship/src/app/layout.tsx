import type { Metadata } from "next";
import "../features/globals.css";

export const metadata: Metadata = {
  title: "PakiSHIP",
  description: "PakiSHIP logistics platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
