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

// DELETE: Delete artwork
export async function DELETE(
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

    // Get artwork to verify ownership and get image URL
    const { data: artwork, error: fetchError } = await supabase
      .from('artwork')
      .select('id, image_url, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !artwork) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      );
    }

    // Verify user owns the artwork
    if (artwork.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this artwork.' },
        { status: 403 }
      );
    }

    // Extract file path from image_url for storage deletion
    let storagePath: string | null = null;
    if (artwork.image_url) {
      // Extract path from Supabase storage URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/artwork/[path]
      const urlMatch = artwork.image_url.match(/\/artwork\/(.+)$/);
      if (urlMatch) {
        storagePath = `artwork/${urlMatch[1]}`;
      }
    }

    // Delete from storage if path exists
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from('artwork')
        .remove([storagePath]);
      
      if (storageError) {
        console.error('[artwork/[id] DELETE] Storage error:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('artwork')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Extra safety check

    if (deleteError) {
      console.error('[artwork/[id] DELETE] Database error:', deleteError);
      return NextResponse.json(
        {
          error: 'Failed to delete artwork',
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Artwork deleted successfully',
    });
  } catch (error) {
    console.error('[artwork/[id] DELETE] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

