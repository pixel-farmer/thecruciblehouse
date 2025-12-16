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

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase environment variables' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch active groups with member counts
    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, description, member_count, created_at, creator_id')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (groupsError) {
      console.error('[groups GET] Supabase error:', groupsError);
      return NextResponse.json(
        { error: 'Failed to fetch groups', details: groupsError.message },
        { status: 500 }
      );
    }

    // Use service role client for admin operations
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = supabaseServiceKey 
      ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
      : null;

    // Get actual member counts and creator names from group_members table for each group
    const groupsWithCounts = await Promise.all(
      (groupsData || []).map(async (group) => {
        const { count, error: countError } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        let creatorName = null;
        if (group.creator_id && supabaseAdmin) {
          try {
            const { data: { user: creator } } = await supabaseAdmin.auth.admin.getUserById(group.creator_id);
            if (creator) {
              creatorName = creator.user_metadata?.display_name || 
                           creator.user_metadata?.full_name || 
                           creator.user_metadata?.name || 
                           creator.email?.split('@')[0] || 
                           null;
            }
          } catch (error) {
            console.error('[groups GET] Error fetching creator:', error);
          }
        }

        if (!countError && count !== null) {
          // Update the member_count in the groups table if it differs
          if (count !== group.member_count) {
            await supabase
              .from('groups')
              .update({ member_count: count })
              .eq('id', group.id);
          }
          return { ...group, member_count: count, creator_name: creatorName };
        }
        return { ...group, creator_name: creatorName };
      })
    );

    return NextResponse.json({ groups: groupsWithCounts || [] });
  } catch (error) {
    console.error('[groups GET] Exception:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST: Create a new group (Pro/Founder only)
export async function POST(request: NextRequest) {
  try {
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

    // Check if user is Pro or Founder
    const userMetadata = user.user_metadata || {};
    const membershipStatus = userMetadata.membership_status;
    const hasPaidMembership = userMetadata.has_paid_membership;
    const isFounder = userMetadata.is_founder === true;
    const isPro = membershipStatus === 'active' || hasPaidMembership === true || isFounder;

    if (!isPro) {
      return NextResponse.json(
        { error: 'Pro or Founder membership required to create groups.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Group name must be 100 characters or less' },
        { status: 400 }
      );
    }

    if (description && description.length > 500) {
      return NextResponse.json(
        { error: 'Description must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Create the group
    const { data: groupData, error: createError } = await supabase
      .from('groups')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        creator_id: user.id,
        is_active: true,
        member_count: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error('[groups POST] Error creating group:', createError);
      return NextResponse.json(
        { error: 'Failed to create group', details: createError.message },
        { status: 500 }
      );
    }

    // Automatically add the creator as a member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupData.id,
        user_id: user.id,
      });

    if (memberError) {
      console.error('[groups POST] Error adding creator as member:', memberError);
      // Continue even if this fails - the group was created
    } else {
      // Update member count
      await supabase
        .from('groups')
        .update({ member_count: 1 })
        .eq('id', groupData.id);
    }

    return NextResponse.json({
      success: true,
      group: { ...groupData, member_count: 1 },
    }, { status: 201 });
  } catch (error) {
    console.error('[groups POST] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

