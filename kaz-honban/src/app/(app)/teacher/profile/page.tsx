import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { TeacherProfile } from "@/types/database";
import { TeacherProfileFormClient } from "./teacher-profile-form-client";

export default async function TeacherProfileEditPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify teacher role
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "teacher");

  if (!roles?.length) redirect("/dashboard");

  const { data: profileRaw } = await supabase
    .from("teacher_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const teacherProfile = (profileRaw as unknown as TeacherProfile) ?? null;

  return (
    <TeacherProfileFormClient
      existingProfile={
        teacherProfile
          ? {
              headline: teacherProfile.headline ?? "",
              bio: teacherProfile.bio ?? "",
              hourly_rate: teacherProfile.hourly_rate,
              categories: teacherProfile.categories,
              languages: teacherProfile.languages,
              levels: teacherProfile.levels,
              lesson_duration_options: teacherProfile.lesson_duration_options,
              teaching_style: teacherProfile.teaching_style ?? "",
              certifications: teacherProfile.certifications ?? "",
              intro_video_url: teacherProfile.intro_video_url ?? "",
              trial_enabled: teacherProfile.trial_enabled,
              trial_price: teacherProfile.trial_price ?? 0,
              approval_status: teacherProfile.approval_status,
            }
          : null
      }
    />
  );
}
