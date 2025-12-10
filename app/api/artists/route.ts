import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = "nodejs";

// Helper to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase environment variables' },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get all users who have artwork
    const { data: artworkData, error: artworkError } = await supabase
      .from('artwork')
      .select('user_id, image_url, created_at')
      .order('created_at', { ascending: false });

    if (artworkError) {
      console.error('[artists GET] Error fetching artwork:', artworkError);
      return NextResponse.json(
        { error: 'Failed to fetch artwork', details: artworkError.message },
        { status: 500 }
      );
    }

    if (!artworkData || artworkData.length === 0) {
      return NextResponse.json({ artists: [] });
    }

    // Get unique user IDs
    const userIds = [...new Set(artworkData.map(a => a.user_id))];

    // Fetch all users using admin API
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('[artists GET] Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersError.message },
        { status: 500 }
      );
    }

    // Create a map of user_id to first artwork
    const firstArtworkMap = new Map<string, string>();
    artworkData.forEach((artwork) => {
      if (!firstArtworkMap.has(artwork.user_id)) {
        firstArtworkMap.set(artwork.user_id, artwork.image_url);
      }
    });

    // Get all artwork for users to find gallery images
    const { data: allArtworkData } = await supabase
      .from('artwork')
      .select('id, user_id, image_url')
      .in('user_id', userIds);

    // Create a map of user_id to artwork by ID
    const artworkByIdMap = new Map<string, any>();
    allArtworkData?.forEach((artwork) => {
      artworkByIdMap.set(artwork.id, artwork);
    });

    // Build artists array with user metadata
    const artists = usersData.users
      .filter((user) => userIds.includes(user.id))
      .map((user) => {
        const displayName = user.user_metadata?.display_name ||
                           user.user_metadata?.full_name ||
                           user.user_metadata?.name ||
                           user.email?.split('@')[0] ||
                           'Artist';
        
        const handle = user.user_metadata?.handle || null;
        const slug = handle 
          ? handle.replace('@', '').toLowerCase()
          : createSlug(displayName);

        // Get gallery image if set, otherwise use first artwork
        const galleryImageId = user.user_metadata?.gallery_image_id || null;
        let thumbnail = firstArtworkMap.get(user.id) || null;
        
        if (galleryImageId && artworkByIdMap.has(galleryImageId)) {
          const galleryArtwork = artworkByIdMap.get(galleryImageId);
          if (galleryArtwork && galleryArtwork.user_id === user.id) {
            thumbnail = galleryArtwork.image_url;
          }
        }

        return {
          id: user.id,
          slug,
          name: displayName,
          bio: user.user_metadata?.bio || null,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          thumbnail,
        };
      })
      .filter((artist) => artist.thumbnail !== null); // Only include artists with artwork

    return NextResponse.json({ artists });
  } catch (error) {
    console.error('[artists GET] Exception:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

