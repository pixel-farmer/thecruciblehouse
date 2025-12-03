import { NextResponse } from 'next/server';
import { getVisitors, getVisitorStats } from '@/app/lib/visitor-tracking';

/**
 * Test endpoint to verify visitor data is being loaded
 * This endpoint does NOT require authentication for debugging purposes
 * Access at: /api/visitors/test
 */
export async function GET() {
  try {
    const visitors = await getVisitors();
    const stats = await getVisitorStats();
    
    return NextResponse.json({
      success: true,
      message: 'Visitor data loaded successfully',
      data: {
        visitorCount: visitors.length,
        stats: {
          total: stats.total,
          last24Hours: stats.last24Hours,
          last7Days: stats.last7Days,
          last30Days: stats.last30Days,
          pages: stats.pages,
          recentCount: stats.recent.length,
        },
        sampleVisitors: visitors.slice(0, 5), // First 5 visitors as sample
      },
    });
  } catch (error: any) {
    console.error('[visitors/test] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      message: 'Failed to load visitor data',
    }, { status: 500 });
  }
}

