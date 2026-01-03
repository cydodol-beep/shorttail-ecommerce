import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Robust CSV Parser that properly handles:
 * - Quoted fields with embedded newlines (line breaks inside cells)
 * - Quoted fields with embedded commas
 * - Escaped quotes ("" inside quoted fields)
 * - Mixed quoted and unquoted fields
 * - Windows (\r\n), Unix (\n), and old Mac (\r) line endings
 */
function parseCSV(csvContent: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  // Normalize line endings to \n
  const content = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = i < content.length - 1 ? content[i + 1] : '';
    
    if (inQuotes) {
      // Inside quoted field
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote ("") - add single quote and skip next
          currentField += '"';
          i++;
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        // Any character inside quotes (including newlines) is part of the field
        currentField += char;
      }
    } else {
      // Outside quoted field
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === ',') {
        // Field separator - push current field and start new one
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n') {
        // Row separator - push current field and start new row
        currentRow.push(currentField.trim());
        if (currentRow.length > 0 && currentRow.some(field => field !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        // Regular character
        currentField += char;
      }
    }
  }
  
  // Don't forget the last field and row
  currentRow.push(currentField.trim());
  if (currentRow.length > 0 && currentRow.some(field => field !== '')) {
    rows.push(currentRow);
  }
  
  return rows;
}

/**
 * Clean a field value by removing surrounding quotes and unescaping internal quotes
 */
function cleanFieldValue(value: string | undefined): string | null {
  if (!value || value.trim() === '') return null;
  
  let cleaned = value.trim();
  
  // Remove surrounding quotes if present
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  
  // Unescape double quotes
  cleaned = cleaned.replace(/""/g, '"');
  
  // Convert internal line breaks to spaces or keep them (your choice)
  // Option 1: Keep line breaks as-is (preserves address formatting)
  // Option 2: Replace with space: cleaned = cleaned.replace(/\n/g, ' ');
  
  return cleaned.trim() || null;
}

export async function POST(request: NextRequest) {
  // Create Supabase client for server-side operations
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name);
          return cookie ? cookie.value : undefined;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options);
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

    if (!body || body.trim() === '') {
      return NextResponse.json({ error: 'Empty CSV content' }, { status: 400 });
    }

    // Parse CSV using robust parser that handles multiline fields
    const rows = parseCSV(body);
    
    if (rows.length < 2) {
      return NextResponse.json({ error: 'CSV file must contain a header row and at least one data row' }, { status: 400 });
    }

    // Extract and clean headers (first row)
    const headers = rows[0].map(header => cleanFieldValue(header)?.toLowerCase().trim() || '');
    
    // Validate required headers
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

    const missingHeaders: string[] = [];
    for (const header of requiredHeaders) {
      if (!headers.includes(header)) {
        missingHeaders.push(header);
      }
    }

    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        error: `Missing required columns: ${missingHeaders.join(', ')}`,
        foundHeaders: headers,
        hint: 'Make sure your CSV has all required columns in the header row'
      }, { status: 400 });
    }

    // Build column index map for efficient lookups
    const columnIndex: Record<string, number> = {};
    headers.forEach((header, index) => {
      if (header) {
        columnIndex[header] = index;
      }
    });

    // Process data rows (skip header)
    const recordsToInsert = [];
    const errors: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Skip completely empty rows
      if (row.every(cell => !cell || cell.trim() === '')) {
        continue;
      }

      try {
        const record = {
          user_name: cleanFieldValue(row[columnIndex['user_name']]),
          user_phoneno: cleanFieldValue(row[columnIndex['user_phoneno']]),
          recipient_name: cleanFieldValue(row[columnIndex['recipient_name']]),
          recipient_phoneno: cleanFieldValue(row[columnIndex['recipient_phoneno']]),
          recipient_address_line1: cleanFieldValue(row[columnIndex['recipient_address_line1']]),
          recipient_city: cleanFieldValue(row[columnIndex['recipient_city']]),
          recipient_region: cleanFieldValue(row[columnIndex['recipient_region']]),
          recipient_postal_code: cleanFieldValue(row[columnIndex['recipient_postal_code']]),
        };

        // Validate that at least some key fields have data
        if (!record.user_name && !record.user_phoneno && !record.recipient_name) {
          errors.push(`Row ${i + 1}: Missing all key fields (user_name, user_phoneno, recipient_name)`);
          continue;
        }

        recordsToInsert.push(record);
      } catch (rowError) {
        errors.push(`Row ${i + 1}: Failed to parse - ${(rowError as Error).message}`);
      }
    }

    if (recordsToInsert.length === 0) {
      return NextResponse.json({ 
        error: 'No valid records found in CSV',
        details: errors.length > 0 ? errors.slice(0, 10) : undefined // Show first 10 errors
      }, { status: 400 });
    }

    // Insert records into the database in batches to handle large files
    const BATCH_SIZE = 100;
    let insertedCount = 0;
    const insertErrors: string[] = [];

    for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
      const batch = recordsToInsert.slice(i, i + BATCH_SIZE);
      
      const { error } = await supabase
        .from('temp_custdata')
        .insert(batch);

      if (error) {
        console.error(`Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
        insertErrors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      } else {
        insertedCount += batch.length;
      }
    }

    // Build response message
    let message = `Successfully imported ${insertedCount} of ${recordsToInsert.length} records`;
    
    if (errors.length > 0) {
      message += `. ${errors.length} rows had parsing issues.`;
    }
    
    if (insertErrors.length > 0) {
      message += `. ${insertErrors.length} batches had insert errors.`;
    }

    return NextResponse.json({ 
      success: true, 
      message,
      imported: insertedCount,
      total: recordsToInsert.length,
      parseErrors: errors.length > 0 ? errors.slice(0, 5) : undefined,
      insertErrors: insertErrors.length > 0 ? insertErrors : undefined
    });
  } catch (error) {
    console.error('Error in import API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: (error as Error).message 
    }, { status: 500 });
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