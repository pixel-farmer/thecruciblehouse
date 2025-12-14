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

    // Get most recent posts to find active users
    const { data: postsData, error: postsError } = await supabase
      .from('community_posts')
      .select('user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(50); // Get more posts to find unique users

    if (postsError) {
      console.error('[members/recent GET] Error fetching posts:', postsError);
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: postsError.message },
        { status: 500 }
      );
    }

    // Get unique user IDs with their most recent post time
    const userActivityMap = new Map<string, Date>();
    if (postsData) {
      postsData.forEach((post: any) => {
        const userId = post.user_id;
        const postTime = new Date(post.created_at);
        const existingTime = userActivityMap.get(userId);
        
        if (!existingTime || postTime > existingTime) {
          userActivityMap.set(userId, postTime);
        }
      });
    }

    // Fetch all users using admin API
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('[members/recent GET] Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersError.message },
        { status: 500 }
      );
    }

    // Create array of users with their activity times
    const usersWithActivity = usersData.users
      .map((user) => {
        const postActivity = userActivityMap.get(user.id);
        
        // Try to parse dates safely
        let lastSignIn: Date | null = null;
        if (user.last_sign_in_at) {
          try {
            lastSignIn = new Date(user.last_sign_in_at);
            if (isNaN(lastSignIn.getTime())) lastSignIn = null;
          } catch (e) {
            lastSignIn = null;
          }
        }
        
        let created: Date | null = null;
        if (user.created_at) {
          try {
            created = new Date(user.created_at);
            if (isNaN(created.getTime())) created = null;
          } catch (e) {
            created = null;
          }
        }
        
        // Use most recent activity: post activity > last sign in > created
        // Always ensure we have at least created_at (should always exist)
        let activityTime: Date = created || new Date(); // Fallback to now if created_at is missing
        
        if (postActivity) {
          activityTime = postActivity;
        } else if (lastSignIn) {
          activityTime = lastSignIn;
        }

        return {
          user,
          activityTime,
        };
      })
      .sort((a, b) => {
        // Sort by most recent activity first
        if (!a.activityTime || !b.activityTime) return 0;
        return b.activityTime.getTime() - a.activityTime.getTime();
      })
      .slice(0, 3) // Get top 3 most recent
      .map((item) => {
        const user = item.user;
        const displayName = user.user_metadata?.display_name ||
                           user.user_metadata?.full_name ||
                           user.user_metadata?.name ||
                           user.email?.split('@')[0] ||
                           'User';
        
        const avatarUrl = user.user_metadata?.avatar_url ||
                         user.user_metadata?.picture ||
                         null;

        // Generate initials
        let initials = 'U';
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

        // Format activity time
        const activityTime = item.activityTime!;
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000);
        
        let activityText = '';
        if (diffInSeconds < 60) {
          activityText = 'Active just now';
        } else if (diffInSeconds < 3600) {
          const minutes = Math.floor(diffInSeconds / 60);
          activityText = `Active ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
        } else if (diffInSeconds < 86400) {
          const hours = Math.floor(diffInSeconds / 3600);
          activityText = `Active ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        } else if (diffInSeconds < 604800) {
          const days = Math.floor(diffInSeconds / 86400);
          activityText = `Active ${days} ${days === 1 ? 'day' : 'days'} ago`;
        } else {
          const weeks = Math.floor(diffInSeconds / 604800);
          activityText = `Active ${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
        }

        // Generate slug from handle or name
        const handle = user.user_metadata?.handle || null;
        const slug = handle 
          ? handle.replace('@', '').toLowerCase()
          : displayName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '');

        return {
          id: user.id,
          name: displayName,
          avatar: avatarUrl,
          initials,
          activity: activityText,
          slug,
        };
      });

    return NextResponse.json({ members: usersWithActivity });
  } catch (error) {
    console.error('[members/recent GET] Exception:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

