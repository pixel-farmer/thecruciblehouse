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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
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
      console.error('[artists/[slug] GET] Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersError.message },
        { status: 500 }
      );
    }

    // Find user by slug
    const user = usersData.users.find((u) => {
      const displayName = u.user_metadata?.display_name ||
                         u.user_metadata?.full_name ||
                         u.user_metadata?.name ||
                         u.email?.split('@')[0] ||
                         '';
      const handle = u.user_metadata?.handle || null;
      const userSlug = handle 
        ? handle.replace('@', '').toLowerCase()
        : createSlug(displayName);
      return userSlug === slug;
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    // Get user's artwork
    const { data: artworkData, error: artworkError } = await supabase
      .from('artwork')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (artworkError) {
      console.error('[artists/[slug] GET] Error fetching artwork:', artworkError);
      return NextResponse.json(
        { error: 'Failed to fetch artwork', details: artworkError.message },
        { status: 500 }
      );
    }

    const displayName = user.user_metadata?.display_name ||
                       user.user_metadata?.full_name ||
                       user.user_metadata?.name ||
                       user.email?.split('@')[0] ||
                       'Artist';

    // Get gallery image URL if set
    const galleryImageId = user.user_metadata?.gallery_image_id || null;
    let galleryImageUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
    
    if (galleryImageId && artworkData) {
      const galleryArtwork = artworkData.find((a: any) => a.id === galleryImageId);
      if (galleryArtwork) {
        galleryImageUrl = galleryArtwork.image_url;
      }
    }

    // Get location data (only include if public)
    const city = user.user_metadata?.city || '';
    const state = user.user_metadata?.state || '';
    const country = user.user_metadata?.country || '';
    const cityPublic = user.user_metadata?.city_public !== false;
    const statePublic = user.user_metadata?.state_public !== false;
    const countryPublic = user.user_metadata?.country_public !== false;

    // Check if artist is pro or founder
    const userMetadata = user.user_metadata || {};
    const membershipStatus = userMetadata.membership_status;
    const hasPaidMembership = userMetadata.has_paid_membership;
    const isFounder = userMetadata.is_founder === true;
    const isPro = membershipStatus === 'active' || hasPaidMembership === true || isFounder;

    const discipline = user.user_metadata?.discipline || null;
    const portfolioUrl = user.user_metadata?.portfolio_url || null;

    const artist = {
      id: user.id,
      slug,
      name: displayName,
      bio: user.user_metadata?.bio || null,
      discipline: discipline,
      portfolio_url: portfolioUrl,
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      gallery_image_url: galleryImageUrl,
      artwork: artworkData || [],
      city: city && cityPublic ? city : null,
      state: state && statePublic ? state : null,
      country: country && countryPublic ? country : null,
      created_at: user.created_at || null,
      isPro: isPro,
      isFounder: isFounder,
    };

    return NextResponse.json({ artist });
  } catch (error) {
    console.error('[artists/[slug] GET] Exception:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

