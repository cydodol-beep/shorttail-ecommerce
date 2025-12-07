'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Admin and Kasir have their own layouts with custom headers
  const isAdminRoute = pathname?.startsWith('/admin');
  const isKasirRoute = pathname?.startsWith('/kasir');
  const hasCustomLayout = isAdminRoute || isKasirRoute;

  if (hasCustomLayout) {
    // Return children directly - admin/kasir layouts handle their own UI
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-brown-50">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}
