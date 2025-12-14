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

  // Fallback: Try to get from cookies (Supabase stores session in cookies)
  if (!accessToken) {
    const cookieStore = await cookies();
    // Supabase uses different cookie names based on project ref
    // Try common patterns
    const allCookies = cookieStore.getAll();
    for (const cookie of allCookies) {
      if (cookie.name.includes('access-token') || cookie.name.includes('sb-')) {
        // Try to extract token from cookie value
        try {
          const cookieValue = JSON.parse(cookie.value);
          if (cookieValue.access_token) {
            accessToken = cookieValue.access_token;
            break;
          }
        } catch {
          // Cookie might not be JSON, try as direct token
          if (cookie.value.length > 50) {
            accessToken = cookie.value;
            break;
          }
        }
      }
    }
  }

  // Create client with access token if available
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

// GET: Fetch all posts (optionally filtered by group_id)
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[posts GET] Missing Supabase environment variables:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      });
      return NextResponse.json(
        { 
          error: 'Server configuration error', 
          details: 'supabaseKey is required.',
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get group_id from query parameters
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('group_id');

    // Build query
    let query = supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100); // Limit to 100 most recent posts

    // Filter by group_id if provided
    if (groupId) {
      query = query.eq('group_id', groupId);
    } else {
      // If no group_id, only fetch general posts (group_id is NULL)
      query = query.is('group_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[posts GET] Supabase error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch posts', 
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ posts: data || [] });
  } catch (error) {
    console.error('[posts GET] Exception:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST: Create a new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, userName, userHandle, userAvatar, groupId } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Post content is required' },
        { status: 400 }
      );
    }

    if (content.length > 300) {
      return NextResponse.json(
        { error: 'Post content must be 300 characters or less' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const supabase = await createAuthenticatedSupabaseClient(request);
    
    // Get the user from the access token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to post.' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const email = user.email || '';
    
    // Use user info from user object if not provided
    // Priority: display_name > full_name > name > email username > 'User'
    const finalUserName = userName || 
                         user.user_metadata?.display_name ||
                         user.user_metadata?.full_name || 
                         user.user_metadata?.name || 
                         email.split('@')[0] || 
                         'User';
    
    const finalUserHandle = userHandle || 
                           user.user_metadata?.handle ||
                           (email ? `@${email.split('@')[0]}` : '@user');
    
    // Get user initials for avatar
    let finalUserAvatar = userAvatar;
    if (!finalUserAvatar) {
      const name = user.user_metadata?.full_name || 
                  user.user_metadata?.name || '';
      if (name) {
        const nameParts = name.split(' ');
        finalUserAvatar = nameParts.length >= 2 
          ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
          : nameParts[0][0].toUpperCase();
      } else if (email) {
        finalUserAvatar = email[0].toUpperCase();
      } else {
        finalUserAvatar = 'U';
      }
    }

    // Insert the post using the authenticated client (RLS will enforce permissions)
    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        user_id: userId,
        content: content.trim(),
        user_name: finalUserName,
        user_handle: finalUserHandle,
        user_avatar: finalUserAvatar,
        group_id: groupId || null, // Set group_id if provided, otherwise null for general posts
      })
      .select()
      .single();

    if (error) {
      console.error('[posts] Error creating post:', error);
      
      // Check if it's an RLS policy violation
      if (error.code === '42501' || error.message.includes('permission denied')) {
        return NextResponse.json(
          { error: 'You do not have permission to create posts. Please ensure you are logged in.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create post', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ post: data, success: true }, { status: 201 });
  } catch (error) {
    console.error('[posts] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a single post or all posts for the authenticated user
export async function DELETE(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createAuthenticatedSupabaseClient(request);
    
    // Get the user from the access token
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

    const userId = user.id;

    // Check if a post ID is provided in the query string
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');

    if (postId) {
      // Delete a single post
      const { data, error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId); // Ensure user can only delete their own posts

      if (error) {
        console.error('[posts DELETE] Error deleting post:', error);
        
        // Check if it's an RLS policy violation
        if (error.code === '42501' || error.message.includes('permission denied')) {
          return NextResponse.json(
            { error: 'You do not have permission to delete this post.' },
            { status: 403 }
          );
        }
        
        return NextResponse.json(
          { error: 'Failed to delete post', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Post deleted successfully'
      });
    } else {
      // Delete all posts for this user (RLS policy will ensure they can only delete their own)
      const { data, error } = await supabase
        .from('community_posts')
        .delete()
        .eq('user_id', userId)
        .select(); // Add select to get deleted rows

      if (error) {
        console.error('[posts DELETE] Error deleting posts:', error);
        
        // Check if it's an RLS policy violation
        if (error.code === '42501' || error.message.includes('permission denied')) {
          return NextResponse.json(
            { error: 'You do not have permission to delete posts.' },
            { status: 403 }
          );
        }
        
        return NextResponse.json(
          { error: 'Failed to delete posts', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        message: 'All posts deleted successfully',
        deletedCount: Array.isArray(data) ? data.length : 0
      });
    }
  } catch (error) {
    console.error('[posts DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

