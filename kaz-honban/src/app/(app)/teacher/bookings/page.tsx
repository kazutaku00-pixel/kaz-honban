import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TeacherBookingsClient } from "./teacher-bookings-client";
import type { Booking, Profile, LessonReport } from "@/types/database";

export default async function TeacherBookingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify teacher role
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

  return (
    <TeacherBookingsClient
      bookings={bookings.map((b) => ({
        id: b.id,
        learner_name: b.learner?.display_name ?? "Learner",
        learner_avatar: b.learner?.avatar_url ?? null,
        scheduled_start_at: b.scheduled_start_at,
        scheduled_end_at: b.scheduled_end_at,
        duration_minutes: b.duration_minutes,
        status: b.status,
        has_report:
          !!b.lesson_report && Array.isArray(b.lesson_report) && b.lesson_report.length > 0,
      }))}
    />
  );
}
