import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FavoritesClient } from "./favorites-client";
import type { TeacherProfile, Profile } from "@/types/database";

export default async function FavoritesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: favoritesRaw } = await supabase
    .from("favorites")
    .select(
      `*, teacher_profile:teacher_profiles!favorites_teacher_id_fkey(*, profile:profiles!teacher_profiles_user_id_fkey(*))`
    )
    .eq("learner_id", user.id)
    .order("created_at", { ascending: false });

  const favorites = (favoritesRaw ?? []) as unknown as {
    id: string;
    teacher_id: string;
    teacher_profile: TeacherProfile & { profile: Profile };
  }[];

  const teachers = favorites
    .filter((f) => f.teacher_profile)
    .map((f) => ({
      ...f.teacher_profile,
      profile: f.teacher_profile.profile,
    }));

  return <FavoritesClient teachers={teachers} />;
}
