import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Verify the current user has admin role.
 * Returns { isAdmin: true, userId } or { isAdmin: false }.
 */
export async function verifyAdmin(): Promise<
  { isAdmin: true; userId: string } | { isAdmin: false; userId?: string }
> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { isAdmin: false };

  const admin = createServiceRoleClient();
  const { data: role } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (!role) return { isAdmin: false, userId: user.id };

  return { isAdmin: true, userId: user.id };
}
