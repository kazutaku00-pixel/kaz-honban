import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";

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
    const now = new Date().toISOString();

    // Find in_session bookings past their scheduled end
    const { data: bookings, error: fetchError } = await supabase
      .from("bookings")
      .select("id, learner_id, teacher_id")
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

    const typedBookings = bookings as unknown as Array<{ id: string; learner_id: string; teacher_id: string }>;
    const ids = typedBookings.map((b) => b.id);

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

    // Notify both parties
    for (const b of typedBookings) {
      await createNotification({
        supabase,
        userId: b.learner_id,
        type: "lesson_completed",
        title: "Lesson Completed",
        message: "Your lesson is complete! Leave a review for your teacher.",
        link: `/bookings/${b.id}/review`,
      });
      await createNotification({
        supabase,
        userId: b.teacher_id,
        type: "lesson_completed",
        title: "Lesson Completed",
        message: "Lesson complete! Write a report for your student.",
        link: `/teacher/bookings/${b.id}/report`,
      });
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
