import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
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
