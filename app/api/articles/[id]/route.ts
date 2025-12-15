import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper to create Supabase client with user session for authentication
async function createAuthenticatedSupabaseClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Get access token from Authorization header first, then try cookies
  const authHeader = request.headers.get('authorization');
  let accessToken = authHeader?.replace('Bearer ', '') || null;

  // Fallback: Try to get from cookies (Supabase stores session in cookies)
  if (!accessToken) {
    const { cookies } = await import('next/headers');
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

  // Create client with access token if available
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  });

  return client;
}

// GET: Fetch a single article by ID
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

    // Fetch article by ID
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[articles/[id] GET] Supabase error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch article', 
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ article: data });
  } catch (error) {
    console.error('[articles/[id] GET] Exception:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH: Update an article
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let supabase;
    try {
      supabase = await createAuthenticatedSupabaseClient(request);
    } catch (clientError: any) {
      console.error('[articles/[id] PATCH] Error creating Supabase client:', clientError);
      return NextResponse.json(
        { error: 'Failed to initialize database connection', details: clientError.message },
        { status: 500 }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[articles/[id] PATCH] Auth error:', userError);
      return NextResponse.json(
        { error: 'Authentication required. Please log in to update an article.', details: userError?.message },
        { status: 401 }
      );
    }

    // Fetch the article to check ownership
    const { data: existingArticle, error: fetchError } = await supabase
      .from('articles')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Check if user owns the article
    if (existingArticle.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this article.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      excerpt,
      category,
      content,
      readTime,
    } = body;

    // Validation
    if (!title || !excerpt || !category || !content) {
      return NextResponse.json(
        { error: 'Missing required fields', details: { title: !!title, excerpt: !!excerpt, category: !!category, content: !!content } },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      category,
      content: content.trim(),
    };

    if (readTime) {
      updateData.read_time = readTime;
    }

    console.log('[articles/[id] PATCH] Updating article:', id, JSON.stringify(updateData, null, 2));

    // Update the article
    const { data, error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[articles/[id] PATCH] Supabase error:', error);
      
      return NextResponse.json(
        { error: 'Failed to update article', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ article: data, success: true });
  } catch (error) {
    console.error('[articles/[id] PATCH] Exception:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

