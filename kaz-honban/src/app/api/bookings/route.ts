import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { bookingSchema } from "@/lib/validations";
import { notifyBookingCreated } from "@/lib/notifications";
import type { AvailabilitySlot, Booking } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const authClient = await createServerSupabaseClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { teacher_id, slot_id, duration_minutes, learner_note } = parsed.data;

    // Use service role to bypass RLS for slot updates
    const supabase = createServiceRoleClient();

    // Validate teacher is approved and public
    const { data: teacherCheckRaw } = await supabase
      .from("teacher_profiles")
      .select("approval_status, is_public")
      .eq("user_id", teacher_id)
      .single();

    const teacherCheck = teacherCheckRaw as unknown as { approval_status: string; is_public: boolean } | null;

    if (!teacherCheck || teacherCheck.approval_status !== "approved" || !teacherCheck.is_public) {
      return NextResponse.json(
        { error: "Teacher is not available for booking" },
        { status: 400 }
      );
    }

    // Prevent booking yourself
    if (teacher_id === user.id) {
      return NextResponse.json(
        { error: "Cannot book yourself" },
        { status: 400 }
      );
    }

    // Fetch and lock the primary slot
    const { data: slotRaw, error: slotError } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("id", slot_id)
      .eq("teacher_id", teacher_id)
      .eq("status", "open")
      .single();

    if (slotError || !slotRaw) {
      return NextResponse.json(
        { error: "Slot is no longer available" },
        { status: 409 }
      );
    }

    const slot = slotRaw as unknown as AvailabilitySlot;
    const slotIds = [slot_id];
    const scheduledStartAt = slot.start_at;
    let scheduledEndAt = slot.end_at;

    // For 50-min lessons, find and hold the next consecutive slot
    if (duration_minutes === 50) {
      const { data: nextSlotRaw, error: nextError } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("teacher_id", teacher_id)
        .eq("status", "open")
        .gte("start_at", slot.end_at)
        .order("start_at", { ascending: true })
        .limit(1)
        .single();

      if (nextError || !nextSlotRaw) {
        return NextResponse.json(
          { error: "Consecutive slot not available for 50-min lesson" },
          { status: 409 }
        );
      }

      const nextSlot = nextSlotRaw as unknown as AvailabilitySlot;
      slotIds.push(nextSlot.id);
      scheduledEndAt = nextSlot.end_at;
    }

    // Hold all slots
    const holdUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    for (const id of slotIds) {
      const { error: holdError } = await supabase
        .from("availability_slots")
        .update({
          status: "held",
          held_by: user.id,
          held_until: holdUntil,
        } as never)
        .eq("id", id)
        .eq("status", "open");

      if (holdError) {
        // Rollback any already-held slots
        for (const rollbackId of slotIds) {
          await supabase
            .from("availability_slots")
            .update({ status: "open", held_by: null, held_until: null } as never)
            .eq("id", rollbackId)
            .eq("held_by", user.id);
        }
        return NextResponse.json(
          { error: "Failed to hold slot" },
          { status: 409 }
        );
      }
    }

    // Create booking
    const { data: bookingRaw, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        learner_id: user.id,
        teacher_id,
        slot_id,
        scheduled_start_at: scheduledStartAt,
        scheduled_end_at: scheduledEndAt,
        duration_minutes,
        learner_note: learner_note ?? null,
      } as never)
      .select()
      .single();

    if (bookingError) {
      // Rollback holds
      for (const id of slotIds) {
        await supabase
          .from("availability_slots")
          .update({ status: "open", held_by: null, held_until: null } as never)
          .eq("id", id)
          .eq("held_by", user.id);
      }
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    const booking = bookingRaw as unknown as Booking;

    // Update slots to booked
    for (const id of slotIds) {
      await supabase
        .from("availability_slots")
        .update({
          status: "booked",
          held_by: null,
          held_until: null,
        } as never)
        .eq("id", id);
    }

    // Notify teacher
    const { data: learnerProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    const learnerName = (learnerProfile as unknown as { display_name: string } | null)?.display_name ?? "A student";
    await notifyBookingCreated(supabase, teacher_id, learnerName, scheduledStartAt, booking.id);

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    console.error("POST /api/bookings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(
        `
        *,
        teacher:profiles!bookings_teacher_id_fkey(*),
        learner:profiles!bookings_learner_id_fkey(*),
        teacher_profile:teacher_profiles!bookings_teacher_id_fkey(*),
        daily_room:daily_rooms(*),
        review:reviews(*),
        lesson_report:lesson_reports(*)
      `
      )
      .or(`learner_id.eq.${user.id},teacher_id.eq.${user.id}`)
      .order("scheduled_start_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookings });
  } catch (err) {
    console.error("GET /api/bookings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
