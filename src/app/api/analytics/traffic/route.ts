import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get Supabase server client
    const supabase = createClient();
    
    // Get user session if available
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get request data
    const reqData = await request.json();
    
    // Extract data from request and body
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') ||
               request.ip ||
               'unknown';
    
    const userAgent = request.headers.get('user-agent') || '';
    const pageUrl = reqData.pageUrl || request.url || '';
    const referrer = request.headers.get('referer') || reqData.referrer || '';
    
    // Extract additional geolocation data if provided
    const country = reqData.country || '';
    const city = reqData.city || '';
    const latitude = reqData.latitude || null;
    const longitude = reqData.longitude || null;

    // Insert traffic log into the database
    const { error } = await supabase
      .from('traffic_logs')
      .insert({
        ip_address: ip,
        user_agent: userAgent,
        page_url: pageUrl,
        referrer: referrer,
        user_id: user?.id || null,
        country_code: country,
        city: city,
        latitude: latitude,
        longitude: longitude,
      });

    if (error) {
      console.error('Error inserting traffic log:', error);
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error logging traffic:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get query parameters
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'daily'; // Options: hourly, daily, monthly, yearly
    const days = parseInt(url.searchParams.get('days') || '30'); // Default to 30 days
    
    // Calculate start and end dates
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    let rpcFunction;
    switch (period) {
      case 'hourly':
        rpcFunction = 'get_hourly_traffic';
        break;
      case 'monthly':
        rpcFunction = 'get_monthly_traffic';
        break;
      case 'yearly':
        rpcFunction = 'get_yearly_traffic';
        break;
      case 'daily':
      default:
        rpcFunction = 'get_daily_traffic';
        break;
    }

    const { data, error } = await supabase.rpc(rpcFunction, {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    });

    if (error) {
      console.error(`Error fetching ${period} traffic data:`, error);
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}