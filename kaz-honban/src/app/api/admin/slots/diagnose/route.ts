import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const result = await verifyAdmin();
  if (!result.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createServiceRoleClient();

  const [{ data: teachers }, { data: templates }, { data: slots }] = await Promise.all([
    admin
      .from("teacher_profiles")
      .select("user_id, approval_status, is_public, profile:profiles!teacher_profiles_user_id_fkey(display_name, is_active)"),
    admin.from("schedule_templates").select("teacher_id, is_active"),
    admin.from("availability_slots").select("teacher_id, status, start_at"),
  ]);

  type Row = {
    user_id: string;
    approval_status: string;
    is_public: boolean;
    profile: { display_name: string | null; is_active: boolean } | null;
  };
  type Tpl = { teacher_id: string; is_active: boolean };
  type Slot = { teacher_id: string; status: string; start_at: string };

  const rows = (teachers ?? []) as unknown as Row[];
  const tpls = (templates ?? []) as unknown as Tpl[];
  const sls = (slots ?? []) as unknown as Slot[];

  const now = Date.now();
  const futureCutoffMs = now;

  const byTeacher = rows.map((r) => {
    const tTpls = tpls.filter((t) => t.teacher_id === r.user_id);
    const activeTpls = tTpls.filter((t) => t.is_active);
    const tSlots = sls.filter((s) => s.teacher_id === r.user_id);
    const futureOpen = tSlots.filter(
      (s) => s.status === "open" && new Date(s.start_at).getTime() > futureCutoffMs
    );
    return {
      user_id: r.user_id,
      display_name: r.profile?.display_name ?? "—",
      profile_active: r.profile?.is_active ?? false,
      approval_status: r.approval_status,
      is_public: r.is_public,
      templates_total: tTpls.length,
      templates_active: activeTpls.length,
      slots_total: tSlots.length,
      slots_open_future: futureOpen.length,
      can_generate:
        (r.profile?.is_active ?? false) &&
        r.approval_status === "approved" &&
        activeTpls.length > 0,
    };
  });

  const summary = {
    teachers_total: rows.length,
    teachers_approved: rows.filter((r) => r.approval_status === "approved").length,
    teachers_ready_for_generation: byTeacher.filter((r) => r.can_generate).length,
    teachers_with_no_future_slots: byTeacher.filter((r) => r.slots_open_future === 0).length,
    templates_total: tpls.length,
    templates_active: tpls.filter((t) => t.is_active).length,
    slots_total: sls.length,
    slots_open_future: sls.filter(
      (s) => s.status === "open" && new Date(s.start_at).getTime() > futureCutoffMs
    ).length,
  };

  return NextResponse.json({ summary, teachers: byTeacher });
}
