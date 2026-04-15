import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron";

export async function GET(request: NextRequest) {
  try {
    const unauthorized = verifyCronRequest(request);
    if (unauthorized) return unauthorized;

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
