import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get current user to preserve existing metadata
    const { data: { user }, error: getUserError } = await supabaseServer.auth.admin.getUserById(userId);

    if (getUserError || !user) {
      console.error('Error fetching user:', getUserError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user metadata to grant membership
    const updatedMetadata = {
      ...(user.user_metadata || {}),
      membership_status: 'active',
      has_paid_membership: true,
      membership_purchased_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseServer.auth.admin.updateUserById(
      userId,
      { user_metadata: updatedMetadata }
    );

    if (updateError) {
      console.error('Error updating user membership:', updateError);
      return NextResponse.json(
        { error: 'Failed to update membership' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Upgrade membership error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upgrade membership' },
      { status: 500 }
    );
  }
}

