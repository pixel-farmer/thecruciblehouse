import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST: Increment view count for an open call
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Use service role key to bypass RLS for view count updates
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[open-calls/[id]/view POST] Missing Supabase configuration');
      return NextResponse.json(
        { 
          error: 'Server configuration error', 
          details: 'Supabase configuration is missing.',
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Increment view count
    const { data, error } = await supabase.rpc('increment_open_call_views', {
      call_id: id,
    });

    // If the RPC function doesn't exist, use a direct update
    // Note: This requires service role key to bypass RLS
    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      console.log('[open-calls/[id]/view POST] RPC function not found, using direct update');
      
      // Get current view count and increment
      const { data: currentData, error: fetchError } = await supabase
        .from('open_calls')
        .select('view_count')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('[open-calls/[id]/view POST] Error fetching current view count:', fetchError);
        // Still return success to not block the page load
        return NextResponse.json({ success: true });
      }

      const newViewCount = (currentData?.view_count || 0) + 1;

      const { error: updateError } = await supabase
        .from('open_calls')
        .update({ view_count: newViewCount })
        .eq('id', id);

      if (updateError) {
        console.error('[open-calls/[id]/view POST] Error updating view count:', updateError);
        console.error('[open-calls/[id]/view POST] Make sure SUPABASE_SERVICE_ROLE_KEY is set or run the RPC function migration');
        // Still return success to not block the page load
        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ success: true, viewCount: newViewCount });
    }

    if (error) {
      console.error('[open-calls/[id]/view POST] Error:', error);
      // Still return success to not block the page load
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, viewCount: data });
  } catch (error) {
    console.error('[open-calls/[id]/view POST] Exception:', error);
    // Still return success to not block the page load
    return NextResponse.json({ success: true });
  }
}
