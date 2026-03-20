import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BookingsListClient } from "@/components/bookings/bookings-list-client";

export default async function BookingsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/signup");
  }

  // Fetch all bookings where user is learner or teacher
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

  return (
    <BookingsListClient
      bookings={bookings ?? []}
      userId={user.id}
      fetchError={error?.message ?? null}
    />
  );
}
