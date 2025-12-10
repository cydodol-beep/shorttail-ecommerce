import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Helper function to implement timeout for async operations
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ) as Promise<T>
  ]);
}

export async function POST() {
  try {
    const supabase = await createClient();

    // Sign out from Supabase with timeout to prevent hanging
    await withTimeout(supabase.auth.signOut(), 10000);

    // Clear all auth cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Remove Supabase auth cookies
    allCookies.forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        cookieStore.delete(cookie.name);
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Signout error:', error);
    return NextResponse.json({ success: false, error: 'Failed to sign out' }, { status: 500 });
  }
}
