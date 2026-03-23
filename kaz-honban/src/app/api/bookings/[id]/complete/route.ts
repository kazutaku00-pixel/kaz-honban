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

    // Must be in_session or confirmed
    if (booking.status !== "in_session" && booking.status !== "confirmed") {
      return NextResponse.json(
        { error: "Booking cannot be completed in its current state" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "completed" } as never)
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to complete booking" },
        { status: 500 }
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
