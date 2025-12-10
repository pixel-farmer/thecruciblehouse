import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Helper to create authenticated Supabase client
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

// POST: Set gallery image
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedSupabaseClient(request);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { artwork_id } = body;

    if (!artwork_id) {
      return NextResponse.json(
        { error: 'Artwork ID is required' },
        { status: 400 }
      );
    }

    // Verify the artwork belongs to the user
    const { data: artwork, error: artworkError } = await supabase
      .from('artwork')
      .select('id, user_id')
      .eq('id', artwork_id)
      .eq('user_id', user.id)
      .single();

    if (artworkError || !artwork) {
      return NextResponse.json(
        { error: 'Artwork not found or you do not have permission to set it as gallery image' },
        { status: 404 }
      );
    }

    // Update user metadata with gallery image ID
    const currentMetadata = user.user_metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      gallery_image_id: artwork_id,
    };

    console.log('[artwork/gallery-image POST] Updating user metadata:', {
      userId: user.id,
      artworkId: artwork_id,
      hasMetadata: !!currentMetadata,
    });

    // Update user metadata using the authenticated client
    const { error: updateError } = await supabase.auth.updateUser({
      data: updatedMetadata,
    });

    if (updateError) {
      console.error('[artwork/gallery-image POST] Error updating user:', updateError);
      console.error('[artwork/gallery-image POST] Error details:', JSON.stringify(updateError, null, 2));
      return NextResponse.json(
        {
          error: 'Failed to set gallery image',
          details: updateError.message,
          code: updateError.status,
        },
        { status: 500 }
      );
    }

    console.log('[artwork/gallery-image POST] Gallery image set successfully');

    return NextResponse.json({ success: true, gallery_image_id: artwork_id });
  } catch (error) {
    console.error('[artwork/gallery-image POST] Exception:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

