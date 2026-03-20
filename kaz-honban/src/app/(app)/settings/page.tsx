import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile, LearnerProfile, UserRole } from "@/types/database";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const profile = profileRaw as unknown as Profile | null;

  const { data: rolesRaw } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  const roles = ((rolesRaw ?? []) as unknown as { role: UserRole }[]).map((r) => r.role);

  const { data: learnerProfileRaw } = await supabase
    .from("learner_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  const learnerProfile = (learnerProfileRaw as unknown as LearnerProfile) ?? null;

  return (
    <SettingsClient
      profile={
        profile
          ? {
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              timezone: profile.timezone,
            }
          : { display_name: "", avatar_url: null, timezone: "UTC" }
      }
      learnerProfile={
        learnerProfile
          ? {
              learning_goals: learnerProfile.learning_goals,
              japanese_level: learnerProfile.japanese_level,
              native_language: learnerProfile.native_language,
            }
          : null
      }
      roles={roles}
    />
  );
}
