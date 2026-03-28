import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { bookingSchema } from "@/lib/validations";
import { notifyBookingCreated } from "@/lib/notifications";

interface BookingResult {
  booking_id: string;
  scheduled_start_at: string;
  scheduled_end_at: string;
  slot_ids: string[];
  code: number;
  error?: string;
}

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

    const supabase = createServiceRoleClient();

    // Call the atomic booking function — handles locking, validation, and insert in one transaction
    const { data, error } = await (supabase.rpc as any)("create_booking_atomic", {
      p_learner_id: user.id,
      p_teacher_id: teacher_id,
      p_slot_id: slot_id,
      p_duration_minutes: duration_minutes,
      p_learner_note: learner_note ?? null,
    });

    if (error) {
      console.error("create_booking_atomic rpc error:", error);
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    const result = data as unknown as BookingResult;

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.code }
      );
    }

    // Notify teacher (non-blocking — booking is already persisted)
    const { data: learnerProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    const learnerName = (learnerProfile as unknown as { display_name: string } | null)?.display_name ?? "A student";
    await notifyBookingCreated(supabase, teacher_id, learnerName, result.scheduled_start_at, result.booking_id);

    return NextResponse.json(
      { booking: { id: result.booking_id, scheduled_start_at: result.scheduled_start_at, scheduled_end_at: result.scheduled_end_at } },
      { status: 201 }
    );
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
