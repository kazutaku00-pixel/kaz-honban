import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Booking, Profile, LessonReport } from "@/types/database";
import { ReportFormClient } from "./report-form-client";

export default async function LessonReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: bookingId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch booking
  const { data: bookingRaw } = await supabase
    .from("bookings")
    .select(`*, learner:profiles!bookings_learner_id_fkey(*)`)
    .eq("id", bookingId)
    .single();

  if (!bookingRaw) redirect("/teacher/bookings");

  const booking = bookingRaw as unknown as Booking & { learner: Profile };

  // Verify teacher
  if (booking.teacher_id !== user.id) redirect("/teacher/bookings");

  // Fetch existing report
  const { data: reportRaw } = await supabase
    .from("lesson_reports")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("teacher_id", user.id)
    .single();

  const existingReport = (reportRaw as unknown as LessonReport) ?? null;

  return (
    <ReportFormClient
      bookingId={bookingId}
      learnerName={booking.learner?.display_name ?? "Learner"}
      scheduledAt={booking.scheduled_start_at}
      durationMinutes={booking.duration_minutes}
      existingReport={
        existingReport
          ? {
              id: existingReport.id,
              template_type: existingReport.template_type,
              summary: existingReport.summary,
              homework: existingReport.homework,
              next_recommendation: existingReport.next_recommendation,
              internal_note: existingReport.internal_note,
            }
          : null
      }
    />
  );
}
