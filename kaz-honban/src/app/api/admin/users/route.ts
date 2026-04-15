import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { notifyBookingCancelled } from "@/lib/notifications";

// GET — List all users with roles
export async function GET() {
  const result = await verifyAdmin();
  if (!result.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createServiceRoleClient();

  const { data, error } = await admin
    .from("profiles")
    .select("*, roles:user_roles(role)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH — Toggle user active status
export async function PATCH(request: Request) {
  const result = await verifyAdmin();
  if (!result.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, isActive } = body;

  if (!userId || typeof isActive !== "boolean") {
    return NextResponse.json(
      { error: "userId and isActive are required" },
      { status: 400 }
    );
  }

  const admin = createServiceRoleClient();

  const { error } = await admin
    .from("profiles")
    .update({ is_active: isActive } as never)
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// POST — Grant or revoke role, or create teacher directly
export async function POST(request: Request) {
  const result = await verifyAdmin();
  if (!result.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { action } = body;
  const admin = createServiceRoleClient();

  // Grant role
  if (action === "grant_role") {
    const { userId, role } = body;
    if (!userId || !["learner", "teacher", "admin"].includes(role)) {
      return NextResponse.json({ error: "userId and valid role required" }, { status: 400 });
    }

    const { error } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role } as never);

    if (error && error.code !== "23505") { // ignore duplicate
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If granting teacher, also create teacher_profiles if not exists
    if (role === "teacher") {
      await admin
        .from("teacher_profiles")
        .insert({ user_id: userId, approval_status: "approved", is_public: true } as never)
        .select()
        .single();
    }

    // If granting learner, also create learner_profiles if not exists
    if (role === "learner") {
      await admin
        .from("learner_profiles")
        .insert({ user_id: userId } as never)
        .select()
        .single();
    }

    return NextResponse.json({ success: true });
  }

  // Revoke role
  if (action === "revoke_role") {
    const { userId, role } = body;
    if (!userId || !["learner", "teacher", "admin"].includes(role)) {
      return NextResponse.json({ error: "userId and valid role required" }, { status: 400 });
    }

    // Prevent revoking own admin role
    if (userId === result.userId && role === "admin") {
      return NextResponse.json({ error: "Cannot revoke your own admin role" }, { status: 400 });
    }

    const { error } = await admin
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If revoking teacher, hide profile
    if (role === "teacher") {
      await admin
        .from("teacher_profiles")
        .update({ is_public: false } as never)
        .eq("user_id", userId);
    }

    return NextResponse.json({ success: true });
  }

  // Suspend teacher
  if (action === "suspend_teacher") {
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    await admin
      .from("teacher_profiles")
      .update({ approval_status: "suspended", is_public: false } as never)
      .eq("user_id", userId);

    // Cancel every upcoming/in-progress booking this teacher has so learners
    // aren't stranded with a teacher who can no longer operate.
    const { data: activeRaw } = await admin
      .from("bookings")
      .select("id, learner_id, scheduled_start_at")
      .eq("teacher_id", userId)
      .in("status", ["confirmed", "in_session"]);

    const activeBookings =
      (activeRaw ?? []) as unknown as Array<{
        id: string;
        learner_id: string;
        scheduled_start_at: string;
      }>;

    if (activeBookings.length > 0) {
      const ids = activeBookings.map((b) => b.id);
      const nowIso = new Date().toISOString();
      await admin
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_at: nowIso,
          cancelled_by: result.userId,
          cancellation_reason: "Teacher suspended by admin",
        } as never)
        .in("id", ids);

      for (const b of activeBookings) {
        await (admin.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<unknown>)(
          "release_booking_slots",
          { p_booking_id: b.id }
        );
        await notifyBookingCancelled(admin, b.learner_id, "Your teacher", b.scheduled_start_at);
      }
    }

    return NextResponse.json({
      success: true,
      cancelled_bookings: activeBookings.length,
    });
  }

  // Reactivate teacher
  if (action === "reactivate_teacher") {
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    await admin
      .from("teacher_profiles")
      .update({ approval_status: "approved", is_public: true } as never)
      .eq("user_id", userId);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// PUT — Change booking status (used by booking status changer component)
export async function PUT(request: Request) {
  const result = await verifyAdmin();
  if (!result.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { bookingId, status } = body;

  const validStatuses = ["confirmed", "in_session", "completed", "cancelled", "no_show"];
  if (!bookingId || !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "bookingId and valid status are required" },
      { status: 400 }
    );
  }

  const admin = createServiceRoleClient();

  // Fetch current state so we can decide whether to release slots.
  const { data: currentRaw, error: fetchError } = await admin
    .from("bookings")
    .select("id, status")
    .eq("id", bookingId)
    .single();

  if (fetchError || !currentRaw) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const current = currentRaw as unknown as { id: string; status: string };
  if (current.status === status) {
    return NextResponse.json({ success: true, noop: true });
  }

  const updatePayload: Record<string, unknown> = { status };
  if (status === "cancelled") {
    updatePayload.cancelled_at = new Date().toISOString();
    updatePayload.cancelled_by = result.userId;
    updatePayload.cancellation_reason = "Changed by admin";
  }

  const { error } = await admin
    .from("bookings")
    .update(updatePayload as never)
    .eq("id", bookingId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // When moving into a terminal non-completion state, free the slots so the
  // teacher's calendar doesn't stay blocked by an admin override.
  if (status === "cancelled" || status === "no_show") {
    await (admin.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<unknown>)(
      "release_booking_slots",
      { p_booking_id: bookingId }
    );
  }

  return NextResponse.json({ success: true });
}
