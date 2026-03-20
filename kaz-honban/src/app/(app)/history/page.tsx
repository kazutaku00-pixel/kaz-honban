import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HistoryClient } from "./history-client";
import type { Booking, Profile, LessonReport } from "@/types/database";

export default async function HistoryPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: bookingsRaw } = await supabase
    .from("bookings")
    .select(
      `*, teacher:profiles!bookings_teacher_id_fkey(*), lesson_report:lesson_reports(*)`
    )
    .eq("learner_id", user.id)
    .eq("status", "completed")
    .order("scheduled_start_at", { ascending: false });

  const bookings = (bookingsRaw ?? []) as unknown as (Booking & {
    teacher: Profile;
    lesson_report: LessonReport[] | null;
  })[];

  return (
    <HistoryClient
      bookings={bookings.map((b) => ({
        id: b.id,
        teacher_name: b.teacher?.display_name ?? "Teacher",
        teacher_avatar: b.teacher?.avatar_url ?? null,
        scheduled_start_at: b.scheduled_start_at,
        duration_minutes: b.duration_minutes,
        lesson_report:
          b.lesson_report && b.lesson_report.length > 0
            ? {
                summary: b.lesson_report[0].summary,
                homework: b.lesson_report[0].homework,
              }
            : null,
      }))}
    />
  );
}
