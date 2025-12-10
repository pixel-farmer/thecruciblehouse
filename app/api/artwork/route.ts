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

// GET: Fetch user's artwork
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedSupabaseClient(request);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    // Get user_id from query params if provided (for viewing other users' artwork)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || user.id;

    const { data: artwork, error } = await supabase
      .from('artwork')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[artwork GET] Error fetching artwork:', error);
      return NextResponse.json(
        { error: 'Failed to fetch artwork', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ artwork: artwork || [] });
  } catch (error) {
    console.error('[artwork GET] Exception:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST: Upload artwork
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedSupabaseClient(request);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const medium = formData.get('medium') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File must be a JPEG, PNG, or WebP image' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for artwork)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `artwork/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('artwork')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[artwork POST] Upload error:', uploadError);
      
      // Check if it's a bucket not found error
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
        return NextResponse.json(
          {
            error: 'Storage bucket not configured. Please create "artwork" bucket in Supabase Storage.',
            details: uploadError.message,
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        {
          error: 'Failed to upload image',
          details: uploadError.message,
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('artwork')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'Failed to get image URL' },
        { status: 500 }
      );
    }

    // Save artwork record to database
    const { data: artworkData, error: dbError } = await supabase
      .from('artwork')
      .insert({
        user_id: user.id,
        image_url: urlData.publicUrl,
        title: title || null,
        description: description || null,
        medium: medium || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[artwork POST] Database error:', dbError);
      // Try to delete the uploaded file if database insert fails
      await supabase.storage.from('artwork').remove([filePath]);
      return NextResponse.json(
        {
          error: 'Failed to save artwork record',
          details: dbError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      artwork: artworkData,
    });
  } catch (error) {
    console.error('[artwork POST] Exception:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete artwork
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedSupabaseClient(request);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Artwork ID is required' },
        { status: 400 }
      );
    }

    // Get artwork to get the image URL for deletion
    const { data: artwork, error: fetchError } = await supabase
      .from('artwork')
      .select('image_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !artwork) {
      return NextResponse.json(
        { error: 'Artwork not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // Extract file path from URL
    const url = new URL(artwork.image_url);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf('artwork')).join('/');

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('artwork')
      .remove([filePath]);

    if (storageError) {
      console.error('[artwork DELETE] Storage error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('artwork')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (dbError) {
      console.error('[artwork DELETE] Database error:', dbError);
      return NextResponse.json(
        {
          error: 'Failed to delete artwork',
          details: dbError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[artwork DELETE] Exception:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

