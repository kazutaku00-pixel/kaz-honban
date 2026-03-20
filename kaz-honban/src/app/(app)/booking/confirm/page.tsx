import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BookingConfirmClient } from "@/components/bookings/booking-confirm-client";
import type { Profile, TeacherProfile, AvailabilitySlot } from "@/types/database";

interface PageProps {
  searchParams: Promise<{
    teacher_id?: string;
    slot_id?: string;
    duration?: string;
  }>;
}

export default async function BookingConfirmPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { teacher_id, slot_id, duration } = params;

  if (!teacher_id || !slot_id || !duration) {
    redirect("/");
  }

  const durationMinutes = Number(duration);
  if (durationMinutes !== 25 && durationMinutes !== 50) {
    redirect("/");
  }

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/signup");
  }

  // Fetch teacher profile + profile
  const { data: teacherProfile } = await supabase
    .from("teacher_profiles")
    .select("*")
    .eq("user_id", teacher_id)
    .single();

  if (!teacherProfile) {
    redirect("/");
  }

  const { data: teacherUser } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", teacher_id)
    .single();

  if (!teacherUser) {
    redirect("/");
  }

  // Fetch the slot
  const { data: slot } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("id", slot_id)
    .eq("status", "open")
    .single();

  if (!slot) {
    redirect("/");
  }

  return (
    <BookingConfirmClient
      teacher={teacherUser as Profile}
      teacherProfile={teacherProfile as TeacherProfile}
      slot={slot as AvailabilitySlot}
      durationMinutes={durationMinutes}
      learnerId={user.id}
    />
  );
}
