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

  const [{ data: teachers }, upcomingResult] = await Promise.all([
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
          .gte("scheduled_start_at", new Date().toISOString())
          .order("scheduled_start_at", { ascending: true })
          .limit(1)
      : Promise.resolve({ data: null }),
  ]);

  const nextBooking =
    (upcomingResult.data?.[0] as unknown as
      | (Booking & { teacher: Profile })
      | undefined) ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-5 py-6 md:py-8">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-display)] text-text-primary">
          Find Your Teacher
        </h1>
        <p className="mt-1 text-text-secondary text-sm">
          Browse our community of native Japanese speakers and find the perfect
          teacher for your learning goals.
        </p>
      </div>

      <TeacherListClient
        initialTeachers={(teachers as TeacherWithProfile[]) ?? []}
        nextBooking={nextBooking}
      />
    </div>
  );
}
