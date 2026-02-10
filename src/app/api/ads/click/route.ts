import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

interface ClickRequest {
  adId: string;
  sessionId: string;
  deviceType?: string;
  pageUrl?: string;
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

    // Get user agent from headers
    const headersList = await headers();
    const userAgent = headersList.get('user-agent');
    const referrer = headersList.get('referer');

    // Create Supabase client
    const supabase = await createClient();

    // Get current user (if authenticated)
    const { data: { user } } = await supabase.auth.getUser();

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
        user_id: user?.id || null,
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
