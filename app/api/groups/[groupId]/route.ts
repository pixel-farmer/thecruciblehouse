import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function createAuthenticatedSupabaseClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Get access token from Authorization header
  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.replace('Bearer ', '') || null;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: accessToken ? {
        Authorization: `Bearer ${accessToken}`,
      } : {},
    },
  });

  return client;
}

// DELETE: Delete a group (creator only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const supabase = await createAuthenticatedSupabaseClient(request);
    
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    // Get the group to verify creator
    const { data: group, error: fetchError } = await supabase
      .from('groups')
      .select('creator_id')
      .eq('id', groupId)
      .single();

    if (fetchError || !group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Verify user is the creator
    if (group.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the group creator can delete the group.' },
        { status: 403 }
      );
    }

    // Delete the group (RLS policy will also check, but we verify here too)
    // group_members will be automatically deleted due to CASCADE
    const { error: deleteError } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId)
      .eq('creator_id', user.id); // Extra safety check

    if (deleteError) {
      console.error('[groups/[groupId] DELETE] Error deleting group:', deleteError);
      
      if (deleteError.code === '42501' || deleteError.message.includes('permission denied')) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this group.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to delete group', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('[groups/[groupId] DELETE] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH: Update a group (creator only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const supabase = await createAuthenticatedSupabaseClient(request);
    
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    // Build update object (only include fields that are provided)
    const updateData: any = {};
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json(
          { error: 'Group name cannot be empty' },
          { status: 400 }
        );
      }
      if (name.length > 100) {
        return NextResponse.json(
          { error: 'Group name must be 100 characters or less' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      if (description && description.length > 500) {
        return NextResponse.json(
          { error: 'Description must be 500 characters or less' },
          { status: 400 }
        );
      }
      updateData.description = description?.trim() || null;
    }

    // Update the group (RLS will ensure user can only update their own groups)
    const { data: groupData, error: updateError } = await supabase
      .from('groups')
      .update(updateData)
      .eq('id', groupId)
      .eq('creator_id', user.id) // Ensure user is the creator
      .select()
      .single();

    if (updateError) {
      console.error('[groups/[groupId] PATCH] Error updating group:', updateError);
      
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Group not found or you do not have permission to edit it.' },
          { status: 404 }
        );
      }
      
      if (updateError.code === '42501' || updateError.message.includes('permission denied')) {
        return NextResponse.json(
          { error: 'You do not have permission to update this group.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to update group', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      group: groupData, 
      success: true 
    }, { status: 200 });
  } catch (error) {
    console.error('[groups/[groupId] PATCH] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

