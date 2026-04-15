import { createServerSupabaseClient } from "@/lib/supabase/server";
import { QuizClient } from "./quiz-client";
import type { TeacherWithProfile } from "@/types/database";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find your teacher in 60 seconds | NihonGo",
  description:
    "Answer three quick questions and we'll match you with the right Japanese teacher today.",
};

export default async function QuizPage() {
  const supabase = await createServerSupabaseClient();

  const { data: teachers } = await supabase
    .from("teacher_profiles")
    .select("*, profile:profiles!user_id(*)")
    .eq("approval_status", "approved")
    .eq("is_public", true)
    .order("avg_rating", { ascending: false });

  return (
    <div className="min-h-screen bg-bg-primary">
      <QuizClient teachers={(teachers as TeacherWithProfile[]) ?? []} />
    </div>
  );
}
