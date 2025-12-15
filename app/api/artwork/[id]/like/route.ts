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

// POST: Like an artwork
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createAuthenticatedSupabaseClient(request);

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to like artwork.' },
        { status: 401 }
      );
    }

    // Check if like already exists
    const { data: existingLike, error: checkError } = await supabase
      .from('artwork_likes')
      .select('id')
      .eq('artwork_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is fine
      console.error('[artwork/like POST] Error checking existing like:', checkError);
      return NextResponse.json(
        { error: 'Failed to check like status', details: checkError.message, code: checkError.code },
        { status: 500 }
      );
    }

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked', liked: true },
        { status: 400 }
      );
    }

    // Create the like
    const { data, error } = await supabase
      .from('artwork_likes')
      .insert({
        artwork_id: id,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[artwork/like POST] Error creating like:', error);
      console.error('[artwork/like POST] Error code:', error.code);
      console.error('[artwork/like POST] Error message:', error.message);
      console.error('[artwork/like POST] Error details:', error.details);
      console.error('[artwork/like POST] Error hint:', error.hint);
      
      // Check if it's a table doesn't exist error
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Artwork likes table not found. Please run the migration to create the artwork_likes table.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to like artwork', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    // Get updated like count
    const { count } = await supabase
      .from('artwork_likes')
      .select('*', { count: 'exact', head: true })
      .eq('artwork_id', id);

    return NextResponse.json({ 
      liked: true, 
      likeCount: count || 0 
    }, { status: 201 });
  } catch (error) {
    console.error('[artwork/like POST] Exception:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE: Unlike an artwork
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Delete the like
    const { error } = await supabase
      .from('artwork_likes')
      .delete()
      .eq('artwork_id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[artwork/like DELETE] Error deleting like:', error);
      console.error('[artwork/like DELETE] Error code:', error.code);
      console.error('[artwork/like DELETE] Error message:', error.message);
      
      // Check if it's a table doesn't exist error
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Artwork likes table not found. Please run the migration to create the artwork_likes table.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to unlike artwork', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    // Get updated like count
    const { count } = await supabase
      .from('artwork_likes')
      .select('*', { count: 'exact', head: true })
      .eq('artwork_id', id);

    return NextResponse.json({ 
      liked: false, 
      likeCount: count || 0 
    });
  } catch (error) {
    console.error('[artwork/like DELETE] Exception:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET: Check if artwork is liked by current user and get like count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Missing Supabase environment variables' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    // Get access token from Authorization header if available
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    let isLiked = false;
    if (accessToken) {
      const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      });

      const {
        data: { user },
      } = await authenticatedSupabase.auth.getUser();

      if (user) {
        const { data: like } = await authenticatedSupabase
          .from('artwork_likes')
          .select('id')
          .eq('artwork_id', id)
          .eq('user_id', user.id)
          .single();

        isLiked = !!like;
      }
    }

    // Get like count (anyone can see this)
    const { count } = await supabase
      .from('artwork_likes')
      .select('*', { count: 'exact', head: true })
      .eq('artwork_id', id);

    return NextResponse.json({
      isLiked,
      likeCount: count || 0,
    });
  } catch (error) {
    console.error('[artwork/like GET] Exception:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

