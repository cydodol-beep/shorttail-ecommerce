import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// API route to handle hero image uploads
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const supabase = createClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user has admin privileges
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !['master_admin', 'normal_admin'].includes(profile.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the JSON data from the request
    const { imageUrls } = await request.json();

    // Validate input
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return Response.json({ error: 'Invalid image URLs' }, { status: 400 });
    }

    // Update the hero section settings in the database
    const { error } = await supabase
      .from('landing_page_sections')
      .update({
        settings: { imageUrls },
        updated_at: new Date().toISOString()
      })
      .eq('section_key', 'hero');

    if (error) {
      console.error('Error updating hero section:', error);
      return Response.json({ error: 'Failed to update hero section' }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: 'Hero images updated successfully'
    });
  } catch (error) {
    console.error('Error in hero image upload API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}