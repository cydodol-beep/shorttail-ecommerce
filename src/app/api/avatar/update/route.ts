// src/app/api/avatar/update/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidWebPDataUrl } from '@/lib/utils';

// Create Supabase client using service role for bypassing RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Requires service role key for bypassing RLS
);

export async function POST(request: NextRequest) {
  try {
    const { userId, avatarDataUrl } = await request.json();

    // Validate the data URL
    if (!avatarDataUrl || !isValidWebPDataUrl(avatarDataUrl)) {
      return Response.json(
        { error: 'Invalid avatar data URL format' },
        { status: 400 }
      );
    }

    // Optionally limit size to prevent excessively large data
    if (avatarDataUrl.length > 5 * 1024 * 1024) { // 5MB limit
      return Response.json(
        { error: 'Avatar data URL is too large' },
        { status: 400 }
      );
    }

    // Update the user's avatar in the database using service role
    const { error } = await supabase
      .from('profiles')
      .update({ user_avatar_url: avatarDataUrl })
      .eq('id', userId);

    if (error) {
      console.error('Error updating avatar:', error);
      return Response.json(
        { error: 'Failed to update avatar' },
        { status: 500 }
      );
    }

    return Response.json({ message: 'Avatar updated successfully' });
  } catch (error) {
    console.error('Error in avatar update API:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}