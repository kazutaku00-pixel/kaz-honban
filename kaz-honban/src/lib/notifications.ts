import { SupabaseClient } from "@supabase/supabase-js";

type NotificationType =
  | "booking_created"
  | "booking_cancelled"
  | "lesson_starting"
  | "lesson_completed"
  | "review_received"
  | "report_ready"
  | "teacher_approved"
  | "teacher_rejected";

interface CreateNotificationParams {
  supabase: SupabaseClient;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification({
  supabase,
  userId,
  type,
  title,
  message,
  link,
}: CreateNotificationParams) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    link,
  });

  if (error) {
    console.error("Failed to create notification:", error);
  }
}

// Helper: notify teacher when a student books
export async function notifyBookingCreated(
  supabase: SupabaseClient,
  teacherId: string,
  learnerName: string,
  startAt: string,
  bookingId: string
) {
  const date = new Date(startAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  await createNotification({
    supabase,
    userId: teacherId,
    type: "booking_created",
    title: "New Booking",
    message: `${learnerName} booked a lesson on ${date}`,
    link: `/teacher/bookings`,
  });
}

// Helper: notify both parties on cancellation
export async function notifyBookingCancelled(
  supabase: SupabaseClient,
  notifyUserId: string,
  cancellerName: string,
  startAt: string
) {
  const date = new Date(startAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  await createNotification({
    supabase,
    userId: notifyUserId,
    type: "booking_cancelled",
    title: "Booking Cancelled",
    message: `${cancellerName} cancelled the lesson on ${date}`,
    link: `/bookings`,
  });
}

// Helper: notify learner when lesson report is ready
export async function notifyReportReady(
  supabase: SupabaseClient,
  learnerId: string,
  teacherName: string,
  bookingId: string
) {
  await createNotification({
    supabase,
    userId: learnerId,
    type: "report_ready",
    title: "Lesson Report Ready",
    message: `${teacherName} wrote a lesson report with homework`,
    link: `/history`,
  });
}

// Helper: notify teacher when review received
export async function notifyReviewReceived(
  supabase: SupabaseClient,
  teacherId: string,
  learnerName: string,
  rating: number
) {
  await createNotification({
    supabase,
    userId: teacherId,
    type: "review_received",
    title: "New Review",
    message: `${learnerName} left a ${rating}-star review`,
    link: `/teacher/bookings`,
  });
}

// Helper: notify teacher on approval
export async function notifyTeacherApproved(
  supabase: SupabaseClient,
  teacherId: string
) {
  await createNotification({
    supabase,
    userId: teacherId,
    type: "teacher_approved",
    title: "Profile Approved!",
    message: "Your teacher profile has been approved. Students can now find you.",
    link: `/teacher/dashboard`,
  });
}

// Helper: notify teacher on rejection
export async function notifyTeacherRejected(
  supabase: SupabaseClient,
  teacherId: string,
  reason: string
) {
  await createNotification({
    supabase,
    userId: teacherId,
    type: "teacher_rejected",
    title: "Profile Needs Changes",
    message: `Your profile was not approved: ${reason}`,
    link: `/teacher/profile`,
  });
}
