import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TeacherBookingsClient } from "./teacher-bookings-client";
import type { Booking, Profile, LessonReport, LearnerProfile } from "@/types/database";

export default async function TeacherBookingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "teacher");

  if (!roles?.length) redirect("/dashboard");

  const { data: bookingsRaw } = await supabase
    .from("bookings")
    .select(
      `*, learner:profiles!bookings_learner_id_fkey(*), lesson_report:lesson_reports(*)`
    )
    .eq("teacher_id", user.id)
    .order("scheduled_start_at", { ascending: false });

  const bookings = (bookingsRaw ?? []) as unknown as (Booking & {
    learner: Profile;
    lesson_report: LessonReport[] | null;
  })[];

  // Fetch learner_profiles server-side (RLS restricts direct access to self).
  // Teachers need level/goals/interests to prep for their next lesson — use
  // service role and expose only the fields the teacher needs.
  const learnerIds = Array.from(new Set(bookings.map((b) => b.learner_id)));
  const learnerProfileMap = new Map<string, Partial<LearnerProfile>>();
  if (learnerIds.length > 0) {
    const svc = createServiceRoleClient();
    const { data: lp } = await svc
      .from("learner_profiles")
      .select("user_id, japanese_level, learning_goals, interests, native_language, bio")
      .in("user_id", learnerIds);
    (lp ?? []).forEach((row) => {
      const r = row as unknown as Partial<LearnerProfile> & { user_id: string };
      learnerProfileMap.set(r.user_id, r);
    });
  }

  return (
    <TeacherBookingsClient
      bookings={bookings.map((b) => {
        const lp = learnerProfileMap.get(b.learner_id);
        return {
          id: b.id,
          learner_name: b.learner?.display_name ?? "Learner",
          learner_avatar: b.learner?.avatar_url ?? null,
          learner_level: lp?.japanese_level ?? null,
          learner_goals: lp?.learning_goals ?? null,
          learner_interests: lp?.interests ?? null,
          learner_native_lang: lp?.native_language ?? null,
          learner_note: b.learner_note ?? null,
          scheduled_start_at: b.scheduled_start_at,
          scheduled_end_at: b.scheduled_end_at,
          duration_minutes: b.duration_minutes,
          status: b.status,
          has_report:
            !!b.lesson_report && Array.isArray(b.lesson_report) && b.lesson_report.length > 0,
        };
      })}
    />
  );
}
