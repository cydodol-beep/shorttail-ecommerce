import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = body.phone;

    if (!phone) {
      return Response.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Clean the input phone (remove non-digits)
    const cleanInputPhone = phone.replace(/[^\d]/g, '');

    // Try all possible phone number formats (+62, 08, 62)
    const possibleDbFormats = [
      `+${cleanInputPhone}`,
      cleanInputPhone.startsWith('62') ? `0${cleanInputPhone.substring(2)}` : cleanInputPhone,
      cleanInputPhone
    ];

    // Use the check_phone_exists function (bypasses RLS)
    let profileData = null;
    let matchedPhoneFormat = '';

    for (const phoneFormat of possibleDbFormats) {
      const { data, error } = await supabase.rpc('check_phone_exists', {
        phone_param: phoneFormat
      });

      if (!error) {
        // Handle different possible return formats from RPC
        let exists = false;
        let userEmail = null;

        if (typeof data === 'boolean') {
          exists = data;
        } else if (typeof data === 'object') {
          exists = data?.exists === true;
          userEmail = data?.user_email;
        }

        if (exists && userEmail) {
          // Get the user ID and name separately since the function no longer returns them for security
          // Use service role client to bypass RLS

          const { data: profile, error: profileError } = await adminSupabase
            .from('profiles')
            .select('id, user_name, user_phoneno')
            .eq('user_phoneno', phoneFormat)
            .single();

          if (!profileError && profile) {
            profileData = {
              id: profile.id,
              user_name: profile.user_name,
              user_email: userEmail,
              user_phoneno: profile.user_phoneno
            };
            matchedPhoneFormat = phoneFormat;
            break;
          }
        }
      }
    }

    // If still no user found via RPC, try direct query as fallback
    if (!profileData) {
      // Direct query as fallback - bypass RLS using service role if needed
      for (const phoneFormat of possibleDbFormats) {
        const { data: directProfile, error: directError } = await adminSupabase
          .from('profiles')
          .select('id, user_name, user_email, user_phoneno')
          .eq('user_phoneno', phoneFormat)
          .maybeSingle();

        if (!directError && directProfile) {
          profileData = {
            id: directProfile.id,
            user_name: directProfile.user_name,
            user_email: directProfile.user_email,
            user_phoneno: phoneFormat
          };
          matchedPhoneFormat = phoneFormat;
          break;
        }
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

    // Check if user has a valid email address
    if (!profileData.user_email || !profileData.user_email.includes('@')) {
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

    // Use the email for password reset
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(profileData.user_email, {
      redirectTo: `${request.nextUrl.origin}/update-password?type=recovery`,
    });

    if (resetError) {
      console.error('Error sending password reset email');
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
    console.error('Unexpected error in forgot password');
    return Response.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
