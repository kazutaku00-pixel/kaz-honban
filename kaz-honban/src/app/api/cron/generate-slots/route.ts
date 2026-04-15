import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron";

export async function GET(request: NextRequest) {
  try {
    const unauthorized = verifyCronRequest(request);
    if (unauthorized) return unauthorized;

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
