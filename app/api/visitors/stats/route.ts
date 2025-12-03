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

    const stats = await getVisitorStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching visitor stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

