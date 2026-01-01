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
    const now = new Date().toISOString();

    // Fetch active advertisements
    const { data, error } = await supabase
      .from('advertisements')
      .select('id, image_url, redirect_link, alt_text')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching advertisements:', error);
      return NextResponse.json({ ads: [] }, { status: 200 });
    }

    // Transform to camelCase for frontend
    const ads: Advertisement[] = (data || []).map((ad) => ({
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
