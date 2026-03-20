import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { notifyTeacherApproved } from "@/lib/notifications";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await verifyAdmin();
  if (!result.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createServiceRoleClient();

  const { error } = await admin
    .from("teacher_profiles")
    .update({
      approval_status: "approved",
      is_public: true,
      approved_at: new Date().toISOString(),
    } as never)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get user_id from teacher_profiles to notify
  const { data: tp } = await admin
    .from("teacher_profiles")
    .select("user_id")
    .eq("id", id)
    .single();
  if (tp) {
    await notifyTeacherApproved(admin, (tp as unknown as { user_id: string }).user_id);
  }

  return NextResponse.json({ success: true });
}
