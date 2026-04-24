import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// IANA zone names: "Region/City" style, or a short alias like "UTC".
// Must start with a letter so raw POSIX offsets like "+09:00" are rejected.
function isPlausibleTimezone(tz: string): boolean {
  if (!tz || tz.length > 64) return false;
  return /^[A-Za-z][A-Za-z0-9_+/\-]*$/.test(tz);
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const tz = body?.timezone;
    if (typeof tz !== "string" || !isPlausibleTimezone(tz)) {
      return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ timezone: tz } as never)
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, timezone: tz });
  } catch (err) {
    console.error("PATCH /api/profile/timezone error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
