import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { verifyCronRequest } from "@/lib/cron";

type SweepRow = {
  id: string;
  status: "confirmed" | "in_session";
  learner_id: string;
  teacher_id: string;
  daily_room: Array<{ id: string }> | null;
};

export async function GET(request: NextRequest) {
  try {
    const unauthorized = verifyCronRequest(request);
    if (unauthorized) return unauthorized;

    const supabase = createServiceRoleClient();
    const now = new Date().toISOString();

    // Sweep anything past its end time that still shows as live.
    // - in_session past end → completed
    // - confirmed past end with a daily_room (they actually joined) → completed
    // - confirmed past end with no daily_room (nobody joined) → no_show
    //   This covers any booking missed by the check-no-shows cron.
    const { data: bookingsRaw, error: fetchError } = await supabase
      .from("bookings")
      .select(
        "id, status, learner_id, teacher_id, daily_room:daily_rooms(id)"
      )
      .in("status", ["confirmed", "in_session"])
      .lt("scheduled_end_at", now);

    if (fetchError) {
      console.error("complete-lessons fetch error:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    const bookings = (bookingsRaw ?? []) as unknown as SweepRow[];
    if (bookings.length === 0) {
      return NextResponse.json({ success: true, completed_count: 0, no_show_count: 0 });
    }

    const joined = (b: SweepRow) => Array.isArray(b.daily_room) && b.daily_room.length > 0;
    const toComplete = bookings.filter((b) => b.status === "in_session" || joined(b));
    const toNoShow = bookings.filter((b) => b.status === "confirmed" && !joined(b));

    if (toComplete.length > 0) {
      const ids = toComplete.map((b) => b.id);
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

      for (const b of toComplete) {
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
    }

    if (toNoShow.length > 0) {
      const ids = toNoShow.map((b) => b.id);
      const { error: nsError } = await supabase
        .from("bookings")
        .update({ status: "no_show" } as never)
        .in("id", ids);

      if (nsError) {
        console.error("complete-lessons no_show update error:", nsError);
      } else {
        for (const b of toNoShow) {
          await (supabase.rpc as unknown as (
            fn: string,
            args: Record<string, unknown>
          ) => Promise<unknown>)("release_booking_slots", { p_booking_id: b.id });

          await createNotification({
            supabase,
            userId: b.teacher_id,
            type: "booking_cancelled",
            title: "No Show",
            message: "A student did not show up for the scheduled lesson.",
            link: "/teacher/bookings",
          });
          await createNotification({
            supabase,
            userId: b.learner_id,
            type: "booking_cancelled",
            title: "Missed Lesson",
            message: "You missed your scheduled lesson. Please book again.",
            link: "/bookings",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      completed_count: toComplete.length,
      no_show_count: toNoShow.length,
    });
  } catch (err) {
    console.error("GET /api/cron/complete-lessons error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
