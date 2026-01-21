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

    const supabase = await createClient();

    // The client-side form always sends phone in 62XXXXXXXXXX format
    // due to formatPhoneNumberForEmail function
    const cleanInputPhone = phone.replace(/\D/g, '');

    // Log for debugging
    console.log('Forgot password - cleanInputPhone:', cleanInputPhone);

    // Possible formats the phone might be stored in database
    // If client sends 6281317902179, DB might have:
    const possibleDbFormats = [
      `+${cleanInputPhone}`,  // +6281317902179
      cleanInputPhone.startsWith('62') ? `0${cleanInputPhone.substring(2)}` : cleanInputPhone,  // 081317902179
      cleanInputPhone  // 6281317902179 (same as received)
    ];

    let profileData = null;

    // Try exact match with all possible stored formats
    for (const format of possibleDbFormats) {
      console.log('Trying format:', format);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_email, user_name')
        .eq('user_phoneno', format)
        .single();

      console.log('Result for format', format, ': error=', error, 'data=', data);

      if (!error && data) {
        profileData = data;
        console.log('Found profile:', profileData);
        break;
      }
    }

    // If still no user found, return error
    if (!profileData) {
      return Response.json(
        {
          error: 'Phone number not found in our system.',
          needsContactAdmin: true,
          userName: null,
          userPhone: cleanInputPhone
        },
        { status: 400 }
      );
    }

    // Check if user has a valid email address in profiles table
    if (!profileData.user_email || !profileData.user_email.includes('@')) {
      // User doesn't have a valid email, return error with flag to show contact admin option
      return Response.json(
        {
          error: 'No valid email address found for this account.',
          needsContactAdmin: true,
          userId: profileData.id,
          userName: profileData.user_name || 'N/A',
          userPhone: cleanInputPhone
        },
        { status: 400 }
      );
    }

    // Use the email from profiles table as the destination for password reset link
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
