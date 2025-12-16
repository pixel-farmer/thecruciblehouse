import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function createAuthenticatedSupabaseClient(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Try to get from cookie or session
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    return createClient(supabaseUrl, supabaseAnonKey);
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedSupabaseClient(request);
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated', isPro: false },
        { status: 401 }
      );
    }

    const userMetadata = user.user_metadata || {};
    const membershipStatus = userMetadata.membership_status;
    const hasPaidMembership = userMetadata.has_paid_membership;
    const isFounder = userMetadata.is_founder === true;
    const isPro = membershipStatus === 'active' || hasPaidMembership === true || isFounder;

    return NextResponse.json({
      isPro,
      isFounder,
      membership_status: userMetadata.membership_status || null,
      has_paid_membership: userMetadata.has_paid_membership || false,
      membership_purchased_at: userMetadata.membership_purchased_at || null,
      user_metadata: userMetadata,
    });
  } catch (error) {
    console.error('[membership/check GET] Exception:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        isPro: false,
      },
      { status: 500 }
    );
  }
}

