import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { notifyBookingCancelled } from "@/lib/notifications";
import type { Booking } from "@/types/database";

const LEARNER_CANCEL_DEADLINE_HOURS = 2;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const authClient = await createServerSupabaseClient();

    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse optional cancellation reason from body
    let cancellationReason: string | null = null;
    try {
      const body = await request.json();
      if (body.cancellation_reason && typeof body.cancellation_reason === "string") {
        cancellationReason = body.cancellation_reason.slice(0, 500);
      }
    } catch {
      // No body or invalid JSON — that's fine
    }

    const supabase = createServiceRoleClient();

    // Fetch booking
    const { data: bookingRaw, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchError || !bookingRaw) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookingRaw as unknown as Booking;

    // Validate participant
    if (booking.learner_id !== user.id && booking.teacher_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only confirmed or in_session bookings can be cancelled
    if (booking.status !== "confirmed" && booking.status !== "in_session") {
      return NextResponse.json(
        { error: "This booking cannot be cancelled" },
        { status: 400 }
      );
    }

    // Enforce cancellation policy for learners (teachers can cancel anytime)
    const isLearner = booking.learner_id === user.id;
    if (isLearner) {
      const lessonStart = new Date(booking.scheduled_start_at).getTime();
      const deadlineMs = LEARNER_CANCEL_DEADLINE_HOURS * 60 * 60 * 1000;
      const now = Date.now();

      if (lessonStart - now < deadlineMs) {
        return NextResponse.json(
          {
            error: `Cancellation is only allowed up to ${LEARNER_CANCEL_DEADLINE_HOURS} hours before the lesson. Please contact the teacher directly.`,
          },
          { status: 400 }
        );
      }
    }

    // Update booking
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        cancellation_reason: cancellationReason,
      } as never)
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to cancel booking" },
        { status: 500 }
      );
    }

    // Release every slot inside the booking window (duration-agnostic)
    await (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<unknown>)(
      "release_booking_slots",
      { p_booking_id: bookingId }
    );

    // Notify the other party
    const { data: cancellerProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    const cancellerName = (cancellerProfile as unknown as { display_name: string } | null)?.display_name ?? "Someone";
    const notifyId = user.id === booking.learner_id ? booking.teacher_id : booking.learner_id;
    await notifyBookingCancelled(supabase, notifyId, cancellerName, booking.scheduled_start_at);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/bookings/[id]/cancel error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
