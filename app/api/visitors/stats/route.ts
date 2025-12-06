import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";



export async function GET() {

  const supabase = createClient(

    process.env.NEXT_PUBLIC_SUPABASE_URL!,

    process.env.SUPABASE_SERVICE_ROLE_KEY!

  );



  const now = new Date();

  const d24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();



  const total = await supabase.from("visitor_events").select("*", { count: "exact", head: true });

  const last24 = await supabase.from("visitor_events").select("*", { count: "exact", head: true }).gte("timestamp", d24);

  const last7 = await supabase.from("visitor_events").select("*", { count: "exact", head: true }).gte("timestamp", d7);

  const last30 = await supabase.from("visitor_events").select("*", { count: "exact", head: true }).gte("timestamp", d30);



  // Get all pages and count visits per page
  const pagesData = await supabase.from("visitor_events").select("page");
  
  const pages: Record<string, number> = {};
  (pagesData.data || []).forEach((row) => {
    const page = row.page || 'unknown';
    pages[page] = (pages[page] || 0) + 1;
  });



  // Get recent visits (last 20)
  const recentData = await supabase
    .from("visitor_events")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(20);

  // Transform recent data to match AdminDashboard interface
  // Note: IP is hashed for privacy, so we don't expose it
  const recent = (recentData.data || []).map((row) => ({
    id: row.id,
    timestamp: row.timestamp,
    page: row.page,
    userAgent: row.user_agent || undefined,
    country: row.country || undefined,
    region: row.region || undefined,
    city: row.city || undefined,
  }));

  // Calculate unique location visits
  // Group by location and count distinct days per location
  const allVisitsData = await supabase
    .from("visitor_events")
    .select("city, region, country, timestamp")
    .order("timestamp", { ascending: false });

  const locationVisits: Record<string, number> = {};
  const locationDays: Record<string, Set<string>> = {};

  (allVisitsData.data || []).forEach((row) => {
    const city = row.city || '';
    const region = row.region || '';
    const country = row.country || '';
    
    // Create location key
    let locationKey = 'Unknown';
    if (city && region && country) {
      locationKey = `${city}, ${region}, ${country}`;
    } else if (city && country) {
      locationKey = `${city}, ${country}`;
    } else if (region && country) {
      locationKey = `${region}, ${country}`;
    } else if (country) {
      locationKey = country;
    }

    // Get date string (YYYY-MM-DD) to count unique days
    const visitDate = new Date(row.timestamp).toISOString().split('T')[0];

    // Initialize location if not exists
    if (!locationDays[locationKey]) {
      locationDays[locationKey] = new Set();
    }

    // Add this date to the set (Set automatically handles duplicates)
    locationDays[locationKey].add(visitDate);
  });

  // Count unique days per location
  Object.keys(locationDays).forEach((location) => {
    locationVisits[location] = locationDays[location].size;
  });

  return NextResponse.json({

    total: total.count || 0,

    last24Hours: last24.count || 0,

    last7Days: last7.count || 0,

    last30Days: last30.count || 0,

    pages,

    recent,

    locationVisits: locationVisits,

    timestamp: new Date().toISOString()

  });

}
