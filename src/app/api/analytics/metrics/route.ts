import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'summary'; // Options: summary, topPages, byCountry, byDevice
    
    let rpcFunction;
    let params = {};

    switch (type) {
      case 'topPages':
        rpcFunction = 'get_top_pages';
        const periodPages = parseInt(url.searchParams.get('days') || '30');
        params = { period_days: periodPages };
        break;
      case 'byCountry':
        rpcFunction = 'get_traffic_by_country';
        const periodCountry = parseInt(url.searchParams.get('days') || '30');
        params = { period_days: periodCountry };
        break;
      case 'byDevice':
        rpcFunction = 'get_traffic_by_device';
        const periodDevice = parseInt(url.searchParams.get('days') || '30');
        params = { period_days: periodDevice };
        break;
      case 'summary':
      default:
        rpcFunction = 'get_traffic_summary';
        break;
    }

    const { data, error } = await supabase.rpc(rpcFunction, params);

    if (error) {
      console.error(`Error fetching ${type} traffic data:`, error);
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}