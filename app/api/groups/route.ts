import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Fetch active groups with member counts
    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, description, member_count, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (groupsError) {
      console.error('[groups GET] Supabase error:', groupsError);
      return NextResponse.json(
        { error: 'Failed to fetch groups', details: groupsError.message },
        { status: 500 }
      );
    }

    // Get actual member counts from group_members table for each group
    const groupsWithCounts = await Promise.all(
      (groupsData || []).map(async (group) => {
        const { count, error: countError } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        if (!countError && count !== null) {
          // Update the member_count in the groups table if it differs
          if (count !== group.member_count) {
            await supabase
              .from('groups')
              .update({ member_count: count })
              .eq('id', group.id);
          }
          return { ...group, member_count: count };
        }
        return group;
      })
    );

    return NextResponse.json({ groups: groupsWithCounts || [] });
  } catch (error) {
    console.error('[groups GET] Exception:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

