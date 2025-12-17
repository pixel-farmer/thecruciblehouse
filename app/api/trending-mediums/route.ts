import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        {
          error: true,
          message: "Missing environment variables",
          details: {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!supabaseServiceKey,
            urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : null,
            serviceKeyValue: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : null,
          },
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      return NextResponse.json(
        { error: true, message: error.message, details: error },
        { status: 500 }
      );
    }

    const counts: Record<string, number> = {};

    for (const user of data.users) {
      const favs = user.user_metadata?.favorite_mediums;
      if (Array.isArray(favs)) {
        favs.forEach((m) => {
          counts[m] = (counts[m] || 0) + 1;
        });
      }
    }

    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 5); // Limit to top 5

    return NextResponse.json({ trending: sorted });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: true,
        message: err?.message ?? String(err),
        stack: err?.stack ?? null,
      },
      { status: 500 }
    );
  }
}
