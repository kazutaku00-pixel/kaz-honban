import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface SyncResult {
  created: number;
  pruned: number;
}

// Regenerate (and prune) the authed teacher's future availability_slots
// from their active schedule_templates. Called from the teacher schedule
// page after every template add/delete and from a manual "Sync now"
// button. The cron at /api/cron/generate-slots still runs daily as a
// safety net for teachers who never visit the schedule page.
export async function POST() {
  const auth = await createServerSupabaseClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: roles, error: rolesError } = await auth
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "teacher");
  if (rolesError) {
    console.error("user_roles lookup failed:", rolesError);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
  if (!roles?.length) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await (supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: SyncResult | null; error: { message: string } | null }>)(
    "sync_teacher_availability",
    {
      p_teacher_id: user.id,
      p_days_ahead: 14,
      p_slot_minutes: 30,
    }
  );

  if (error) {
    console.error("sync_teacher_availability error:", error);
    return NextResponse.json(
      { error: "Failed to sync availability" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    created: data?.created ?? 0,
    pruned: data?.pruned ?? 0,
  });
}
