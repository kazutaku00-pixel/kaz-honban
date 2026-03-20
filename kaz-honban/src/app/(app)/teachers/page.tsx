import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TeacherListClient } from "@/components/teachers/teacher-list-client";
import type { TeacherWithProfile } from "@/types/database";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find a Teacher | NihonGo",
  description:
    "Browse our community of native Japanese teachers. Filter by category, price, language, and level.",
};

export default async function TeachersPage() {
  const supabase = await createServerSupabaseClient();

  const { data: teachers } = await supabase
    .from("teacher_profiles")
    .select("*, profile:profiles!user_id(*)")
    .eq("approval_status", "approved")
    .eq("is_public", true)
    .order("avg_rating", { ascending: false });

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="border-b border-border bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-5 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold font-[family-name:var(--font-display)] text-text-primary"
          >
            NihonGo
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-8 md:py-12">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-bold font-[family-name:var(--font-display)] text-text-primary">
            Find Your Teacher
          </h1>
          <p className="mt-2 text-text-secondary text-sm md:text-base">
            Browse our community of native Japanese speakers and find the
            perfect teacher for your learning goals.
          </p>
        </div>

        <TeacherListClient
          initialTeachers={(teachers as TeacherWithProfile[]) ?? []}
        />
      </div>
    </div>
  );
}
