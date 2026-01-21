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

    // Clean the input phone number by removing non-digit characters
    const cleanInputPhone = phone.replace(/\D/g, '');

    // Generate multiple possible formats for comparison
    const phoneFormats = [];

    // Handle different input formats and generate corresponding database search formats
    if (phone.startsWith('+62')) {
      // Input is in +62 format: +6281234567890
      phoneFormats.push(phone, `62${cleanInputPhone.substring(3)}`, `0${cleanInputPhone.substring(2)}`, cleanInputPhone);
    } else if (phone.startsWith('62')) {
      // Input is in 62 format: 6281234567890
      phoneFormats.push(`+${phone}`, phone, `0${cleanInputPhone.substring(2)}`, cleanInputPhone);
    } else if (phone.startsWith('0')) {
      // Input is in 0 format: 081234567890
      const withoutZero = cleanInputPhone.substring(1);
      phoneFormats.push(`+62${withoutZero}`, `62${withoutZero}`, phone, cleanInputPhone);
    } else {
      // Input is in raw format: 81234567890
      phoneFormats.push(`+62${cleanInputPhone}`, `62${cleanInputPhone}`, `0${cleanInputPhone}`, phone, cleanInputPhone);
    }

    // Remove duplicates while preserving order
    const uniqueFormats = [...new Set(phoneFormats)];

    // Try to find the user by phone number in the profiles table using any of the formats
    let profileData = null;
    let profileError = null;

    // First, try exact matches with all possible formats
    for (const format of uniqueFormats) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_email')
        .eq('user_phoneno', format)
        .single();

      if (!error && data) {
        profileData = data;
        break;
      }
    }

    // If no user found with exact match, try more flexible matching
    if (!profileData) {
      // Try to find the user by cleaning both the input and stored phone numbers
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, user_email, user_phoneno');

      if (allProfiles && allProfiles.length > 0) {
        // Find a profile where the cleaned phone number matches
        for (const profile of allProfiles) {
          const cleanedStoredPhone = profile.user_phoneno.replace(/\D/g, '');

          // Check if the cleaned phone numbers match
          if (cleanedStoredPhone === cleanInputPhone) {
            profileData = profile;
            break;
          }
        }
      }
    }

    // If still no user found, return error
    if (!profileData) {
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