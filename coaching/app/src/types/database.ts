export type UserRole = 'student' | 'teacher' | 'admin'
export type JapaneseLevel = 'none' | 'n5' | 'n4' | 'n3' | 'n2' | 'n1'
export type LessonStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
export type PaymentStatus = 'pending' | 'completed' | 'refunded' | 'partial_refund'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  country: string | null
  japanese_level: JapaneseLevel | null
  avatar_url: string | null
  timezone: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TeacherProfile {
  id: string
  user_id: string
  bio: string
  languages: string[]
  hourly_rate: number
  intro_video_url: string | null
  certifications: string | null
  avg_rating: number
  total_reviews: number
  total_lessons: number
  is_approved: boolean
  approved_at: string | null
  created_at: string
  // joined from users table
  user?: User
}

export interface TeacherSchedule {
  id: string
  teacher_id: string
  day_of_week: number // 0=Sunday, 6=Saturday
  start_time: string  // HH:MM format
  end_time: string    // HH:MM format
  is_available: boolean
}

export interface Lesson {
  id: string
  student_id: string
  teacher_id: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: LessonStatus
  daily_room_url: string | null
  daily_room_name: string | null
  cancelled_by: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  created_at: string
  // joined
  student?: User
  teacher?: User
  teacher_profile?: TeacherProfile
}

export interface Review {
  id: string
  lesson_id: string
  student_id: string
  teacher_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string | null
  // joined
  student?: User
}

export interface Payment {
  id: string
  lesson_id: string
  student_id: string
  teacher_id: string
  amount: number
  platform_fee: number
  teacher_payout: number
  stripe_payment_id: string | null
  status: PaymentStatus
  refund_amount: number | null
  created_at: string
}

export interface Favorite {
  id: string
  student_id: string
  teacher_id: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'booking' | 'reminder' | 'review' | 'approval' | 'cancellation'
  title: string
  message: string
  is_read: boolean
  link: string | null
  created_at: string
}

// Supabase Database type helper
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      teacher_profiles: {
        Row: TeacherProfile
        Insert: Omit<TeacherProfile, 'id' | 'created_at' | 'avg_rating' | 'total_reviews' | 'total_lessons'>
        Update: Partial<Omit<TeacherProfile, 'id' | 'created_at'>>
      }
      teacher_schedules: {
        Row: TeacherSchedule
        Insert: Omit<TeacherSchedule, 'id'>
        Update: Partial<Omit<TeacherSchedule, 'id'>>
      }
      lessons: {
        Row: Lesson
        Insert: Omit<Lesson, 'id' | 'created_at'>
        Update: Partial<Omit<Lesson, 'id' | 'created_at'>>
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'created_at'>
        Update: Partial<Omit<Review, 'id' | 'created_at'>>
      }
      payments: {
        Row: Payment
        Insert: Omit<Payment, 'id' | 'created_at'>
        Update: Partial<Omit<Payment, 'id' | 'created_at'>>
      }
      favorites: {
        Row: Favorite
        Insert: Omit<Favorite, 'id' | 'created_at'>
        Update: Partial<Omit<Favorite, 'id'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'>
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>
      }
    }
  }
}
