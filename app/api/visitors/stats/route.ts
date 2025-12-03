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



  const pages = await supabase.from("visitor_events").select("page");

  const pagesCount = new Set((pages.data || []).map((p) => p.page)).size;



  const recent = await supabase

    .from("visitor_events")

    .select("*")

    .order("timestamp", { ascending: false })

    .limit(20);



  return NextResponse.json({

    total: total.count || 0,

    last24Hours: last24.count || 0,

    last7Days: last7.count || 0,

    last30Days: last30.count || 0,

    pagesCount,

    recentCount: recent.data?.length || 0,

    recent: recent.data || [],

    timestamp: new Date().toISOString()

  });

}
