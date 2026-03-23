import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Booking, Profile, TeacherProfile, AvailabilitySlot } from "@/types/database";
import { ReviewFormClient } from "./review-form-client";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: bookingId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch booking
  const { data: bookingRaw } = await supabase
    .from("bookings")
    .select(
      `*, teacher:profiles!bookings_teacher_id_fkey(*)`
    )
    .eq("id", bookingId)
    .single();

  if (!bookingRaw) redirect("/bookings");

  const booking = bookingRaw as unknown as Booking & {
    teacher: Profile;
  };

  // Fetch teacher profile separately (no direct FK from bookings)
  const { data: teacherProfileRaw } = await supabase
    .from("teacher_profiles")
    .select("headline")
    .eq("user_id", booking.teacher_id)
    .single();
  const teacherProfile = teacherProfileRaw as unknown as { headline: string | null } | null;

  // Verify learner
  if (booking.learner_id !== user.id) redirect("/bookings");

  // Check if already reviewed
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("reviewer_id", user.id)
    .single();

  // Teacher's next 3 available slots for rebooking
  const { data: slotsRaw } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("teacher_id", booking.teacher_id)
    .eq("status", "open")
    .gte("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(3);

  const nextSlots = (slotsRaw ?? []) as unknown as AvailabilitySlot[];

  return (
    <ReviewFormClient
      booking={{
        id: booking.id,
        teacher_id: booking.teacher_id,
        teacher_name: booking.teacher?.display_name ?? "Teacher",
        teacher_avatar: booking.teacher?.avatar_url ?? null,
        teacher_headline: teacherProfile?.headline ?? null,
      }}
      alreadyReviewed={!!existingReview}
      nextSlots={nextSlots.map((s) => ({
        id: s.id,
        start_at: s.start_at,
        end_at: s.end_at,
      }))}
    />
  );
}
