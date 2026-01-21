import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = body.phone;

    console.log('=== DEBUG FORGOT PASSWORD START ===');
    console.log('Raw request body:', JSON.stringify(body));
    console.log('Raw phone received:', phone);

    if (!phone) {
      return Response.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Clean the input phone (remove non-digits)
    const cleanInputPhone = phone.replace(/[^\d]/g, '');
    console.log('Cleaned input phone (digits only):', cleanInputPhone);

    // Try all possible phone number formats (+62, 08, 62)
    const possibleDbFormats = [
      `+${cleanInputPhone}`,
      cleanInputPhone.startsWith('62') ? `0${cleanInputPhone.substring(2)}` : cleanInputPhone,
      cleanInputPhone
    ];

    console.log('Trying phone formats:', possibleDbFormats);

    // Use the check_phone_exists function (bypasses RLS)
    let profileData = null;
    let matchedPhoneFormat = '';

    for (const phoneFormat of possibleDbFormats) {
      console.log('Checking format:', phoneFormat);

      const { data, error } = await supabase.rpc('check_phone_exists', {
        phone_param: phoneFormat
      });

      console.log('RPC result for format', phoneFormat, ': error=', error?.message, 'data=', data, 'type=', typeof data);

      if (!error) {
        console.log('Data structure:', JSON.stringify(data));

        // Handle different possible return formats from RPC
        let exists = false;
        let userId = null;
        let userName = null;
        let userEmail = null;

        if (typeof data === 'boolean') {
          exists = data;
        } else if (typeof data === 'object') {
          exists = data?.exists === true;
          userId = data?.user_id || data?.id;
          userName = data?.user_name;
          userEmail = data?.user_email;
        }

        if (exists) {
          profileData = {
            id: userId,
            user_name: userName,
            user_email: userEmail,
            user_phoneno: phoneFormat
          };
          matchedPhoneFormat = phoneFormat;
          console.log('\n=== PROFILE FOUND ===');
          console.log('Matched phone format:', matchedPhoneFormat);
          console.log('Profile data:', JSON.stringify(profileData));
          break;
        }
      }
    }

    // If still no user found via RPC, try direct query as fallback
    if (!profileData) {
      console.log('\n=== NO PROFILE FOUND VIA RPC, TRYING DIRECT QUERY ===');

      // Direct query as fallback - bypass RLS using service role if needed
      for (const phoneFormat of possibleDbFormats) {
        console.log('Direct query checking format:', phoneFormat);

        const { data: directProfile, error: directError } = await supabase
          .from('profiles')
          .select('id, user_name, user_email, user_phoneno')
          .eq('user_phoneno', phoneFormat)
          .maybeSingle();

        console.log('Direct query result for', phoneFormat, ':', directError?.message, directProfile);

        if (!directError && directProfile) {
          profileData = {
            id: directProfile.id,
            user_name: directProfile.user_name,
            user_email: directProfile.user_email,
            user_phoneno: phoneFormat
          };
          matchedPhoneFormat = phoneFormat;
          console.log('\n=== PROFILE FOUND VIA DIRECT QUERY ===');
          console.log('Matched phone format:', matchedPhoneFormat);
          break;
        }
      }
    }

    // If still no user found, return error
    if (!profileData) {
      console.log('\n=== NO PROFILE FOUND ===');
      console.log('Returning error to client');
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

    console.log('\n=== PROCEEDING TO SEND EMAIL ===');
    console.log('Profile email:', profileData.user_email);

    // Check if user has a valid email address
    if (!profileData.user_email || !profileData.user_email.includes('@')) {
      console.log('No valid email found, showing contact admin dialog');
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
      redirectTo: `${request.nextUrl.origin}/update-password`,
    });

    if (resetError) {
      console.error('Error sending password reset email:', resetError);
      return Response.json(
        { error: 'Failed to send password reset email. Please contact admin for assistance.', needsContactAdmin: true },
        { status: 500 }
      );
    }

    console.log('Password reset email sent successfully');
    console.log('=== DEBUG FORGOT PASSWORD END ===\n');

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
