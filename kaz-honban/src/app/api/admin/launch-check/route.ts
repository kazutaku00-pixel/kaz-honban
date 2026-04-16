import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

interface Check {
  key: string;
  label: string;
  status: "ok" | "warn" | "fail";
  detail: string;
  critical: boolean;
}

export async function GET() {
  const result = await verifyAdmin();
  if (!result.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createServiceRoleClient();
  const checks: Check[] = [];

  // ─── Env vars ──────────────────────────────────────────────────
  const envRequired: Array<{ key: string; critical: boolean; label: string }> = [
    { key: "NEXT_PUBLIC_SUPABASE_URL", critical: true, label: "Supabase URL" },
    { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", critical: true, label: "Supabase anon key" },
    { key: "SUPABASE_SERVICE_ROLE_KEY", critical: true, label: "Supabase service role" },
    { key: "DAILY_API_KEY", critical: true, label: "Daily.co API key" },
    { key: "CRON_SECRET", critical: true, label: "Cron secret" },
    { key: "NEXT_PUBLIC_APP_URL", critical: false, label: "App URL" },
    { key: "RESEND_API_KEY", critical: false, label: "Resend API key (booking emails)" },
  ];

  for (const e of envRequired) {
    const present = !!process.env[e.key];
    checks.push({
      key: `env:${e.key}`,
      label: e.label,
      status: present ? "ok" : e.critical ? "fail" : "warn",
      detail: present ? "Configured" : "Missing — feature disabled",
      critical: e.critical,
    });
  }

  // ─── Teachers ─────────────────────────────────────────────────
  const { count: approvedTeachers } = await admin
    .from("teacher_profiles")
    .select("*", { count: "exact", head: true })
    .eq("approval_status", "approved")
    .eq("is_public", true);

  checks.push({
    key: "teachers:approved",
    label: "At least one approved, public teacher",
    status: (approvedTeachers ?? 0) > 0 ? "ok" : "fail",
    detail: `${approvedTeachers ?? 0} approved + public teacher(s)`,
    critical: true,
  });

  checks.push({
    key: "teachers:three",
    label: "3+ public teachers (better browse UX)",
    status: (approvedTeachers ?? 0) >= 3 ? "ok" : "warn",
    detail: `${approvedTeachers ?? 0} of recommended 3`,
    critical: false,
  });

  // ─── Slots ────────────────────────────────────────────────────
  const now = new Date().toISOString();
  const { count: futureSlots } = await admin
    .from("availability_slots")
    .select("*", { count: "exact", head: true })
    .eq("status", "open")
    .gt("start_at", now);

  checks.push({
    key: "slots:future",
    label: "Open future slots exist",
    status: (futureSlots ?? 0) > 0 ? "ok" : "fail",
    detail: `${futureSlots ?? 0} open slot(s) in the future`,
    critical: true,
  });

  // ─── Templates ────────────────────────────────────────────────
  const { count: activeTemplates } = await admin
    .from("schedule_templates")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  checks.push({
    key: "templates:active",
    label: "Active schedule templates",
    status: (activeTemplates ?? 0) > 0 ? "ok" : "fail",
    detail: `${activeTemplates ?? 0} active template(s). Without them, nightly slot cron produces nothing.`,
    critical: true,
  });

  // ─── Admins ───────────────────────────────────────────────────
  const { count: adminCount } = await admin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");

  checks.push({
    key: "admins:count",
    label: "At least 2 admins (bus factor)",
    status: (adminCount ?? 0) >= 2 ? "ok" : (adminCount ?? 0) === 1 ? "warn" : "fail",
    detail: `${adminCount ?? 0} admin(s)`,
    critical: false,
  });

  // ─── Storage ──────────────────────────────────────────────────
  try {
    const { data: buckets } = await admin.storage.listBuckets();
    const ids = new Set((buckets ?? []).map((b) => b.id));
    for (const required of ["avatars", "videos", "chat-images"] as const) {
      checks.push({
        key: `bucket:${required}`,
        label: `Storage bucket: ${required}`,
        status: ids.has(required) ? "ok" : "fail",
        detail: ids.has(required) ? "Exists" : "Missing bucket — uploads will fail",
        critical: required !== "chat-images", // chat-images can be added later
      });
    }
  } catch (e) {
    checks.push({
      key: "bucket:error",
      label: "Storage buckets",
      status: "warn",
      detail: `Could not list buckets: ${(e as Error).message}`,
      critical: false,
    });
  }

  // ─── Summary ──────────────────────────────────────────────────
  const summary = {
    ok: checks.filter((c) => c.status === "ok").length,
    warn: checks.filter((c) => c.status === "warn").length,
    fail: checks.filter((c) => c.status === "fail").length,
    blocking: checks.filter((c) => c.status === "fail" && c.critical).length,
    total: checks.length,
  };

  return NextResponse.json({ summary, checks });
}
