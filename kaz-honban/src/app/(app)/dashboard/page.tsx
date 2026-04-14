import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";
import type { TeacherWithProfile, BookingStatus } from "@/types/database";

interface RawBooking {
  id: string;
  learner_id: string;
  teacher_id: string;
  scheduled_start_at: string;
  scheduled_end_at: string;
  duration_minutes: number;
  status: BookingStatus;
  learner_note: string | null;
  teacher: { id: string; display_name: string; avatar_url: string | null } | null;
  learner: { id: string; display_name: string; avatar_url: string | null } | null;
  daily_room: { id: string; daily_room_url: string } | null;
  review: { id: string } | null;
  lesson_report: { id: string; summary: string | null; homework: string | null } | null;
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch upcoming & past bookings
  const { data: bookingsRaw } = await supabase
    .from("bookings")
    .select(
      `id, learner_id, teacher_id, scheduled_start_at, scheduled_end_at, duration_minutes, status, learner_note,
       teacher:profiles!bookings_teacher_id_fkey(id, display_name, avatar_url),
       learner:profiles!bookings_learner_id_fkey(id, display_name, avatar_url),
       daily_room:daily_rooms(id, daily_room_url),
       review:reviews(id),
       lesson_report:lesson_reports(id, summary, homework)`
    )
    .or(`learner_id.eq.${user.id},teacher_id.eq.${user.id}`)
    .order("scheduled_start_at", { ascending: false })
    .limit(50);

  const bookings = (bookingsRaw ?? []) as unknown as RawBooking[];

  // Fetch favorites
  const { data: favoritesRaw } = await supabase
    .from("favorites")
    .select("teacher_id")
    .eq("learner_id", user.id);

  const favoriteIds = (favoritesRaw ?? []).map((f) => (f as { teacher_id: string }).teacher_id);

  let favoriteTeachers: TeacherWithProfile[] = [];
  if (favoriteIds.length > 0) {
    const { data: teachersRaw } = await supabase
      .from("teacher_profiles")
      .select("*, profile:profiles!user_id(*)")
      .in("user_id", favoriteIds)
      .eq("approval_status", "approved");
    favoriteTeachers = (teachersRaw ?? []) as unknown as TeacherWithProfile[];
  }

  // Stats
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const upcomingCount = bookings.filter(
    (b) =>
      (b.status === "confirmed" || b.status === "in_session") &&
      new Date(b.scheduled_end_at) >= new Date()
  ).length;

  return (
    <DashboardClient
      bookings={bookings}
      favoriteTeachers={favoriteTeachers}
      userId={user.id}
      stats={{ completedLessons: completedCount, upcomingLessons: upcomingCount, favorites: favoriteIds.length }}
    />
  );
}
