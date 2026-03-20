import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ScheduleTemplate, AvailabilitySlot } from "@/types/database";
import { ScheduleClient } from "./schedule-client";

export default async function TeacherSchedulePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify teacher role
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "teacher");

  if (!roles?.length) redirect("/dashboard");

  // Fetch templates
  const { data: templatesRaw } = await supabase
    .from("schedule_templates")
    .select("*")
    .eq("teacher_id", user.id)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true });

  const templates = (templatesRaw ?? []) as unknown as ScheduleTemplate[];

  // Fetch upcoming slots
  const { data: slotsRaw } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("teacher_id", user.id)
    .gte("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(50);

  const slots = (slotsRaw ?? []) as unknown as AvailabilitySlot[];

  return (
    <ScheduleClient
      templates={templates.map((t) => ({
        id: t.id,
        day_of_week: t.day_of_week,
        start_time: t.start_time,
        end_time: t.end_time,
        buffer_minutes: t.buffer_minutes,
      }))}
      slots={slots.map((s) => ({
        id: s.id,
        start_at: s.start_at,
        end_at: s.end_at,
        status: s.status,
      }))}
    />
  );
}
