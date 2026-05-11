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
      daily_room:daily_rooms(*),
      review:reviews(*),
      lesson_report:lesson_reports(*)
    `
    )
    .or(`learner_id.eq.${user.id},teacher_id.eq.${user.id}`)
    .order("scheduled_start_at", { ascending: false });

  // PostgREST returns one-to-many joins as arrays even when the FK is unique
  // (reviews.booking_id, lesson_reports.booking_id, daily_rooms.booking_id).
  // The client treats these as `{...} | null`, so an empty array `[]` was
  // being read as truthy — the "Write Review" button was never appearing
  // because `!booking.review` was always false. Normalize to first-or-null
  // here so the client's typing matches reality.
  const pickFirst = <T,>(v: T | T[] | null | undefined): T | null => {
    if (Array.isArray(v)) return v[0] ?? null;
    return v ?? null;
  };
  const normalized = (bookings ?? []).map((b) => {
    const row = b as Record<string, unknown>;
    return {
      ...row,
      daily_room: pickFirst(row.daily_room as unknown),
      review: pickFirst(row.review as unknown),
      lesson_report: pickFirst(row.lesson_report as unknown),
    };
  });

  return (
    <BookingsListClient
      bookings={normalized as unknown as React.ComponentProps<typeof BookingsListClient>["bookings"]}
      userId={user.id}
      fetchError={error?.message ?? null}
    />
  );
}
