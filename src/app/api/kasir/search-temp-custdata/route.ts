import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API route for searching temp_custdata records in POS/Kasir
 * Uses server-side search for efficiency with 2000+ records
 * Bypasses RLS by using service role client
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    if (!query || query.length < 2) {
      return NextResponse.json({ data: [], error: null });
    }

    const supabase = await createClient();

    // Verify user is authenticated and has kasir/admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { data: [], error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { data: [], error: 'Profile not found' },
        { status: 403 }
      );
    }

    const allowedRoles = ['master_admin', 'normal_admin', 'kasir'];
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json(
        { data: [], error: 'Access denied' },
        { status: 403 }
      );
    }

    // Use service role client to bypass RLS
    const { createClient: createServiceClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const adminClient = createServiceClient(supabaseUrl, serviceRoleKey);

    // Search with ilike across multiple fields
    // Escape special characters for safety
    const escapedQuery = query.replace(/[%_]/g, '\\$&');
    
    const { data, error } = await adminClient
      .from('temp_custdata')
      .select('id, user_name, user_phoneno, recipient_name, recipient_phoneno, recipient_address_line1, recipient_city, recipient_region, recipient_postal_code')
      .or(`user_name.ilike.%${escapedQuery}%,user_phoneno.ilike.%${escapedQuery}%,recipient_name.ilike.%${escapedQuery}%,recipient_phoneno.ilike.%${escapedQuery}%`)
      .order('user_name', { ascending: true })
      .limit(15);

    if (error) {
      console.error('Error searching temp_custdata:', error);
      return NextResponse.json(
        { data: [], error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [], error: null });
  } catch (error) {
    console.error('Exception in search-temp-custdata:', error);
    return NextResponse.json(
      { data: [], error: 'Internal server error' },
      { status: 500 }
    );
  }
}
