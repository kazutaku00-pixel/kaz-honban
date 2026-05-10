import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { Booking } from "@/types/database";

export async function POST(
  _request: NextRequest,
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

    // Use service role to bypass RLS
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

    // Only the teacher can manually complete
    if (booking.teacher_id !== user.id) {
      return NextResponse.json(
        { error: "Only the teacher can complete a lesson" },
        { status: 403 }
      );
    }

    // Must be in_session — lesson must have actually started
    if (booking.status !== "in_session") {
      return NextResponse.json(
        { error: "Lesson must be in session before it can be completed" },
        { status: 400 }
      );
    }

    // Guard against stale-read races: only flip in_session → completed.
    // If the cron beat us to it (or another tab fired the same request),
    // matching 0 rows means we should bail out instead of overwriting a
    // cancelled / no_show row.
    const { data: updatedRows, error: updateError } = await supabase
      .from("bookings")
      .update({ status: "completed" } as never)
      .eq("id", bookingId)
      .eq("status", "in_session")
      .select("id");

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to complete booking" },
        { status: 500 }
      );
    }

    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json(
        { error: "Booking is no longer in session" },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/bookings/[id]/complete error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
