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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { avatarUrl, portfolioUrl } = body;

    console.log('[profile/update] Received update request:', {
      hasAvatarUrl: avatarUrl !== undefined,
      hasPortfolioUrl: portfolioUrl !== undefined,
      portfolioUrlValue: portfolioUrl,
    });

    // Verify user is authenticated
    const supabase = await createAuthenticatedSupabaseClient(request);
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[profile/update] Auth error:', userError);
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    console.log('[profile/update] User authenticated:', user.id);

    // Prepare metadata update - preserve existing metadata
    const updatedMetadata = { ...(user.user_metadata || {}) };
    
    // Only update avatar if provided
    if (avatarUrl !== undefined) {
      updatedMetadata.avatar_url = avatarUrl || null;
      updatedMetadata.picture = avatarUrl || null; // Also update picture field for consistency
      console.log('[profile/update] Updating avatar:', avatarUrl ? 'has URL' : 'clearing');
    }
    
    // Always update portfolio URL if provided (even if null to clear it)
    if (portfolioUrl !== undefined) {
      // Handle empty string as null
      const finalPortfolioUrl = (portfolioUrl && portfolioUrl.trim()) ? portfolioUrl.trim() : null;
      updatedMetadata.portfolio_url = finalPortfolioUrl;
      console.log('[profile/update] Updating portfolio URL:', finalPortfolioUrl || 'clearing');
    }

    console.log('[profile/update] Updated metadata:', {
      hasAvatar: !!updatedMetadata.avatar_url,
      hasPortfolio: !!updatedMetadata.portfolio_url,
      portfolioUrl: updatedMetadata.portfolio_url,
    });

    // Update user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: updatedMetadata,
    });

    if (updateError) {
      console.error('[profile/update] Error updating user:', updateError);
      console.error('[profile/update] Error details:', JSON.stringify(updateError, null, 2));
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('[profile/update] Profile updated successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[profile/update] Unexpected error:', error);
    console.error('[profile/update] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

