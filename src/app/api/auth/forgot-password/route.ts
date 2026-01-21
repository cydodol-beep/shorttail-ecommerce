import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Check if the user has a valid email address in the profiles table
    if (!profileData.user_email || !profileData.user_email.includes('@')) {
      // User doesn't have a valid email, return error with flag to show contact admin option
      return Response.json(
        { error: 'No valid email address found for this account.', needsContactAdmin: true, userId: profileData.id },
        { status: 400 }
      );
    }

    // Use the email from the profiles table as the destination for the password reset link
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(profileData.user_email, {
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