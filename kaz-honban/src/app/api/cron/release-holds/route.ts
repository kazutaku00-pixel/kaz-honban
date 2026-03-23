import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret in production
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase.rpc("release_expired_holds");

    if (error) {
      console.error("release_expired_holds error:", error);
      return NextResponse.json(
        { error: "Failed to release holds" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      released_count: data ?? 0,
    });
  } catch (err) {
    console.error("GET /api/cron/release-holds error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
