import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Helper to create Supabase client with user session for authentication
async function createAuthenticatedSupabaseClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Get access token from Authorization header first, then try cookies
  const authHeader = request.headers.get('authorization');
  let accessToken = authHeader?.replace('Bearer ', '') || null;

  // Fallback: Try to get from cookies
  if (!accessToken) {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    for (const cookie of allCookies) {
      if (cookie.name.includes('access-token') || cookie.name.includes('sb-')) {
        try {
          const cookieValue = JSON.parse(cookie.value);
          if (cookieValue.access_token) {
            accessToken = cookieValue.access_token;
            break;
          }
        } catch {
          if (cookie.value.length > 50) {
            accessToken = cookie.value;
            break;
          }
        }
      }
    }
  }

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

// GET: Check if user is a member of the group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const supabase = await createAuthenticatedSupabaseClient(request);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ isMember: false });
    }

    const { count, error } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[groups members GET] Error:', error);
      return NextResponse.json({ isMember: false });
    }

    return NextResponse.json({ isMember: (count || 0) > 0 });
  } catch (error) {
    console.error('[groups members GET] Exception:', error);
    return NextResponse.json({ isMember: false });
  }
}

// POST: Join a group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const supabase = await createAuthenticatedSupabaseClient(request);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to join a group.' },
        { status: 401 }
      );
    }

    // Check if user is already a member
    const { data: existingMember, error: checkError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      return NextResponse.json({ success: true, message: 'Already a member' });
    }

    // Add user to group
    const { error: insertError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: user.id,
      });

    if (insertError) {
      console.error('[groups members POST] Error:', insertError);
      return NextResponse.json(
        { error: 'Failed to join group', details: insertError.message },
        { status: 500 }
      );
    }

    // Update member count in groups table
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const adminSupabase = createClient(supabaseUrl!, supabaseKey!);
    
    const { count } = await adminSupabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);

    await adminSupabase
      .from('groups')
      .update({ member_count: count || 0 })
      .eq('id', groupId);

    return NextResponse.json({ 
      success: true, 
      memberCount: count || 0 
    });
  } catch (error) {
    console.error('[groups members POST] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE: Leave a group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const supabase = await createAuthenticatedSupabaseClient(request);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to leave a group.' },
        { status: 401 }
      );
    }

    // Remove user from group
    const { error: deleteError } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[groups members DELETE] Error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to leave group', details: deleteError.message },
        { status: 500 }
      );
    }

    // Update member count in groups table
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const adminSupabase = createClient(supabaseUrl!, supabaseKey!);
    
    const { count } = await adminSupabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);

    await adminSupabase
      .from('groups')
      .update({ member_count: count || 0 })
      .eq('id', groupId);

    return NextResponse.json({ 
      success: true, 
      memberCount: count || 0 
    });
  } catch (error) {
    console.error('[groups members DELETE] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

