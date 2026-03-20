import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { notifyTeacherRejected } from "@/lib/notifications";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await verifyAdmin();
  if (!result.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const reason = body.reason;

  if (!reason || typeof reason !== "string" || !reason.trim()) {
    return NextResponse.json(
      { error: "Rejection reason is required" },
      { status: 400 }
    );
  }

  const admin = createServiceRoleClient();

  const { error } = await admin
    .from("teacher_profiles")
    .update({
      approval_status: "rejected",
      is_public: false,
      rejection_reason: reason.trim(),
    } as never)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify teacher
  const { data: tp } = await admin
    .from("teacher_profiles")
    .select("user_id")
    .eq("id", id)
    .single();
  if (tp) {
    await notifyTeacherRejected(admin, (tp as unknown as { user_id: string }).user_id, reason.trim());
  }

  return NextResponse.json({ success: true });
}
