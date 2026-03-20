import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret in production
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const now = new Date().toISOString();

    // Find in_session bookings past their scheduled end
    const { data: bookings, error: fetchError } = await supabase
      .from("bookings")
      .select("id")
      .eq("status", "in_session")
      .lt("scheduled_end_at", now);

    if (fetchError) {
      console.error("complete-lessons fetch error:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ success: true, completed_count: 0 });
    }

    const ids = (bookings as unknown as Array<{ id: string }>).map((b) => b.id);

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "completed" } as never)
      .in("id", ids);

    if (updateError) {
      console.error("complete-lessons update error:", updateError);
      return NextResponse.json(
        { error: "Failed to complete bookings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      completed_count: ids.length,
    });
  } catch (err) {
    console.error("GET /api/cron/complete-lessons error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
