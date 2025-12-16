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

// GET: Fetch all commission posts
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

    // Fetch commission posts ordered by created_at descending (newest first)
    const { data, error } = await supabase
      .from('commission_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[commissions GET] Supabase error:', error);
      
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database table not found', 
            details: 'The commission_posts table has not been created yet. Please run the SQL migration in Supabase.',
            code: 'TABLE_NOT_FOUND'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch commission posts', 
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ commissions: data || [] });
  } catch (error) {
    console.error('[commissions GET] Exception:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST: Create a new commission post
export async function POST(request: NextRequest) {
  try {
    let supabase;
    try {
      supabase = await createAuthenticatedSupabaseClient(request);
    } catch (clientError: any) {
      console.error('[commissions POST] Error creating Supabase client:', clientError);
      return NextResponse.json(
        { error: 'Failed to initialize database connection', details: clientError.message },
        { status: 500 }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[commissions POST] Auth error:', userError);
      return NextResponse.json(
        { error: 'Authentication required. Please log in to post a job.', details: userError?.message },
        { status: 401 }
      );
    }

    // Verify user has pro membership
    const userMetadata = user.user_metadata || {};
    const membershipStatus = userMetadata.membership_status;
    const hasPaidMembership = userMetadata.has_paid_membership;
    const isFounder = userMetadata.is_founder === true;
    const isPro = membershipStatus === 'active' || hasPaidMembership === true || isFounder;

    if (!isPro) {
      return NextResponse.json(
        { error: 'Pro membership required to post commission jobs. Please upgrade your membership.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      type,
      budgetMin,
      budgetMax,
      location,
      isRemote,
      deadline,
      contactEmail,
      contactPhone,
    } = body;

    // Validation
    if (!title || !description || !category || !type || !budgetMin || !budgetMax || !contactEmail) {
      return NextResponse.json(
        { error: 'Missing required fields', details: { title: !!title, description: !!description, category: !!category, type: !!type, budgetMin: !!budgetMin, budgetMax: !!budgetMax, contactEmail: !!contactEmail } },
        { status: 400 }
      );
    }

    // Get user info - prioritize display_name like other parts of the app
    const email = user.email || '';
    const userName = user.user_metadata?.display_name ||
                    user.user_metadata?.full_name || 
                    user.user_metadata?.name || 
                    email.split('@')[0] || 
                    'Anonymous';

    // Prepare insert data
    const insertData = {
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      category,
      type,
      budget_min: parseFloat(budgetMin),
      budget_max: parseFloat(budgetMax),
      location: location?.trim() || null,
      is_remote: isRemote || false,
      deadline: deadline || null,
      contact_email: contactEmail.trim(),
      contact_phone: contactPhone?.trim() || null,
      client_name: userName,
    };

    console.log('[commissions POST] Inserting data:', JSON.stringify(insertData, null, 2));

    // Insert the commission post
    const { data, error } = await supabase
      .from('commission_posts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[commissions POST] Error creating commission:', error);
      console.error('[commissions POST] Error code:', error.code);
      console.error('[commissions POST] Error message:', error.message);
      console.error('[commissions POST] Error details:', error.details);
      console.error('[commissions POST] Error hint:', error.hint);
      
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database table not found', 
            details: 'The commission_posts table has not been created yet. Please run the SQL migration in Supabase.',
            code: 'TABLE_NOT_FOUND'
          },
          { status: 500 }
        );
      }
      
      if (error.code === '42501' || error.message.includes('permission denied')) {
        return NextResponse.json(
          { error: 'You do not have permission to create commission posts. Please ensure you are logged in.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create commission post', 
          details: error.message,
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ commission: data, success: true }, { status: 201 });
  } catch (error) {
    console.error('[commissions POST] Exception:', error);
    console.error('[commissions POST] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete a commission post
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedSupabaseClient(request);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to delete a commission.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const commissionId = searchParams.get('id');

    if (!commissionId) {
      return NextResponse.json(
        { error: 'Commission ID is required' },
        { status: 400 }
      );
    }

    // Delete the commission post (RLS will ensure user can only delete their own)
    const { data, error } = await supabase
      .from('commission_posts')
      .delete()
      .eq('id', commissionId)
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('[commissions DELETE] Error deleting commission:', error);
      
      if (error.code === '42501' || error.message.includes('permission denied')) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this commission.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to delete commission', details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Commission not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedCount: data.length });
  } catch (error) {
    console.error('[commissions DELETE] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

