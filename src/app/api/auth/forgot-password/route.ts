import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return Response.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Format phone to E.164 format
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('62')) {
      formattedPhone = '62' + formattedPhone;
    }

    const supabase = await createClient();
    const adminClient = createAdminClient();

    // First, find the user by phone number in the profiles table
    // Try exact match first
    let { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_email')
      .eq('user_phoneno', formattedPhone)
      .single();

    // If not found with exact match, try with variations
    if (profileError || !profileData) {
      // Try with + prefix
      ({ data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_email')
        .eq('user_phoneno', `+${formattedPhone}`)
        .single());
    }

    if (profileError || !profileData) {
      // If still not found, try with original format
      ({ data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_email')
        .ilike('user_phoneno', `%${phone}%`)
        .single());
    }

    if (profileError || !profileData) {
      // If no user found with this phone number, return error
      return Response.json(
        { error: 'Phone number not found in our system.', needsContactAdmin: true },
        { status: 400 }
      );
    }

    // Get the actual auth user email from the auth.users table
    // This is the email that was used during registration (likely phone-to-email format)
    const { data: authUserData, error: authUserError } = await adminClient.auth.admin.getUserById(profileData.id);

    if (authUserError || !authUserData?.user?.email) {
      console.error('Error fetching auth user data:', authUserError);
      return Response.json(
        { error: 'Unable to retrieve account information. Please contact admin for assistance.', needsContactAdmin: true },
        { status: 500 }
      );
    }

    // Use the auth user's email for password reset (this is the email Supabase knows about)
    const authUserEmail = authUserData.user.email;

    // Send the password reset link to the auth user's email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(authUserEmail, {
      redirectTo: `${request.nextUrl.origin}/update-password`,
    });

    if (resetError) {
      console.error('Error sending password reset email:', resetError);
      return Response.json(
        { error: 'Failed to send password reset email. Please contact admin for assistance.', needsContactAdmin: true },
        { status: 500 }
      );
    }

    return Response.json(
      { message: 'Password reset link has been sent to your email address.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in forgot password:', error);
    return Response.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}