import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/app/lib/auth';
import { getVisitorStats } from '@/app/lib/visitor-tracking';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await verifySession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Force fresh data by calling getVisitorStats (which always lists blobs)
    const stats = await getVisitorStats();
    
    // Log stats for debugging
    console.log(`[visitors/stats] Returning stats:`, {
      total: stats.total,
      last24Hours: stats.last24Hours,
      last7Days: stats.last7Days,
      last30Days: stats.last30Days,
      pagesCount: Object.keys(stats.pages).length,
      recentCount: stats.recent.length,
      timestamp: new Date().toISOString(),
    });
    
    // Always return stats, even if empty (handles serverless read-only filesystem)
    // Add cache headers to prevent client-side caching
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching visitor stats:', error);
    
    // Return empty stats instead of error to prevent dashboard from breaking
    // This handles cases where file system is read-only (e.g., Vercel serverless)
    return NextResponse.json({
      total: 0,
      last24Hours: 0,
      last7Days: 0,
      last30Days: 0,
      pages: {},
      recent: [],
    });
  }
}

