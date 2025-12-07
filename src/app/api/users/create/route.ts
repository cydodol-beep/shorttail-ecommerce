import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['master_admin', 'normal_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userData = await request.json();

    // Validate required fields
    if (!userData.user_phoneno || !userData.password) {
      return NextResponse.json({ error: 'Phone number and password are required' }, { status: 400 });
    }

    if (userData.password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Use admin client to create user (requires service_role key)
    const adminClient = createAdminClient();
    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      phone: userData.user_phoneno,
      email: userData.user_email,
      password: userData.password,
      phone_confirm: true,
      email_confirm: true,
      user_metadata: {
        full_name: userData.user_name,
      },
    });

    if (createError || !authData.user) {
      console.error('Error creating user:', createError);
      return NextResponse.json({ error: createError?.message || 'Failed to create user' }, { status: 500 });
    }

    // Update the profile with additional data (admin-created users are auto-approved)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        user_name: userData.user_name,
        user_email: userData.user_email,
        role: userData.role,
        tier: userData.tier,
        points_balance: userData.points_balance,
        address_line1: userData.address_line1,
        city: userData.city,
        province_id: userData.province_id ? parseInt(userData.province_id) : null,
        postal_code: userData.postal_code,
        recipient_name: userData.recipient_name,
        recipient_phoneno: userData.recipient_phoneno,
        recipient_address_line1: userData.recipient_address_line1,
        recipient_city: userData.recipient_city,
        recipient_province_id: userData.recipient_province_id ? parseInt(userData.recipient_province_id) : null,
        recipient_postal_code: userData.recipient_postal_code,
        is_approved: true,
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ error: 'User created but profile update failed' }, { status: 500 });
    }

    // Fetch the created user
    const { data: newUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Exception in create user API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
