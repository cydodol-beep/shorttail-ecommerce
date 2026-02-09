import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { password, token } = await request.json();

    if (!password || !token) {
      return Response.json(
        { error: 'Password and token are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(token);

    if (exchangeError) {
      console.error('Error exchanging code for session');
      return Response.json(
        { error: 'Invalid or expired token. Please try resetting your password again.' },
        { status: 400 }
      );
    }

    // Update the password after successful session exchange
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      console.error('Error updating password');
      return Response.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      );
    }

    return Response.json(
      { message: 'Password has been reset successfully. Please log in with your new password.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in reset password');
    return Response.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
