'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import UpdatePasswordForm from '@/components/UpdatePasswordForm';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        // If no valid session, redirect to login
        router.push('/login');
        return;
      }
      
      // If we have a valid session, allow the user to update their password
      setIsValidSession(true);
    };

    checkSession();
  }, [router]);

  if (isValidSession === null) {
    // Loading state while checking session
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ff911d]"></div>
          <p className="mt-2 text-[#006d77]">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    // This shouldn't happen due to redirect in useEffect, but just in case
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <UpdatePasswordForm />
      </div>
    </div>
  );
}