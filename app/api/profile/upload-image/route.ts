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
    console.log('[profile/upload-image] Starting upload request...');
    
    // Verify user is authenticated
    const supabase = await createAuthenticatedSupabaseClient(request);
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[profile/upload-image] Auth error:', userError);
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    console.log('[profile/upload-image] User authenticated:', user.id);

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('[profile/upload-image] No file in form data');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('[profile/upload-image] File received:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    console.log('[profile/upload-image] Uploading to path:', filePath);

    // Check if bucket exists first
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('[profile/upload-image] Error listing buckets:', bucketsError);
    } else {
      const bucketExists = buckets?.some(b => b.name === 'profile-images');
      console.log('[profile/upload-image] Bucket exists:', bucketExists);
      if (!bucketExists) {
        return NextResponse.json(
          { 
            error: 'Storage bucket not configured. Please create "profile-images" bucket in Supabase Storage.',
            details: 'See SUPABASE_PROFILE_STORAGE_SETUP.md for instructions'
          },
          { status: 500 }
        );
      }
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[profile/upload-image] Upload error:', uploadError);
      console.error('[profile/upload-image] Error details:', JSON.stringify(uploadError, null, 2));
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to upload image';
      if (uploadError.message.includes('The resource already exists')) {
        errorMessage = 'An image with this name already exists. Please try again.';
      } else if (uploadError.message.includes('new row violates row-level security')) {
        errorMessage = 'Permission denied. Please check storage bucket policies.';
      } else {
        errorMessage = uploadError.message || errorMessage;
      }
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          details: uploadError.message,
          hint: 'Make sure the "profile-images" bucket exists and has proper policies set up.'
        },
        { status: 500 }
      );
    }

    console.log('[profile/upload-image] Upload successful:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    console.log('[profile/upload-image] Public URL:', urlData?.publicUrl);

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'Failed to get image URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
    });
  } catch (error) {
    console.error('[profile/upload-image] Unexpected error:', error);
    console.error('[profile/upload-image] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

