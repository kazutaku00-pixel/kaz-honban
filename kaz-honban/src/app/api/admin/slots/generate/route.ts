import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const result = await verifyAdmin();
  if (!result.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();

  const body = await request.json().catch(() => ({}));
  const daysAhead = Math.max(1, Math.min(30, Number(body.days_ahead ?? 14)));

  const { data, error } = await (supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>)(
    "generate_slots_from_templates",
    { p_days_ahead: daysAhead, p_slot_minutes: 30 }
  );

  if (error) {
    return NextResponse.json(
      { error: "Failed to generate slots", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, created_count: data ?? 0 });
}
