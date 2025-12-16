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

// PATCH: Update artwork (title, medium, description)
export async function PATCH(
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

    const body = await request.json();
    const { title, medium, description } = body;

    // Build update object (only include fields that are provided)
    const updateData: any = {};
    if (title !== undefined) {
      updateData.title = title || null;
    }
    if (medium !== undefined) {
      updateData.medium = medium || null;
    }
    if (description !== undefined) {
      updateData.description = description || null;
    }

    // Update the artwork (RLS will ensure user can only update their own artwork)
    const { data: artworkData, error: updateError } = await supabase
      .from('artwork')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own artwork
      .select()
      .single();

    if (updateError) {
      console.error('[artwork/[id] PATCH] Error updating artwork:', updateError);
      
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Artwork not found or you do not have permission to edit it.' },
          { status: 404 }
        );
      }
      
      if (updateError.code === '42501' || updateError.message.includes('permission denied')) {
        return NextResponse.json(
          { error: 'You do not have permission to update this artwork.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to update artwork', details: updateError.message, code: updateError.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      artwork: artworkData, 
      success: true 
    }, { status: 200 });
  } catch (error) {
    console.error('[artwork/[id] PATCH] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

