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

    // Check status — completed / cancelled / no_show bookings are not joinable.
    if (booking.status !== "confirmed" && booking.status !== "in_session") {
      return NextResponse.json(
        { error: "Booking is not in a joinable state" },
        { status: 400 }
      );
    }

    // Time gate: allow join from 15 min before start until 30 min after end.
    // A 2h tail was too long — the lesson is effectively over at end + a short grace.
    const now = Date.now();
    const startMs = new Date(booking.scheduled_start_at).getTime();
    const endMs = new Date(booking.scheduled_end_at).getTime();
    const JOIN_GRACE_AFTER_END_MS = 30 * 60 * 1000;
    if (now < startMs - 15 * 60 * 1000) {
      return NextResponse.json(
        { error: "The room opens 15 minutes before the lesson start time." },
        { status: 403 }
      );
    }
    if (now > endMs + JOIN_GRACE_AFTER_END_MS) {
      return NextResponse.json(
        { error: "The room window for this lesson has closed." },
        { status: 403 }
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

    // Daily room expiry aligns with the join window (end + 30 min grace).
    const roomExpiry = new Date(endMs + JOIN_GRACE_AFTER_END_MS);

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

      // Save to DB. Two participants may race here — daily_rooms.booking_id is
      // UNIQUE, so the second insert will fail with Postgres error 23505. In
      // that case re-read the row the winner just inserted and reuse it.
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

      if (roomError) {
        if ((roomError as { code?: string }).code === "23505") {
          const { data: raceRow } = await supabase
            .from("daily_rooms")
            .select("*")
            .eq("booking_id", bookingId)
            .single();
          if (!raceRow) {
            return NextResponse.json(
              { error: "Failed to save room" },
              { status: 500 }
            );
          }
          room = raceRow as unknown as DailyRoom;
        } else {
          return NextResponse.json(
            { error: "Failed to save room" },
            { status: 500 }
          );
        }
      } else if (!savedRoomRaw) {
        return NextResponse.json(
          { error: "Failed to save room" },
          { status: 500 }
        );
      } else {
        room = savedRoomRaw as unknown as DailyRoom;
      }
    }

    // Update booking to in_session if still confirmed.
    // The eq("status", "confirmed") guard makes this a no-op when another
    // request (or the other participant) has already flipped the row, so
    // the second join doesn't accidentally mutate a cancelled / no_show
    // booking that was changed between our snapshot read and this update.
    if (booking.status === "confirmed") {
      await supabase
        .from("bookings")
        .update({ status: "in_session" } as never)
        .eq("id", bookingId)
        .eq("status", "confirmed");
    }

    // Generate meeting token — only the teacher gets owner privileges
    const isOwner = user.id === booking.teacher_id;
    const token = await createMeetingToken(
      room.daily_room_name,
      user.id,
      userName,
      roomExpiry,
      isOwner
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
