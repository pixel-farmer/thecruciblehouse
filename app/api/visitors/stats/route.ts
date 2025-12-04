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
  }));



  return NextResponse.json({

    total: total.count || 0,

    last24Hours: last24.count || 0,

    last7Days: last7.count || 0,

    last30Days: last30.count || 0,

    pages,

    recent,

    timestamp: new Date().toISOString()

  });

}
