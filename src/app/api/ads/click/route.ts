import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface ClickRequest {
  adId: string;
  sessionId: string;
  deviceType?: string;
  pageUrl?: string;
}

// Create a simple Supabase client
function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const body: ClickRequest = await request.json();
    const { adId, sessionId, deviceType, pageUrl } = body;

    if (!adId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: adId and sessionId' },
        { status: 400 }
      );
    }

    // Get user agent from request headers
    const userAgent = request.headers.get('user-agent');
    const referrer = request.headers.get('referer');

    // Create Supabase client
    const supabase = createSupabaseClient();

    // First, try to update an existing impression record for this session/ad
    const { error: updateError } = await supabase
      .from('ad_impressions')
      .update({
        clicked: true,
        click_timestamp: new Date().toISOString(),
      })
      .eq('ad_id', adId)
      .eq('session_id', sessionId)
      .eq('clicked', false);

    if (updateError) {
      console.error('Error updating click:', updateError);
    }

    // If no rows were updated (no existing impression), insert a new record
    const { error: insertError } = await supabase
      .from('ad_impressions')
      .insert({
        ad_id: adId,
        session_id: sessionId,
        device_type: deviceType || 'desktop',
        user_agent: userAgent,
        referrer_url: referrer,
        page_url: pageUrl,
        clicked: true,
        click_timestamp: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error inserting click:', insertError);
    }

    // Increment the click count using the database function
    await supabase.rpc('increment_ad_click', { ad_uuid: adId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking click:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track click' },
      { status: 500 }
    );
  }
}
