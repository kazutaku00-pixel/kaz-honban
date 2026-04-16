import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { Booking } from "@/types/database";

// Returns the learner's profile context (level, goals, interests) for a given
// booking. Only the teacher on that booking may call it. Learners get an empty
// payload (they already see their own context via /settings).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServiceRoleClient();

  const { data: bookingRaw } = await admin
    .from("bookings")
    .select("learner_id, teacher_id, learner_note")
    .eq("id", bookingId)
    .single();

  const booking = bookingRaw as unknown as Pick<Booking, "learner_id" | "teacher_id" | "learner_note"> | null;
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isTeacher = booking.teacher_id === user.id;
  const isLearner = booking.learner_id === user.id;
  if (!isTeacher && !isLearner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Learners calling their own booking just get their own note back, no learner_profile.
  if (!isTeacher) {
    return NextResponse.json({
      learner_note: booking.learner_note,
      learner_level: null,
      learner_goals: null,
      learner_interests: null,
    });
  }

  const { data: lpRaw } = await admin
    .from("learner_profiles")
    .select("japanese_level, learning_goals, interests")
    .eq("user_id", booking.learner_id)
    .single();

  const lp = lpRaw as unknown as {
    japanese_level: string | null;
    learning_goals: string | null;
    interests: string[] | null;
  } | null;

  return NextResponse.json({
    learner_note: booking.learner_note,
    learner_level: lp?.japanese_level ?? null,
    learner_goals: lp?.learning_goals ?? null,
    learner_interests: lp?.interests ?? null,
  });
}
