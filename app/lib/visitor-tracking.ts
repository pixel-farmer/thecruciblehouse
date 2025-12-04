import { supabaseServer } from '@/lib/supabase-server';

export interface Visitor {
  id: string;
  timestamp: string;
  page: string;
  ip?: string;
  userAgent?: string;
  referer?: string;
  country?: string;
  region?: string;
  city?: string;
}

// Database interface matching Supabase table structure
interface VisitorEventRow {
  id: string;
  timestamp: string;
  page: string;
  ip_hash: string | null;
  user_agent: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
}

// Convert database row to Visitor interface
function rowToVisitor(row: VisitorEventRow): Visitor {
  return {
    id: row.id,
    timestamp: row.timestamp,
    page: row.page,
    ip: row.ip_hash || undefined, // Note: This is the hash, not the actual IP
    userAgent: row.user_agent || undefined,
    country: row.country || undefined,
    region: row.region || undefined,
    city: row.city || undefined,
  };
}

/**
 * Get all visitors from Supabase database
 */
export async function getVisitors(): Promise<Visitor[]> {
  try {
    console.log('[getVisitors] Fetching visitors from Supabase...');
    
    const { data, error } = await supabaseServer
      .from('visitor_events')
      .select('*')
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('[getVisitors] Error fetching visitors:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('[getVisitors] No visitors found in database');
      return [];
    }

    const visitors = data.map(rowToVisitor);
    console.log(`[getVisitors] Loaded ${visitors.length} visitors from Supabase`);
    
    return visitors;
  } catch (error) {
    console.error('[getVisitors] Error:', error);
    return [];
  }
}

/**
 * Add a new visitor to the database
 */
export async function addVisitor(visitor: Omit<Visitor, 'id' | 'timestamp'>): Promise<void> {
  try {
    console.log(`[addVisitor] Adding visitor for page: ${visitor.page}`);
    
    // Create IP hash for privacy (basic hash, not crypto-safe but fine for analytics)
    const ip_hash = visitor.ip && visitor.ip !== 'unknown' 
      ? Buffer.from(visitor.ip + (visitor.userAgent || '')).toString('base64').substring(0, 64)
      : null;

    const { error } = await supabaseServer
      .from('visitor_events')
      .insert({
        page: visitor.page || 'unknown',
        ip_hash,
        user_agent: visitor.userAgent || null,
        country: visitor.country || null,
        region: visitor.region || null,
        city: visitor.city || null,
      });

    if (error) {
      console.error('[addVisitor] Error inserting visitor:', error);
      throw error;
    }

    console.log(`[addVisitor] Successfully added visitor to database`);
  } catch (error) {
    console.error('[addVisitor] Error adding visitor:', error);
    // Don't throw - allow site to function even if tracking fails
  }
}

/**
 * Get visitor statistics from the database
 */
export async function getVisitorStats() {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Get all visitors for stats
    const { data: allVisitors, error: allError } = await supabaseServer
      .from('visitor_events')
      .select('*')
      .order('timestamp', { ascending: false });

    if (allError) {
      console.error('[getVisitorStats] Error fetching all visitors:', allError);
      throw allError;
    }

    const visitors = (allVisitors || []).map(rowToVisitor);

    // Get recent visitors (last 50)
    const recent = visitors.slice(0, 50);

    // Count by time ranges
    const last24HoursCount = visitors.filter(v => new Date(v.timestamp) >= new Date(last24Hours)).length;
    const last7DaysCount = visitors.filter(v => new Date(v.timestamp) >= new Date(last7Days)).length;
    const last30DaysCount = visitors.filter(v => new Date(v.timestamp) >= new Date(last30Days)).length;

    // Count visits per page
    const pages: Record<string, number> = {};
    visitors.forEach(visitor => {
      const page = visitor.page || 'unknown';
      pages[page] = (pages[page] || 0) + 1;
    });

    const stats = {
      total: visitors.length,
      last24Hours: last24HoursCount,
      last7Days: last7DaysCount,
      last30Days: last30DaysCount,
      pages,
      recent,
    };

    console.log(`[getVisitorStats] Stats calculated:`, {
      total: stats.total,
      last24Hours: stats.last24Hours,
      last7Days: stats.last7Days,
      last30Days: stats.last30Days,
      pagesCount: Object.keys(stats.pages).length,
      recentCount: stats.recent.length,
    });

    return stats;
  } catch (error) {
    console.error('[getVisitorStats] Error getting visitor stats:', error);
    // Return empty stats if there's an error
    return {
      total: 0,
      last24Hours: 0,
      last7Days: 0,
      last30Days: 0,
      pages: {},
      recent: [],
    };
  }
}
