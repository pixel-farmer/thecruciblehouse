import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function createAuthenticatedSupabaseClient(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  return supabase;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, start_date, end_date, location, banner_image_url } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (title.length > 100) {
      return NextResponse.json(
        { error: 'Title must be 100 characters or less' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (description.length > 500) {
      return NextResponse.json(
        { error: 'Description must be 500 characters or less' },
        { status: 400 }
      );
    }

    if (!start_date || typeof start_date !== 'string') {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      );
    }

    // Validate start date is in the future
    const startDate = new Date(start_date);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid start date format' },
        { status: 400 }
      );
    }

    // Validate end date if provided
    let endDate: Date | null = null;
    if (end_date) {
      endDate = new Date(end_date);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end date format' },
          { status: 400 }
        );
      }
      if (endDate < startDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    if (!location || typeof location !== 'string' || location.trim().length === 0) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }

    if (location.length > 200) {
      return NextResponse.json(
        { error: 'Location must be 200 characters or less' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const supabase = await createAuthenticatedSupabaseClient(request);
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to post an exhibition.' },
        { status: 401 }
      );
    }

    // Verify user has pro membership
    const userMetadata = user.user_metadata || {};
    const membershipStatus = userMetadata.membership_status || userMetadata.has_paid_membership;
    const isPro = !!membershipStatus;

    if (!isPro) {
      return NextResponse.json(
        { error: 'Pro membership required to post exhibitions. Please upgrade your membership.' },
        { status: 403 }
      );
    }

    // Create exhibition in database
    const { data: exhibition, error: exhibitionError } = await supabase
      .from('exhibitions')
      .insert({
        title: title.trim(),
        description: description.trim(),
        start_date: start_date,
        end_date: end_date || null,
        location: location.trim(),
        banner_image_url: banner_image_url || null,
        host_id: user.id,
        host_name: user.user_metadata?.display_name ||
                  user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  user.email?.split('@')[0] ||
                  'User',
      })
      .select()
      .single();

    if (exhibitionError) {
      console.error('[exhibitions POST] Error creating exhibition:', exhibitionError);
      return NextResponse.json(
        { error: 'Failed to create exhibition', details: exhibitionError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ exhibition }, { status: 201 });
  } catch (error) {
    console.error('[exhibitions POST] Exception:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase environment variables' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch exhibitions - show active and upcoming exhibitions
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('exhibitions')
      .select('*')
      .or(`end_date.is.null,end_date.gte.${now}`) // Either no end date or end date in future
      .order('start_date', { ascending: true })
      .limit(100);

    if (error) {
      console.error('[exhibitions GET] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch exhibitions', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ exhibitions: data || [] });
  } catch (error) {
    console.error('[exhibitions GET] Exception:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

