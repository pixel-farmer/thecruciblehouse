import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabase-server';

// Helper to create authenticated Supabase client
async function createAuthenticatedSupabaseClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const authHeader = request.headers.get('authorization');
  let accessToken = authHeader?.replace('Bearer ', '') || null;

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

// GET: Fetch all conversations for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedSupabaseClient(request);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch conversations where user is either user1 or user2
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (convError) {
      console.error('[conversations GET] Error:', convError);
      return NextResponse.json(
        { error: 'Failed to fetch conversations', details: convError.message },
        { status: 500 }
      );
    }

    // Get unread message counts and other participant info for each conversation
    const conversationsWithDetails = await Promise.all(
      (conversations || []).map(async (conv) => {
        const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
        
        // Get other user's info
        const { data: { user: otherUser } } = await supabaseServer.auth.admin.getUserById(otherUserId);
        
        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .neq('sender_id', user.id);

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const otherUserDisplayName = otherUser?.user_metadata?.display_name || 
                                   otherUser?.user_metadata?.full_name || 
                                   otherUser?.user_metadata?.name || 
                                   otherUser?.email?.split('@')[0] || 
                                   'User';
        
        const otherUserAvatar = otherUser?.user_metadata?.avatar_url || 
                              otherUser?.user_metadata?.picture || null;

        // Check if other user is pro
        const otherUserMetadata = otherUser?.user_metadata || {};
        const membershipStatus = otherUserMetadata.membership_status;
        const hasPaidMembership = otherUserMetadata.has_paid_membership;
        const otherUserIsPro = membershipStatus === 'active' || hasPaidMembership === true;

        return {
          ...conv,
          otherUser: {
            id: otherUserId,
            name: otherUserDisplayName,
            avatar: otherUserAvatar,
            isPro: otherUserIsPro,
          },
          unreadCount: unreadCount || 0,
          lastMessage: lastMessage || null,
        };
      })
    );

    return NextResponse.json({ conversations: conversationsWithDetails || [] });
  } catch (error) {
    console.error('[conversations GET] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST: Create a new conversation or get existing one
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedSupabaseClient(request);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { otherUserId } = await request.json();

    if (!otherUserId) {
      return NextResponse.json(
        { error: 'Other user ID is required' },
        { status: 400 }
      );
    }

    if (otherUserId === user.id) {
      return NextResponse.json(
        { error: 'Cannot create conversation with yourself' },
        { status: 400 }
      );
    }

    // Check if conversation already exists (order user IDs to ensure uniqueness)
    const user1Id = user.id < otherUserId ? user.id : otherUserId;
    const user2Id = user.id < otherUserId ? otherUserId : user.id;

    const { data: existingConv } = await supabase
      .from('conversations')
      .select('*')
      .eq('user1_id', user1Id)
      .eq('user2_id', user2Id)
      .single();

    if (existingConv) {
      return NextResponse.json({ conversation: existingConv });
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id,
      })
      .select()
      .single();

    if (createError) {
      console.error('[conversations POST] Error:', createError);
      return NextResponse.json(
        { error: 'Failed to create conversation', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ conversation: newConversation });
  } catch (error) {
    console.error('[conversations POST] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

