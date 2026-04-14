import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { sendLessonReminder } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const now = new Date();
    const windowStart = new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString();
    const windowEnd = new Date(now.getTime() + 30 * 60 * 60 * 1000).toISOString();

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        scheduled_start_at,
        learner:profiles!bookings_learner_id_fkey(id, display_name, email, timezone),
        teacher:profiles!bookings_teacher_id_fkey(id, display_name, email, timezone)
      `)
      .eq("status", "confirmed")
      .is("reminder_sent_at", null)
      .gte("scheduled_start_at", windowStart)
      .lte("scheduled_start_at", windowEnd);

    if (error) {
      console.error("send-reminders fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (bookings ?? []) as unknown as Array<{
      id: string;
      scheduled_start_at: string;
      learner: { id: string; display_name: string; email: string; timezone: string | null } | null;
      teacher: { id: string; display_name: string; email: string; timezone: string | null } | null;
    }>;

    let sent = 0;
    for (const b of rows) {
      if (!b.learner || !b.teacher) continue;

      await sendLessonReminder({
        toEmail: b.learner.email,
        toName: b.learner.display_name,
        counterpartName: b.teacher.display_name,
        scheduledStartAt: b.scheduled_start_at,
        bookingId: b.id,
        timezone: b.learner.timezone,
        role: "learner",
      });
      await sendLessonReminder({
        toEmail: b.teacher.email,
        toName: b.teacher.display_name,
        counterpartName: b.learner.display_name,
        scheduledStartAt: b.scheduled_start_at,
        bookingId: b.id,
        timezone: b.teacher.timezone,
        role: "teacher",
      });

      await supabase
        .from("bookings")
        .update({ reminder_sent_at: new Date().toISOString() } as never)
        .eq("id", b.id);

      sent += 1;
    }

    return NextResponse.json({ success: true, sent_count: sent });
  } catch (err) {
    console.error("GET /api/cron/send-reminders error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
