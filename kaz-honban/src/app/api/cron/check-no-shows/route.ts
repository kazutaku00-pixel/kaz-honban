import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { verifyCronRequest } from "@/lib/cron";

interface BookingWithRoom {
  id: string;
  slot_id: string;
  duration_minutes: number;
  teacher_id: string;
  learner_id: string;
  daily_room: Array<{ id: string }> | null;
}

export async function GET(request: NextRequest) {
  try {
    const unauthorized = verifyCronRequest(request);
    if (unauthorized) return unauthorized;

    const supabase = createServiceRoleClient();

    // 15 minutes ago
    const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    // Find confirmed bookings past start + 15 min where nobody joined (no daily_room)
    const { data: bookingsRaw, error: fetchError } = await supabase
      .from("bookings")
      .select("id, slot_id, duration_minutes, teacher_id, learner_id, daily_room:daily_rooms(id)")
      .eq("status", "confirmed")
      .lt("scheduled_start_at", cutoff);

    if (fetchError) {
      console.error("check-no-shows fetch error:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    const bookings = (bookingsRaw ?? []) as unknown as BookingWithRoom[];

    if (bookings.length === 0) {
      return NextResponse.json({ success: true, no_show_count: 0 });
    }

    // Filter to only bookings with no daily room (nobody joined)
    const noShowBookings = bookings.filter((b) => {
      return !b.daily_room || b.daily_room.length === 0;
    });

    if (noShowBookings.length === 0) {
      return NextResponse.json({ success: true, no_show_count: 0 });
    }

    const noShowIds = noShowBookings.map((b) => b.id);

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "no_show" } as never)
      .in("id", noShowIds);

    if (updateError) {
      console.error("check-no-shows update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update no-show bookings" },
        { status: 500 }
      );
    }

    // Release every slot inside each booking window (duration-agnostic)
    for (const noShowBooking of noShowBookings) {
      await (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<unknown>)(
        "release_booking_slots",
        { p_booking_id: noShowBooking.id }
      );
    }

    // Notify both parties about no-show
    for (const b of noShowBookings) {
      await createNotification({
        supabase,
        userId: b.teacher_id,
        type: "booking_cancelled",
        title: "No Show",
        message: "A student did not show up for the scheduled lesson.",
        link: "/teacher/bookings",
      });
      if (b.learner_id) {
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

    return NextResponse.json({
      success: true,
      no_show_count: noShowIds.length,
    });
  } catch (err) {
    console.error("GET /api/cron/check-no-shows error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
