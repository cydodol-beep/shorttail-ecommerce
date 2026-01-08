'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the /about page
    router.push('/about');
  }, [router]);

  // Render nothing since we're redirecting
  return null;
}