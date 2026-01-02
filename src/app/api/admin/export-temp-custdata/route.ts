import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Create Supabase client for server-side operations
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    // First, verify that the user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role to ensure they have admin access
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 401 });
    }

    const userRole = profileData.role;
    if (userRole !== 'master_admin' && userRole !== 'normal_admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch all records from temp_custdata table
    const { data, error } = await supabase
      .from('temp_custdata')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching records:', error);
      return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }

    // Convert data to CSV format
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No data to export' }, { status: 404 });
    }

    const headers = [
      'id',
      'user_name', 
      'user_phoneno', 
      'recipient_name', 
      'recipient_phoneno', 
      'recipient_address_line1', 
      'recipient_city', 
      'recipient_region', 
      'recipient_postal_code',
      'created_at',
      'updated_at'
    ];
    
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        `"${item.id}"`,
        `"${item.user_name || ''}"`,
        `"${item.user_phoneno || ''}"`,
        `"${item.recipient_name || ''}"`,
        `"${item.recipient_phoneno || ''}"`,
        `"${item.recipient_address_line1 || ''}"`,
        `"${item.recipient_city || ''}"`,
        `"${item.recipient_region || ''}"`,
        `"${item.recipient_postal_code || ''}"`,
        `"${item.created_at}"`,
        `"${item.updated_at}"`
      ].join(','))
    ].join('\n');

    // Create response with CSV content
    const response = new NextResponse(csvContent);
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set('Content-Disposition', `attachment; filename=temp_custdata_export_${new Date().toISOString().slice(0, 10)}.csv`);

    return response;
  } catch (error) {
    console.error('Error in export API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Allow CORS for this endpoint
export function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}