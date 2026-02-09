import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

// Simple in-memory rate limiter: max 5 attempts per IP per 15 minutes
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): { success: boolean; resetTime?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return { success: true };
  }

  if (now - record.timestamp > RATE_LIMIT_WINDOW_MS) {
    // Window expired, reset
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return { success: true };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { success: false, resetTime: record.timestamp + RATE_LIMIT_WINDOW_MS };
  }

  record.count++;
  return { success: true };
}

// Convert phone to email-like format for Supabase auth (workaround for phone auth disabled)
const phoneToEmail = (phone: string): string => {
  // Remove + and use phone as email: +628123456789 -> 628123456789@phone.local
  const cleanPhone = phone.replace(/^\+/, '');
  return `${cleanPhone}@phone.local`;
};

export async function POST(request: Request) {
  try {
    // Apply rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = checkRateLimit(ip);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { phone, password, full_name, email } = await request.json();

    // Validate required fields - phone is now required, email is optional
    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone number and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Validate phone format (E.164)
    if (!phone.match(/^\+62[0-9]{9,13}$/)) {
      return NextResponse.json({ error: 'Invalid phone number format. Use +62xxx format.' }, { status: 400 });
    }

    // Use admin client to create user (requires service_role key)
    const adminClient = createAdminClient();
    
    // Create user with phone converted to email format (workaround)
    // This allows phone-based login without enabling Supabase phone auth
    const phoneEmail = phoneToEmail(phone);
    
    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      email: phoneEmail,
      password,
      email_confirm: true, // Auto-confirm
      user_metadata: {
        full_name,
        phone,
        actual_email: email || null,
      },
    });

    if (createError || !authData.user) {
      console.error('Error creating user');
      
      // Check for duplicate phone error
      if (createError?.message?.includes('already registered') || createError?.message?.includes('duplicate')) {
        return NextResponse.json({ error: 'This phone number is already registered' }, { status: 400 });
      }
      
      return NextResponse.json({ error: createError?.message || 'Failed to create account' }, { status: 500 });
    }

    // Update the profile - user is NOT approved (needs admin approval)
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        user_name: full_name,
        user_phoneno: phone,
        user_email: email || null,
        is_approved: false, // Requires admin approval
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Error updating profile');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Registration successful. Please wait for admin approval before logging in.' 
    });
  } catch (error) {
    console.error('Exception in register API');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
