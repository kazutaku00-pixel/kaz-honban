import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createDailyRoom, createMeetingToken } from "@/lib/daily";
import type { Booking, DailyRoom, Profile } from "@/types/database";

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

    // Use service role for DB operations (RLS may block daily_rooms insert)
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

    // Check status
    if (booking.status !== "confirmed" && booking.status !== "in_session") {
      return NextResponse.json(
        { error: "Booking is not in a joinable state" },
        { status: 400 }
      );
    }

    // Get user profile for display name
    const { data: profileRaw } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const profile = profileRaw as unknown as Pick<Profile, "display_name"> | null;
    const userName = profile?.display_name ?? "Participant";

    // Room expires 2 hours after scheduled end (buffer for late starts)
    const roomExpiry = new Date(
      new Date(booking.scheduled_end_at).getTime() + 2 * 60 * 60 * 1000
    );

    // Check if room already exists
    const { data: existingRoomRaw } = await supabase
      .from("daily_rooms")
      .select("*")
      .eq("booking_id", bookingId)
      .single();

    let room = existingRoomRaw as unknown as DailyRoom | null;

    if (!room) {
      // Create Daily room with error handling
      let dailyRoom;
      try {
        dailyRoom = await createDailyRoom(bookingId, roomExpiry);
      } catch (dailyError) {
        console.error("Daily.co room creation failed:", dailyError);
        return NextResponse.json(
          { error: "Failed to create video room. Please try again in a moment." },
          { status: 503 }
        );
      }

      // Save to DB
      const { data: savedRoomRaw, error: roomError } = await supabase
        .from("daily_rooms")
        .insert({
          booking_id: bookingId,
          daily_room_name: dailyRoom.name,
          daily_room_url: dailyRoom.url,
          status: "ready",
          expires_at: roomExpiry.toISOString(),
        } as never)
        .select()
        .single();

      if (roomError || !savedRoomRaw) {
        return NextResponse.json(
          { error: "Failed to save room" },
          { status: 500 }
        );
      }

      room = savedRoomRaw as unknown as DailyRoom;
    }

    // Update booking to in_session if still confirmed
    if (booking.status === "confirmed") {
      await supabase
        .from("bookings")
        .update({ status: "in_session" } as never)
        .eq("id", bookingId);
    }

    // Generate meeting token
    const token = await createMeetingToken(
      room.daily_room_name,
      user.id,
      userName,
      roomExpiry
    );

    return NextResponse.json({
      url: room.daily_room_url,
      token,
      roomName: room.daily_room_name,
    });
  } catch (err) {
    console.error("POST /api/bookings/[id]/join error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
