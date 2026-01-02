import { ReactNode } from 'react';
import { AdminLayout } from '@/components/admin/layout/admin-layout';

export default function TempCustDataLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}