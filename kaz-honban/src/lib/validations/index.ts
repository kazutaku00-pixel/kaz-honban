import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  display_name: z.string().min(1, "Name is required").max(50),
});

export const roleSelectSchema = z.object({
  role: z.enum(["learner", "teacher"]),
});

export const teacherProfileSchema = z.object({
  headline: z.string().min(1).max(80),
  bio: z.string().min(200, "Bio must be at least 200 characters").max(1000),
  hourly_rate: z.number().min(5).max(100),
  categories: z.array(z.string()).min(1, "Select at least one category"),
  languages: z.array(z.string()).min(1, "Select at least one language"),
  levels: z.array(z.string()).min(1, "Select at least one level"),
  lesson_duration_options: z
    .array(z.number().refine((n) => n === 30))
    .min(1, "At least one duration required")
    .default([30]),
  teaching_style: z.string().optional(),
  certifications: z.string().optional(),
  university: z.string().max(100).optional(),
  country_of_origin: z.string().max(60).optional(),
  years_of_experience: z.number().int().min(0).max(70).optional(),
  intro_video_url: z.string().url().optional().or(z.literal("")),
  trial_enabled: z.boolean().optional(),
  trial_price: z.number().min(0).optional(),
});

export const scheduleTemplateSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM format"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM format"),
  buffer_minutes: z.number().min(0).max(30).default(5),
});

// All lessons are 30 minutes. Duration is fixed server-side and not
// accepted from the client — see LESSON_DURATION_MINUTES below.
export const LESSON_DURATION_MINUTES = 30 as const;

export const bookingSchema = z.object({
  teacher_id: z.string().uuid(),
  slot_id: z.string().uuid(),
  learner_note: z.string().max(500).optional(),
});

export const REVIEW_TAGS = [
  { value: "patient", label: "Patient" },
  { value: "encouraging", label: "Encouraging" },
  { value: "well_prepared", label: "Well-prepared" },
  { value: "clear_explanation", label: "Clear explanations" },
  { value: "great_pronunciation", label: "Great pronunciation" },
  { value: "natural_conversation", label: "Natural conversation" },
  { value: "homework_useful", label: "Useful homework" },
  { value: "on_time", label: "Always on time" },
  { value: "good_for_beginners", label: "Good for beginners" },
  { value: "jlpt_focused", label: "JLPT focused" },
  { value: "business_japanese", label: "Business Japanese" },
  { value: "fun", label: "Fun lessons" },
] as const;

export const REVIEW_TAG_VALUES = REVIEW_TAGS.map((t) => t.value) as unknown as [string, ...string[]];

export const reviewSchema = z.object({
  booking_id: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
  tags: z.array(z.enum(REVIEW_TAG_VALUES)).max(6).optional(),
});

export const lessonReportSchema = z.object({
  booking_id: z.string().uuid(),
  template_type: z.string().optional(),
  summary: z.string().max(2000).optional(),
  homework: z.string().max(2000).optional(),
  next_recommendation: z.string().max(1000).optional(),
  internal_note: z.string().max(2000).optional(),
});

// Category / Language / Level options
export const CATEGORIES = [
  { value: "daily_conversation", label: "Daily Conversation" },
  { value: "business", label: "Business Japanese" },
  { value: "jlpt", label: "JLPT Preparation" },
  { value: "travel", label: "Travel Japanese" },
  { value: "anime_manga", label: "Anime & Manga" },
  { value: "pronunciation", label: "Pronunciation" },
  { value: "reading_writing", label: "Reading & Writing" },
  { value: "keigo", label: "Keigo (Polite Language)" },
] as const;

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "zh", label: "Chinese" },
  { value: "ko", label: "Korean" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "pt", label: "Portuguese" },
  { value: "vi", label: "Vietnamese" },
  { value: "id", label: "Indonesian" },
] as const;

export const LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "n5", label: "JLPT N5" },
  { value: "n4", label: "JLPT N4" },
  { value: "n3", label: "JLPT N3" },
  { value: "n2", label: "JLPT N2" },
  { value: "n1", label: "JLPT N1" },
] as const;

export const LEARNING_GOALS = [
  { value: "daily_conversation", label: "Daily Conversation" },
  { value: "jlpt", label: "JLPT Preparation" },
  { value: "business", label: "Business Japanese" },
  { value: "travel", label: "Travel Japanese" },
  { value: "anime_manga", label: "Anime & Manga" },
  { value: "reading_writing", label: "Reading & Writing" },
  { value: "pronunciation", label: "Pronunciation" },
  { value: "keigo", label: "Keigo (Polite)" },
  { value: "academic", label: "Academic Japanese" },
  { value: "culture", label: "Culture & Customs" },
] as const;

export const LESSON_REPORT_TEMPLATES = [
  { value: "grammar", label: "Grammar Practice" },
  { value: "conversation", label: "Conversation Practice" },
  { value: "jlpt", label: "JLPT Preparation" },
  { value: "free_talk", label: "Free Talk" },
] as const;
