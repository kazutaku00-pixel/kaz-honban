export type UserRole = "learner" | "teacher" | "admin";
export type JapaneseLevel = "none" | "n5" | "n4" | "n3" | "n2" | "n1";
export type TeacherApprovalStatus = "draft" | "submitted" | "approved" | "rejected" | "suspended";
export type SlotStatus = "open" | "held" | "booked" | "blocked";
export type BookingStatus = "confirmed" | "in_session" | "completed" | "cancelled" | "no_show";
export type RoomStatus = "not_created" | "ready" | "opened" | "ended";
export type ReviewStatus = "published" | "hidden";
export type PaymentStatus = "unpaid" | "paid" | "refunded" | "failed";

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface TeacherProfile {
  id: string;
  user_id: string;
  headline: string | null;
  bio: string | null;
  intro_video_url: string | null;
  hourly_rate: number;
  lesson_duration_options: number[];
  teaching_style: string | null;
  certifications: string | null;
  categories: string[];
  languages: string[];
  levels: string[];
  trial_enabled: boolean;
  trial_price: number | null;
  avg_rating: number;
  review_count: number;
  total_lessons: number;
  approval_status: TeacherApprovalStatus;
  rejection_reason: string | null;
  approved_at: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearnerProfile {
  id: string;
  user_id: string;
  bio: string | null;
  learning_goals: string | null;
  interests: string[] | null;
  native_language: string;
  japanese_level: JapaneseLevel;
  created_at: string;
  updated_at: string;
}

export interface TeacherInvite {
  id: string;
  email: string;
  invite_code: string;
  created_by: string;
  used_at: string | null;
  used_by: string | null;
  expires_at: string;
  created_at: string;
}

export interface ScheduleTemplate {
  id: string;
  teacher_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  buffer_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface AvailabilitySlot {
  id: string;
  teacher_id: string;
  start_at: string;
  end_at: string;
  status: SlotStatus;
  held_by: string | null;
  held_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  learner_id: string;
  teacher_id: string;
  slot_id: string;
  scheduled_start_at: string;
  scheduled_end_at: string;
  duration_minutes: number;
  status: BookingStatus;
  price_amount: number | null;
  platform_fee_amount: number | null;
  teacher_amount: number | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  learner_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyRoom {
  id: string;
  booking_id: string;
  daily_room_name: string;
  daily_room_url: string;
  status: RoomStatus;
  created_at: string;
  expires_at: string;
}

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export interface LessonReport {
  id: string;
  booking_id: string;
  teacher_id: string;
  template_type: string | null;
  summary: string | null;
  homework: string | null;
  next_recommendation: string | null;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  learner_id: string;
  teacher_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  learner_id: string;
  teacher_id: string;
  amount: number;
  platform_fee: number;
  teacher_payout: number;
  currency: string;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  status: PaymentStatus;
  refund_amount: number | null;
  created_at: string;
  updated_at: string;
}

// Teacher with profile join
export interface TeacherWithProfile extends TeacherProfile {
  profile: Profile;
}

// Booking with related data
export interface BookingWithDetails extends Booking {
  teacher: Profile;
  learner: Profile;
  teacher_profile: TeacherProfile;
  daily_room?: DailyRoom;
  review?: Review;
  lesson_report?: LessonReport;
}

// Supabase Database type (for typed client)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      user_roles: {
        Row: UserRoleRow;
        Insert: Omit<UserRoleRow, "id" | "created_at">;
        Update: Partial<Omit<UserRoleRow, "id" | "created_at">>;
      };
      teacher_profiles: {
        Row: TeacherProfile;
        Insert: Partial<TeacherProfile> & { user_id: string };
        Update: Partial<Omit<TeacherProfile, "id" | "user_id" | "created_at">>;
      };
      learner_profiles: {
        Row: LearnerProfile;
        Insert: Partial<LearnerProfile> & { user_id: string };
        Update: Partial<Omit<LearnerProfile, "id" | "user_id" | "created_at">>;
      };
      teacher_invites: {
        Row: TeacherInvite;
        Insert: Omit<TeacherInvite, "id" | "created_at" | "used_at" | "used_by" | "expires_at"> & { expires_at?: string };
        Update: Partial<Omit<TeacherInvite, "id" | "created_at">>;
      };
      schedule_templates: {
        Row: ScheduleTemplate;
        Insert: Omit<ScheduleTemplate, "id" | "created_at" | "is_active" | "buffer_minutes"> & { is_active?: boolean; buffer_minutes?: number };
        Update: Partial<Omit<ScheduleTemplate, "id" | "created_at">>;
      };
      availability_slots: {
        Row: AvailabilitySlot;
        Insert: Omit<AvailabilitySlot, "id" | "created_at" | "updated_at" | "status" | "held_by" | "held_until"> & { status?: SlotStatus };
        Update: Partial<Omit<AvailabilitySlot, "id" | "created_at">>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, "id" | "created_at" | "updated_at" | "status" | "cancellation_reason" | "cancelled_at" | "cancelled_by" | "price_amount" | "platform_fee_amount" | "teacher_amount"> & { status?: BookingStatus };
        Update: Partial<Omit<Booking, "id" | "created_at">>;
      };
      daily_rooms: {
        Row: DailyRoom;
        Insert: Omit<DailyRoom, "id" | "created_at" | "status"> & { status?: RoomStatus };
        Update: Partial<Omit<DailyRoom, "id" | "created_at">>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, "id" | "created_at" | "is_read">;
        Update: Partial<Omit<Message, "id" | "created_at">>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, "id" | "created_at" | "updated_at" | "status"> & { status?: ReviewStatus };
        Update: Partial<Omit<Review, "id" | "created_at">>;
      };
      lesson_reports: {
        Row: LessonReport;
        Insert: Omit<LessonReport, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<LessonReport, "id" | "created_at">>;
      };
      favorites: {
        Row: Favorite;
        Insert: Omit<Favorite, "id" | "created_at">;
        Update: never;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at" | "is_read">;
        Update: { is_read?: boolean };
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, "id" | "created_at" | "updated_at" | "status"> & { status?: PaymentStatus };
        Update: Partial<Omit<Payment, "id" | "created_at">>;
      };
    };
    Functions: {
      release_expired_holds: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: {
      user_role: UserRole;
      japanese_level: JapaneseLevel;
      teacher_approval_status: TeacherApprovalStatus;
      slot_status: SlotStatus;
      booking_status: BookingStatus;
      room_status: RoomStatus;
      review_status: ReviewStatus;
      payment_status: PaymentStatus;
    };
  };
}
