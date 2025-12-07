import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
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

    const { userId, userData } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Update profile data
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
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Update password if provided
    if (userData.password && userData.password.length >= 6) {
      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: userData.password }
      );

      if (passwordError) {
        console.error('Error updating password:', passwordError);
        return NextResponse.json({ 
          error: 'Profile updated but password change failed',
          details: passwordError.message 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Exception in update user API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
