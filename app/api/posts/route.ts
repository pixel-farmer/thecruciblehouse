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

// GET: Fetch all posts
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch posts ordered by created_at descending (newest first)
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100); // Limit to 100 most recent posts

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
    const { content, userName, userHandle, userAvatar } = body;

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
    const finalUserName = userName || 
                         user.user_metadata?.full_name || 
                         user.user_metadata?.name || 
                         email.split('@')[0] || 
                         'User';
    
    const finalUserHandle = userHandle || 
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

