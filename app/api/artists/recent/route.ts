import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Fetch all users using admin API
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('[artists/recent GET] Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersError.message },
        { status: 500 }
      );
    }

    // Sort users by created_at (most recent first) and limit to 8
    const recentArtists = usersData.users
      .filter((user) => {
        // Only include users who have a display name or email
        const displayName = user.user_metadata?.display_name ||
                           user.user_metadata?.full_name ||
                           user.user_metadata?.name ||
                           user.email?.split('@')[0];
        return !!displayName;
      })
      .sort((a, b) => {
        // Sort by created_at descending (most recent first)
        const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bCreated - aCreated;
      })
      .slice(0, 8) // Get top 8 most recently joined
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

        const avatarUrl = user.user_metadata?.avatar_url || 
                         user.user_metadata?.picture || 
                         null;

        // Generate initials for avatar fallback
        let initials = 'A';
        const nameForInitials = user.user_metadata?.display_name ||
                               user.user_metadata?.full_name ||
                               user.user_metadata?.name;
        if (nameForInitials) {
          const nameParts = nameForInitials.split(' ');
          initials = nameParts.length >= 2
            ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
            : nameParts[0][0].toUpperCase();
        } else if (user.email) {
          initials = user.email[0].toUpperCase();
        }

        const discipline = user.user_metadata?.discipline || null;

        return {
          id: user.id,
          slug,
          name: displayName,
          avatar_url: avatarUrl,
          initials,
          discipline,
        };
      });

    return NextResponse.json({ artists: recentArtists });
  } catch (error) {
    console.error('[artists/recent GET] Exception:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

