import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

// Simple in-memory rate limiter: max 10 attempts per IP per 15 minutes
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_MAX = 10;
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

export async function POST(request: Request) {
  try {
    // Apply rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = checkRateLimit(ip);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many lookup attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    
    // Format phone variants for lookup
    const phoneE164 = phone.startsWith('+') ? phone : `+${phone}`;
    const phoneWithoutPlus = phone.replace(/^\+/, '');
    const phoneWithZero = phoneWithoutPlus.startsWith('62') 
      ? '0' + phoneWithoutPlus.substring(2) 
      : phone;

    // Find profile by phone number (check multiple formats)
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id')
      .or(`user_phoneno.eq.${phoneE164},user_phoneno.eq.${phoneWithoutPlus},user_phoneno.eq.${phoneWithZero}`)
      .single();

    if (!profile) {
      return NextResponse.json({ email: null });
    }

    // Get the auth user to find their email
    const { data: authUser } = await adminClient.auth.admin.getUserById(profile.id);

    if (!authUser?.user?.email) {
      return NextResponse.json({ email: null });
    }

    return NextResponse.json({ email: authUser.user.email });
  } catch (error) {
    console.error('Error looking up email');
    return NextResponse.json({ email: null });
  }
}
