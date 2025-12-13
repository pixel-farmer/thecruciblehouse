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
    const { title, description, event_time, location } = body;

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

    if (!event_time || typeof event_time !== 'string') {
      return NextResponse.json(
        { error: 'Event time is required' },
        { status: 400 }
      );
    }

    // Validate time is in the future
    const eventDate = new Date(event_time);
    if (isNaN(eventDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid event time format' },
        { status: 400 }
      );
    }

    if (eventDate < new Date()) {
      return NextResponse.json(
        { error: 'Event time must be in the future' },
        { status: 400 }
      );
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
        { error: 'Authentication required. Please log in to host a meetup.' },
        { status: 401 }
      );
    }

    // Create meetup in database
    const { data: meetup, error: meetupError } = await supabase
      .from('meetups')
      .insert({
        title: title.trim(),
        description: description.trim(),
        event_time: event_time,
        location: location.trim(),
        host_id: user.id,
        host_name: user.user_metadata?.display_name ||
                  user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  user.email?.split('@')[0] ||
                  'User',
      })
      .select()
      .single();

    if (meetupError) {
      console.error('[meetups POST] Error creating meetup:', meetupError);
      return NextResponse.json(
        { error: 'Failed to create meetup', details: meetupError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ meetup }, { status: 201 });
  } catch (error) {
    console.error('[meetups POST] Exception:', error);
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

    // Fetch meetups ordered by event_time ascending (upcoming first)
    const { data, error } = await supabase
      .from('meetups')
      .select('*')
      .gte('event_time', new Date().toISOString()) // Only future events
      .order('event_time', { ascending: true })
      .limit(100);

    if (error) {
      console.error('[meetups GET] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch meetups', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ meetups: data || [] });
  } catch (error) {
    console.error('[meetups GET] Exception:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

