import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET: Fetch a single open call by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { 
          error: 'Server configuration error', 
          details: 'Supabase configuration is missing.',
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the open call
    const { data, error } = await supabase
      .from('open_calls')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[open-calls/[id] GET] Supabase error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Open call not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch open call', 
          details: error.message,
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Open call not found' },
        { status: 404 }
      );
    }

    // Fetch user information
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

    let owner = {
      id: data.user_id,
      name: data.organizer_name || 'User',
      avatar: null,
      initials: 'U',
      slug: 'user',
    };

    if (!usersError && usersData?.users) {
      const user = usersData.users.find((u: any) => u.id === data.user_id);
      if (user) {
        const displayName = user.user_metadata?.display_name ||
                          user.user_metadata?.full_name ||
                          user.user_metadata?.name ||
                          user.email?.split('@')[0] ||
                          'User';
        
        const handle = user.user_metadata?.handle || null;
        const slug = handle 
          ? handle.replace('@', '').toLowerCase()
          : displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'user';

        const avatar = user.user_metadata?.avatar_url || 
                      user.user_metadata?.picture || 
                      null;

        // Get initials for avatar
        let initials = 'U';
        const nameForInitials = displayName;
        if (nameForInitials && nameForInitials !== user.email?.split('@')[0]) {
          const nameParts = nameForInitials.split(' ').filter((part: string) => part.length > 0);
          if (nameParts.length >= 2) {
            initials = `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
          } else if (nameParts.length === 1 && nameParts[0].length > 0) {
            initials = nameParts[0][0].toUpperCase();
          }
        } else if (user.email && user.email.length > 0) {
          initials = user.email[0].toUpperCase();
        }

        owner = {
          id: user.id,
          name: displayName,
          avatar,
          initials,
          slug,
        };
      }
    }

    return NextResponse.json({ 
      openCall: {
        ...data,
        owner,
      }
    });
  } catch (error) {
    console.error('[open-calls/[id] GET] Exception:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
