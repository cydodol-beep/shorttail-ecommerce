'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import UpdatePasswordForm from '@/components/UpdatePasswordForm';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get the type parameter from URL
    const type = searchParams.get('type');

    // If this is a recovery request, allow the user to update their password
    if (type === 'recovery') {
      setIsValidSession(true);
      return;
    }

    // Otherwise, check if there's a valid session
    const checkSession = async () => {
      const supabase = createClient();

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        // If no valid session and not a recovery request, redirect to login
        router.push('/login');
        return;
      }

      // If we have a valid session, allow the user to update their password
      setIsValidSession(true);
    };

    checkSession();
  }, [searchParams, router]);

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