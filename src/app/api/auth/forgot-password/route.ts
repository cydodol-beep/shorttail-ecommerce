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

    // Fetch ALL profiles and filter to avoid database query issues
    const { data: allProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, user_email, user_name, user_phoneno');

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError);
      return Response.json(
        { error: 'Database error occurred. Please try again.' },
        { status: 500 }
      );
    }

    // Normalize phone numbers for comparison (remove +, spaces, dashes, quotes)
    const normalizePhone = (p: string | null) => {
      if (!p) return '';
      // Remove all non-digit characters (including quotes, spaces, dashes, etc.)
      return p.replace(/[^\d]/g, '');
    };

    console.log('Total profiles fetched:', allProfiles?.length);
    console.log('Looking for phone matching:', cleanInputPhone);

    // Log all phone numbers in DB for debugging
    (allProfiles || []).forEach(p => {
      console.log('DB Phone:', p.user_phoneno, '→ Normalized:', normalizePhone(p.user_phoneno));
    });

    // Find matching profile by comparing normalized phone numbers
    let profileData = null;
    for (const profile of allProfiles || []) {
      const normalizedDbPhone = normalizePhone(profile.user_phoneno);

      if (normalizedDbPhone === cleanInputPhone) {
        profileData = profile;
        console.log('Found profile by normalized phone match:', profile);
        break;
      }
    }

    // If still no user found, return error
    if (!profileData) {
      console.log('No matching profile found for phone:', cleanInputPhone);
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

    // Use the email from profiles table for password reset
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
