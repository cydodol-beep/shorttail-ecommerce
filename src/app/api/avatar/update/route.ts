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

    console.log('Avatar update request received for user:', userId);
    console.log('Avatar data URL length:', avatarDataUrl ? avatarDataUrl.length : 'undefined');

    // Validate the data URL
    if (!avatarDataUrl || !isValidWebPDataUrl(avatarDataUrl)) {
      console.error('Invalid avatar data URL format');
      return Response.json(
        { error: 'Invalid avatar data URL format' },
        { status: 400 }
      );
    }

    // Optionally limit size to prevent excessively large data
    if (avatarDataUrl.length > 5 * 1024 * 1024) { // 5MB limit
      console.error('Avatar data URL is too large:', avatarDataUrl.length);
      return Response.json(
        { error: 'Avatar data URL is too large' },
        { status: 400 }
      );
    }

    // Update the user's avatar in the database using service role
    const { data, error } = await supabase
      .from('profiles')
      .update({ user_avatar_url: avatarDataUrl })
      .eq('id', userId)
      .select('user_avatar_url') // Return the updated avatar URL to verify
      .single();

    if (error) {
      console.error('Error updating avatar:', error);
      return Response.json(
        { error: `Failed to update avatar: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Avatar updated successfully in database for user:', userId);
    console.log('Stored avatar URL length:', data?.user_avatar_url?.length);

    // Verify that the stored data matches what we sent
    if (data?.user_avatar_url !== avatarDataUrl) {
      console.warn('Stored avatar URL does not match sent data');
    }

    return Response.json({
      message: 'Avatar updated successfully',
      avatarUrlLength: data?.user_avatar_url?.length
    });
  } catch (error) {
    console.error('Error in avatar update API:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}