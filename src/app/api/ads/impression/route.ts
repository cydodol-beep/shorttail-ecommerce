import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

interface ImpressionRequest {
  adId: string;
  sessionId: string;
  deviceType?: string;
  pageUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ImpressionRequest = await request.json();
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

    // Insert impression record
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
        timestamp: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error inserting impression:', insertError);
      // Don't fail the request, just log the error
      return NextResponse.json({ success: false, error: insertError.message });
    }

    // Also increment the impression count using the database function
    await supabase.rpc('increment_ad_impression', { ad_uuid: adId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking impression:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track impression' },
      { status: 500 }
    );
  }
}
