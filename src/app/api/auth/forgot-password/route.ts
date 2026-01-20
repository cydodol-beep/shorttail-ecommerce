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

    // Convert phone to email format for Supabase auth (same as in login)
    const email = `${formattedPhone}@phone.local`;

    const supabase = await createClient();

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${request.nextUrl.origin}/auth/update-password`,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      // Return a generic message to avoid revealing if the phone number exists
      return Response.json(
        { error: 'If this phone number exists in our system, a password reset link has been sent to the associated email address.' },
        { status: 200 } // Return 200 to avoid revealing if the phone number exists
      );
    }

    return Response.json(
      { message: 'If this phone number exists in our system, a password reset link has been sent to the associated email address.' },
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