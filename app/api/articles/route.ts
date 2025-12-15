import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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

// GET: Fetch all articles
export async function GET() {
  try {
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

    // Fetch articles ordered by created_at descending (newest first)
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[articles GET] Supabase error:', error);
      
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database table not found', 
            details: 'The articles table has not been created yet. Please run the SQL migration in Supabase.',
            code: 'TABLE_NOT_FOUND'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch articles', 
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ articles: data || [] });
  } catch (error) {
    console.error('[articles GET] Exception:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST: Create a new article
export async function POST(request: NextRequest) {
  try {
    let supabase;
    try {
      supabase = await createAuthenticatedSupabaseClient(request);
    } catch (clientError: any) {
      console.error('[articles POST] Error creating Supabase client:', clientError);
      return NextResponse.json(
        { error: 'Failed to initialize database connection', details: clientError.message },
        { status: 500 }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[articles POST] Auth error:', userError);
      return NextResponse.json(
        { error: 'Authentication required. Please log in to post an article.', details: userError?.message },
        { status: 401 }
      );
    }

    // Verify user has pro membership
    const userMetadata = user.user_metadata || {};
    const membershipStatus = userMetadata.membership_status;
    const hasPaidMembership = userMetadata.has_paid_membership;
    const isPro = membershipStatus === 'active' || hasPaidMembership === true;

    if (!isPro) {
      return NextResponse.json(
        { error: 'Pro membership required to post articles. Please upgrade your membership.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      excerpt,
      category,
      content,
      author,
      readTime,
    } = body;

    // Validation
    if (!title || !excerpt || !category || !content || !author) {
      return NextResponse.json(
        { error: 'Missing required fields', details: { title: !!title, excerpt: !!excerpt, category: !!category, content: !!content, author: !!author } },
        { status: 400 }
      );
    }

    // Prepare insert data
    const insertData = {
      user_id: user.id,
      title: title.trim(),
      excerpt: excerpt.trim(),
      category,
      content: content.trim(),
      author: author.trim(),
      read_time: readTime || '5 min read',
    };

    console.log('[articles POST] Inserting data:', JSON.stringify(insertData, null, 2));

    // Insert the article
    const { data, error } = await supabase
      .from('articles')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[articles POST] Supabase error:', error);
      
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database table not found', 
            details: 'The articles table has not been created yet. Please run the SQL migration in Supabase.',
            code: 'TABLE_NOT_FOUND'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create article', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ article: data, success: true }, { status: 201 });
  } catch (error) {
    console.error('[articles POST] Exception:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

