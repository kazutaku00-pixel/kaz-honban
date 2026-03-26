import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TeacherListClient } from "@/components/teachers/teacher-list-client";
import type { TeacherWithProfile, Booking, Profile } from "@/types/database";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find a Teacher | NihonGo",
  description:
    "Browse our community of native Japanese teachers. Filter by category, price, language, and level.",
};

export default async function TeachersPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [{ data: teachers }, upcomingResult, { data: openSlots }] = await Promise.all([
    supabase
      .from("teacher_profiles")
      .select("*, profile:profiles!user_id(*)")
      .eq("approval_status", "approved")
      .eq("is_public", true)
      .order("avg_rating", { ascending: false }),
    user
      ? supabase
          .from("bookings")
          .select("*, teacher:profiles!bookings_teacher_id_fkey(*)")
          .eq("learner_id", user.id)
          .in("status", ["confirmed", "in_session"])
          .gte("scheduled_start_at", now.toISOString())
          .order("scheduled_start_at", { ascending: true })
          .limit(1)
      : Promise.resolve({ data: null }),
    supabase
      .from("availability_slots")
      .select("teacher_id, start_at")
      .eq("status", "open")
      .gte("start_at", now.toISOString())
      .lt("start_at", weekLater.toISOString())
      .order("start_at", { ascending: true }),
  ]);

  const nextBooking =
    (upcomingResult.data?.[0] as unknown as
      | (Booking & { teacher: Profile })
      | undefined) ?? null;

  // Group open slots by teacher_id: { [teacherId]: string[] (ISO start_at) }
  const slotsByTeacher: Record<string, string[]> = {};
  for (const slot of (openSlots ?? []) as unknown as { teacher_id: string; start_at: string }[]) {
    if (!slotsByTeacher[slot.teacher_id]) slotsByTeacher[slot.teacher_id] = [];
    slotsByTeacher[slot.teacher_id].push(slot.start_at);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-5 py-6 md:py-8">
      <TeacherListClient
        initialTeachers={(teachers as TeacherWithProfile[]) ?? []}
        nextBooking={nextBooking}
        slotsByTeacher={slotsByTeacher}
      />
    </div>
  );
}
