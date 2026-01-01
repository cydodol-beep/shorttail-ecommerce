import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface Advertisement {
  id: string;
  imageUrl: string;
  redirectLink: string | null;
  altText: string | null;
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch active advertisements
    // RLS policy already filters by is_active, start_date, and end_date
    const { data, error } = await supabase
      .from('advertisements')
      .select('id, image_url, redirect_link, alt_text')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching advertisements:', error);
      return NextResponse.json({ ads: [] }, { status: 200 });
    }

    // Filter by date on server side as well (belt and suspenders with RLS)
    const now = new Date();
    const filteredData = (data || []).filter((ad: any) => {
      // Check start_date: ad should show if start_date is null or in the past
      if (ad.start_date && new Date(ad.start_date) > now) return false;
      // Check end_date: ad should show if end_date is null or in the future
      if (ad.end_date && new Date(ad.end_date) < now) return false;
      return true;
    });

    // Transform to camelCase for frontend
    const ads: Advertisement[] = filteredData.map((ad: any) => ({
      id: ad.id,
      imageUrl: ad.image_url,
      redirectLink: ad.redirect_link,
      altText: ad.alt_text,
    }));

    return NextResponse.json({ ads }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error fetching advertisements:', error);
    return NextResponse.json({ ads: [] }, { status: 200 });
  }
}
