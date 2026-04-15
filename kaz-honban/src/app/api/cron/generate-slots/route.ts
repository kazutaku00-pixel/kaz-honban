import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
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

    const { data, error } = await (supabase.rpc as any)("generate_slots_from_templates", {
      p_days_ahead: 14,
      p_slot_minutes: 30,
    });

    if (error) {
      console.error("generate_slots_from_templates error:", error);
      return NextResponse.json(
        { error: "Failed to generate slots", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      created_count: data ?? 0,
    });
  } catch (err) {
    console.error("GET /api/cron/generate-slots error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
