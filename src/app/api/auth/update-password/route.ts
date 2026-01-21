import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return Response.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // The actual password change happens through the Supabase session
    // that's established when the user clicks the reset link in their email
    const supabase = await createClient();

    // Update the user's password
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error('Error updating password:', error);
      return Response.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      );
    }

    return Response.json(
      { message: 'Password has been updated successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in update password:', error);
    return Response.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}