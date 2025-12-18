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

// GET: Fetch all open calls
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

    // Fetch open calls ordered by created_at descending (newest first)
    const { data, error } = await supabase
      .from('open_calls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[open-calls GET] Supabase error:', error);
      
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database table not found', 
            details: 'The open_calls table has not been created yet. Please run the SQL migration in Supabase.',
            code: 'TABLE_NOT_FOUND'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch open calls', 
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    // Fetch user information for all open calls
    const userIds = [...new Set((data || []).map((call: any) => call.user_id))];
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('[open-calls GET] Error fetching users:', usersError);
      // Continue without user data if there's an error
    }

    // Create a map of user_id to user data
    const userMap = new Map();
    if (usersData?.users) {
      usersData.users.forEach((user: any) => {
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

        userMap.set(user.id, {
          id: user.id,
          name: displayName,
          avatar,
          initials,
          slug,
        });
      });
    }

    // Map user data to each open call
    const openCallsWithUsers = (data || []).map((call: any) => {
      const user = userMap.get(call.user_id);
      return {
        ...call,
        owner: user || {
          id: call.user_id,
          name: call.organizer_name || 'User',
          avatar: null,
          initials: 'U',
          slug: 'user',
        },
      };
    });

    return NextResponse.json({ openCalls: openCallsWithUsers });
  } catch (error) {
    console.error('[open-calls GET] Exception:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST: Create a new open call
export async function POST(request: NextRequest) {
  try {
    // Ensure we can read the request body
    if (!request.body) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      );
    }

    let supabase;
    try {
      supabase = await createAuthenticatedSupabaseClient(request);
    } catch (clientError: any) {
      console.error('[open-calls POST] Error creating Supabase client:', clientError);
      return NextResponse.json(
        { error: 'Failed to initialize database connection', details: clientError?.message || String(clientError) },
        { status: 500 }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[open-calls POST] Auth error:', userError);
      return NextResponse.json(
        { error: 'Authentication required. Please log in to post an open call.', details: userError?.message },
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
        { error: 'Pro membership required to post open calls. Please upgrade your membership.' },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[open-calls POST] Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body. Please check your form data.' },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      category,
      type,
      city,
      state,
      country,
      isRemote,
      deadline,
      prizes,
      applicationFee,
      feeCurrency,
      contactEmail,
      galleryName,
      website,
      headerImage,
    } = body;

    // Validation
    if (!title || !description || !category || !type || !deadline || !contactEmail || !website) {
      return NextResponse.json(
        { error: 'Missing required fields', details: { title: !!title, description: !!description, category: !!category, type: !!type, deadline: !!deadline, contactEmail: !!contactEmail, website: !!website } },
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
      city: city?.trim() || null,
      state: state?.trim() || null,
      country: country?.trim() || null,
      is_remote: isRemote || false,
      deadline: deadline,
      prizes: prizes?.trim() || null,
      application_fee: applicationFee ? parseFloat(applicationFee) : 0,
      fee_currency: feeCurrency || 'USD',
      view_count: 0,
      contact_email: contactEmail.trim(),
      gallery_name: galleryName?.trim() || null,
      website: website.trim(),
      header_image: headerImage?.trim() || null,
      organizer_name: userName,
    };

    console.log('[open-calls POST] Inserting data:', JSON.stringify(insertData, null, 2));

    // Insert the open call
    const { data, error } = await supabase
      .from('open_calls')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[open-calls POST] Error creating open call:', error);
      console.error('[open-calls POST] Error code:', error.code);
      console.error('[open-calls POST] Error message:', error.message);
      console.error('[open-calls POST] Error details:', error.details);
      console.error('[open-calls POST] Error hint:', error.hint);
      
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database table not found', 
            details: 'The open_calls table has not been created yet. Please run the SQL migration in Supabase.',
            code: 'TABLE_NOT_FOUND'
          },
          { status: 500 }
        );
      }
      
      if (error.code === '42501' || error.message.includes('permission denied')) {
        return NextResponse.json(
          { error: 'You do not have permission to create open calls. Please ensure you are logged in.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create open call', 
          details: error.message,
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ openCall: data, success: true }, { status: 201 });
  } catch (error) {
    console.error('[open-calls POST] Exception:', error);
    console.error('[open-calls POST] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[open-calls POST] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[open-calls POST] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return detailed error for debugging (remove stack in production)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : typeof error,
        // Only include stack in development
        ...(process.env.NODE_ENV === 'development' && error instanceof Error ? { stack: error.stack } : {})
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete an open call
export async function DELETE(request: NextRequest) {
  try {
    let supabase;
    try {
      supabase = await createAuthenticatedSupabaseClient(request);
    } catch (clientError: any) {
      console.error('[open-calls DELETE] Error creating Supabase client:', clientError);
      return NextResponse.json(
        { error: 'Failed to initialize database connection', details: clientError.message },
        { status: 500 }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[open-calls DELETE] Auth error:', userError);
      return NextResponse.json(
        { error: 'Authentication required. Please log in to delete an open call.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const openCallId = searchParams.get('id');

    if (!openCallId) {
      return NextResponse.json(
        { error: 'Open call ID is required' },
        { status: 400 }
      );
    }

    // Delete the open call (RLS will ensure user can only delete their own)
    const { data, error } = await supabase
      .from('open_calls')
      .delete()
      .eq('id', openCallId)
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('[open-calls DELETE] Error deleting open call:', error);
      
      if (error.code === '42501' || error.message.includes('permission denied')) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this open call.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to delete open call', details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Open call not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedCount: data.length });
  } catch (error) {
    console.error('[open-calls DELETE] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
