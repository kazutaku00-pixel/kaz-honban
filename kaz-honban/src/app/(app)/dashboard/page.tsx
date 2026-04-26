import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";
import type { BookingStatus } from "@/types/database";

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

  // Stats
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const completedCount = completedBookings.length;
  const upcomingCount = bookings.filter(
    (b) =>
      (b.status === "confirmed" || b.status === "in_session") &&
      new Date(b.scheduled_end_at) >= new Date()
  ).length;

  // Hours studied = sum of completed booking durations (mins) / 60.
  const minutesStudied = completedBookings.reduce(
    (acc, b) => acc + (b.duration_minutes ?? 0),
    0
  );
  const hoursStudied = Math.round((minutesStudied / 60) * 10) / 10;

  // Distinct teachers (learner side) or learners (teacher side).
  const counterpartIds = new Set<string>();
  for (const b of completedBookings) {
    if (b.learner_id === user.id && b.teacher_id) counterpartIds.add(b.teacher_id);
    if (b.teacher_id === user.id && b.learner_id) counterpartIds.add(b.learner_id);
  }

  // Streak — number of consecutive ISO weeks (ending this week) that have at
  // least one completed lesson. Weekly cadence reflects how language learners
  // actually book; daily would be too punishing for a 30-min/lesson product.
  const streakWeeks = computeWeeklyStreak(
    completedBookings.map((b) => new Date(b.scheduled_start_at))
  );

  return (
    <DashboardClient
      bookings={bookings}
      userId={user.id}
      stats={{
        completedLessons: completedCount,
        upcomingLessons: upcomingCount,
        hoursStudied,
        teachersTried: counterpartIds.size,
        streakWeeks,
      }}
    />
  );
}

function startOfIsoWeek(d: Date): number {
  // ISO week starts Monday — normalize to Monday 00:00 local.
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0 = Sun
  const diff = (day === 0 ? -6 : 1 - day);
  x.setDate(x.getDate() + diff);
  return x.getTime();
}

function computeWeeklyStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const weekSet = new Set<number>();
  for (const d of dates) weekSet.add(startOfIsoWeek(d));
  let streak = 0;
  let cursor = startOfIsoWeek(new Date());
  while (weekSet.has(cursor)) {
    streak += 1;
    const prev = new Date(cursor);
    prev.setDate(prev.getDate() - 7);
    cursor = startOfIsoWeek(prev);
  }
  return streak;
}
