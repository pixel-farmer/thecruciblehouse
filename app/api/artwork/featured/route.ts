import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Get like counts for all artwork
    const { data: likesData, error: likesError } = await supabase
      .from('artwork_likes')
      .select('artwork_id');

    if (likesError) {
      console.error('[artwork/featured GET] Error fetching likes:', likesError);
      // If table doesn't exist yet, return empty array
      if (likesError.code === '42P01') {
        return NextResponse.json({ featuredArtwork: [] });
      }
      return NextResponse.json(
        { error: 'Failed to fetch likes', details: likesError.message },
        { status: 500 }
      );
    }

    // Count likes per artwork
    const likeCounts = new Map<string, number>();
    if (likesData) {
      likesData.forEach((like: any) => {
        const count = likeCounts.get(like.artwork_id) || 0;
        likeCounts.set(like.artwork_id, count + 1);
      });
    }

    // Get all artwork
    const { data: artworkData, error: artworkError } = await supabase
      .from('artwork')
      .select('id, image_url, title, user_id')
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false });

    if (artworkError) {
      console.error('[artwork/featured GET] Error fetching artwork:', artworkError);
      return NextResponse.json(
        { error: 'Failed to fetch artwork', details: artworkError.message },
        { status: 500 }
      );
    }

    if (!artworkData || artworkData.length === 0) {
      return NextResponse.json({ featuredArtwork: [] });
    }

    // Add like counts to artwork and sort by likes (descending), then by created_at
    const artworkWithLikes = artworkData.map((artwork: any) => ({
      ...artwork,
      likeCount: likeCounts.get(artwork.id) || 0,
    })).sort((a: any, b: any) => {
      // Sort by like count first, then by created_at (most recent)
      if (b.likeCount !== a.likeCount) {
        return b.likeCount - a.likeCount;
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    // Get top 3
    const topArtwork = artworkWithLikes.slice(0, 3);

    // Get user information for each artwork
    const userIds = [...new Set(topArtwork.map((a: any) => a.user_id))];
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('[artwork/featured GET] Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersError.message },
        { status: 500 }
      );
    }

    // Map user IDs to user data
    const userMap = new Map();
    usersData.users.forEach((user: any) => {
      userMap.set(user.id, user);
    });

    // Build featured artwork array with artist names
    const featuredArtwork = topArtwork.map((artwork: any) => {
      const user = userMap.get(artwork.user_id);
      const artistName = user
        ? (user.user_metadata?.display_name ||
           user.user_metadata?.full_name ||
           user.user_metadata?.name ||
           user.email?.split('@')[0] ||
           'Artist')
        : 'Artist';

      return {
        id: artwork.id,
        image_url: artwork.image_url,
        title: artwork.title,
        artistName,
      };
    });

    return NextResponse.json({ featuredArtwork });
  } catch (error) {
    console.error('[artwork/featured GET] Exception:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

