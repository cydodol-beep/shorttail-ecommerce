import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
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

    // Get request body as text to handle CSV content
    const body = await request.text();

    // Process CSV content
    const lines = body.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file must contain at least one data row' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
    const recordsToInsert = [];

    // Validate headers
    const requiredHeaders = [
      'user_name',
      'user_phoneno',
      'recipient_name',
      'recipient_phoneno',
      'recipient_address_line1',
      'recipient_city',
      'recipient_region',
      'recipient_postal_code'
    ];

    for (const header of requiredHeaders) {
      if (!headers.includes(header)) {
        return NextResponse.json({ error: `Missing required column: ${header}` }, { status: 400 });
      }
    }

    // Process records (skip header row)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Handle quoted fields that may contain commas
      const values = parseCSVLine(line);
      const record: Record<string, any> = {};

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        if (requiredHeaders.includes(header)) {
          record[header] = values[j] ? values[j].replace(/^"|"$/g, '') : null; // Remove surrounding quotes
        }
      }

      recordsToInsert.push({
        user_name: record.user_name || null,
        user_phoneno: record.user_phoneno || null,
        recipient_name: record.recipient_name || null,
        recipient_phoneno: record.recipient_phoneno || null,
        recipient_address_line1: record.recipient_address_line1 || null,
        recipient_city: record.recipient_city || null,
        recipient_region: record.recipient_region || null,
        recipient_postal_code: record.recipient_postal_code || null,
      });
    }

    if (recordsToInsert.length === 0) {
      return NextResponse.json({ error: 'No valid records found in CSV' }, { status: 400 });
    }

    // Insert records into the database
    const { error } = await supabase
      .from('temp_custdata')
      .insert(recordsToInsert);

    if (error) {
      console.error('Error inserting records:', error);
      return NextResponse.json({ error: 'Failed to insert records' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Successfully imported ${recordsToInsert.length} records` });
  } catch (error) {
    console.error('Error in import API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Simple function to parse CSV lines that may contain quoted fields with commas
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = i < line.length - 1 ? line[i + 1] : '';

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && nextChar === '"') {
      current += '"';
      i++; // Skip next quote
    } else if (char === '"' && inQuotes && nextChar !== '"') {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
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