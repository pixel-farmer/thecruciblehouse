import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = "nodejs";

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

    // Fetch all users using admin API
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('[artists/locations GET] Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersError.message },
        { status: 500 }
      );
    }

    // Get all users who have artwork
    const { data: artworkData } = await supabase
      .from('artwork')
      .select('user_id')
      .order('created_at', { ascending: false });

    const userIdsWithArtwork = new Set(artworkData?.map(a => a.user_id) || []);

    // Filter users who have public location info, artwork, and are artists
    const artistsWithLocations = usersData.users
      .filter((user) => {
        // Must have artwork
        if (!userIdsWithArtwork.has(user.id)) return false;

        const city = user.user_metadata?.city || '';
        const state = user.user_metadata?.state || '';
        const cityPublic = user.user_metadata?.city_public !== false;
        const statePublic = user.user_metadata?.state_public !== false;
        
        // Must have at least one public location field
        return (city && cityPublic) || (state && statePublic);
      })
      .map((user) => {
        const displayName = user.user_metadata?.display_name ||
                           user.user_metadata?.full_name ||
                           user.user_metadata?.name ||
                           user.email?.split('@')[0] ||
                           'Artist';
        
        const city = user.user_metadata?.city || '';
        const state = user.user_metadata?.state || '';
        const cityPublic = user.user_metadata?.city_public !== false;
        const statePublic = user.user_metadata?.state_public !== false;

        // Build location string with only public fields
        const locationParts: string[] = [];
        if (city && cityPublic) locationParts.push(city);
        if (state && statePublic) locationParts.push(state);
        const location = locationParts.join(', ');

        return {
          id: user.id,
          name: displayName,
          location: location,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        };
      })
      .filter((artist) => artist.location); // Only include if we have a location

    return NextResponse.json({ artists: artistsWithLocations });
  } catch (error) {
    console.error('[artists/locations GET] Exception:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

