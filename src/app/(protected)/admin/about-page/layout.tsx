import { ReactNode } from 'react';

export default function AboutPageLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>{children}</>
  );
}