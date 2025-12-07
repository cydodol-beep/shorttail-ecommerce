import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    
    // Format phone variants for lookup
    const phoneE164 = phone.startsWith('+') ? phone : `+${phone}`;
    const phoneWithoutPlus = phone.replace(/^\+/, '');
    const phoneWithZero = phoneWithoutPlus.startsWith('62') 
      ? '0' + phoneWithoutPlus.substring(2) 
      : phone;

    // Find profile by phone number (check multiple formats)
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id')
      .or(`user_phoneno.eq.${phoneE164},user_phoneno.eq.${phoneWithoutPlus},user_phoneno.eq.${phoneWithZero}`)
      .single();

    if (!profile) {
      return NextResponse.json({ email: null });
    }

    // Get the auth user to find their email
    const { data: authUser } = await adminClient.auth.admin.getUserById(profile.id);

    if (!authUser?.user?.email) {
      return NextResponse.json({ email: null });
    }

    return NextResponse.json({ email: authUser.user.email });
  } catch (error) {
    console.error('Error looking up email:', error);
    return NextResponse.json({ email: null });
  }
}
