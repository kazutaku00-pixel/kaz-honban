import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { Star, Heart, Globe, GraduationCap, BookOpen, Award, Play } from "lucide-react";
import { CATEGORIES, LANGUAGES, LEVELS } from "@/lib/validations";
import { AvailableSlots } from "@/components/teachers/available-slots";
import type { TeacherWithProfile, Review, Profile } from "@/types/database";
import type { Metadata } from "next";

const avatarColors = [
  "from-accent to-orange-400",
  "from-gold to-amber-400",
  "from-emerald-500 to-teal-400",
  "from-sky-500 to-blue-400",
  "from-violet-500 to-purple-400",
];

function getLabel(
  value: string,
  list: readonly { value: string; label: string }[]
) {
  return list.find((item) => item.value === value)?.label ?? value;
}

type ReviewWithReviewer = Review & {
  reviewer: Pick<Profile, "display_name" | "avatar_url">;
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: teacher } = await supabase
    .from("teacher_profiles")
    .select("*, profile:profiles!user_id(*)")
    .eq("user_id", id)
    .eq("approval_status", "approved")
    .eq("is_public", true)
    .single();

  if (!teacher) {
    return { title: "Teacher Not Found | NihonGo" };
  }

  const t = teacher as TeacherWithProfile;
  return {
    title: `${t.profile.display_name} | NihonGo`,
    description: t.headline ?? `Japanese teacher on NihonGo`,
  };
}

export default async function TeacherDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: teacher } = await supabase
    .from("teacher_profiles")
    .select("*, profile:profiles!user_id(*)")
    .eq("user_id", id)
    .eq("approval_status", "approved")
    .eq("is_public", true)
    .single();

  if (!teacher) notFound();

  const t = teacher as TeacherWithProfile;

  // Fetch reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, reviewer:profiles!reviewer_id(display_name, avatar_url)")
    .eq("reviewee_id", t.user_id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(10);

  const reviewList = (reviews ?? []) as ReviewWithReviewer[];
  const profile = t.profile;
  const initial = (profile.display_name ?? "?")[0].toUpperCase();

  // Extract YouTube video ID if present
  const youtubeId = t.intro_video_url
    ? extractYouTubeId(t.intro_video_url)
    : null;

  return (
    <div className="min-h-screen bg-bg-primary pb-24 md:pb-12">
      {/* Top nav */}
      <div className="border-b border-border bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-5 py-4 flex items-center justify-between">
          <Link
            href="/teachers"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            &larr; Back to Teachers
          </Link>
          <Link
            href="/"
            className="text-lg font-bold font-[family-name:var(--font-display)] text-text-primary"
          >
            NihonGo
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 py-8 md:py-12">
        {/* Hero section */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-10">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover"
              />
            ) : (
              <div
                className={cn(
                  "w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-4xl md:text-5xl",
                  avatarColors[initial.charCodeAt(0) % avatarColors.length]
                )}
              >
                {initial}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-display)] text-text-primary">
              {profile.display_name}
            </h1>
            {t.headline && (
              <p className="mt-1 text-text-secondary text-sm md:text-base">
                {t.headline}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <div className="flex items-center gap-1">
                <Star size={16} className="text-gold fill-gold" />
                <span className="text-sm font-medium text-text-primary">
                  {t.avg_rating.toFixed(1)}
                </span>
                <span className="text-sm text-text-muted">
                  ({t.review_count} reviews)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen size={16} className="text-text-muted" />
                <span className="text-sm text-text-secondary">
                  {t.total_lessons} lessons
                </span>
              </div>
            </div>

            {/* Pricing */}
            <div className="mt-4 flex items-baseline gap-3">
              <div className="bg-bg-secondary rounded-xl px-4 py-2 border border-border">
                <span className="text-xl font-bold text-text-primary">
                  ${t.hourly_rate}
                </span>
                <span className="text-xs text-text-muted ml-1">/25min</span>
              </div>
              {t.lesson_duration_options.includes(50) && (
                <div className="bg-bg-secondary rounded-xl px-4 py-2 border border-border">
                  <span className="text-xl font-bold text-text-primary">
                    ${t.hourly_rate * 2}
                  </span>
                  <span className="text-xs text-text-muted ml-1">/50min</span>
                </div>
              )}
              {t.trial_enabled && t.trial_price !== null && (
                <div className="bg-accent-subtle rounded-xl px-4 py-2 border border-accent/30">
                  <span className="text-sm font-bold text-accent">
                    Trial ${t.trial_price}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tags: categories, languages, levels */}
        <div className="space-y-4 mb-10">
          {/* Categories */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap size={16} className="text-accent" />
              <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Categories
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {t.categories.map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-subtle text-accent border border-accent/20"
                >
                  {getLabel(cat, CATEGORIES)}
                </span>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Globe size={16} className="text-gold" />
              <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Teaching Languages
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {t.languages.map((lang) => (
                <span
                  key={lang}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gold-subtle text-gold border border-gold/20"
                >
                  {getLabel(lang, LANGUAGES)}
                </span>
              ))}
            </div>
          </div>

          {/* Levels */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award size={16} className="text-emerald-400" />
              <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Student Levels
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {t.levels.map((lvl) => (
                <span
                  key={lvl}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                >
                  {getLabel(lvl, LEVELS)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bio */}
        {t.bio && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-display)] mb-3">
              About Me
            </h2>
            <div className="bg-bg-secondary rounded-2xl border border-border p-5">
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                {t.bio}
              </p>
            </div>
          </section>
        )}

        {/* Teaching style & Certifications */}
        {(t.teaching_style || t.certifications) && (
          <section className="mb-10 grid gap-5 md:grid-cols-2">
            {t.teaching_style && (
              <div className="bg-bg-secondary rounded-2xl border border-border p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  Teaching Style
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t.teaching_style}
                </p>
              </div>
            )}
            {t.certifications && (
              <div className="bg-bg-secondary rounded-2xl border border-border p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  Certifications
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t.certifications}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Intro video */}
        {youtubeId && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-display)] mb-3">
              <Play size={18} className="inline mr-2 -mt-0.5 text-accent" />
              Introduction Video
            </h2>
            <div className="aspect-video rounded-2xl overflow-hidden border border-border">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="Teacher introduction video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </section>
        )}

        {/* Available slots */}
        <section className="mb-10 bg-bg-secondary rounded-2xl border border-border p-5 md:p-6">
          <AvailableSlots teacherId={t.user_id} />
        </section>

        {/* Reviews */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-display)] mb-4">
            Reviews
            {t.review_count > 0 && (
              <span className="text-sm font-normal text-text-muted ml-2">
                ({t.review_count})
              </span>
            )}
          </h2>

          {reviewList.length === 0 ? (
            <p className="text-text-muted text-sm py-8 text-center">
              No reviews yet
            </p>
          ) : (
            <div className="space-y-4">
              {reviewList.map((review) => (
                <div
                  key={review.id}
                  className="bg-bg-secondary rounded-2xl border border-border p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {review.reviewer.avatar_url ? (
                      <img
                        src={review.reviewer.avatar_url}
                        alt={review.reviewer.display_name}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center text-xs font-bold text-text-muted">
                        {(review.reviewer.display_name ?? "?")[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {review.reviewer.display_name}
                      </p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={cn(
                              i < review.rating
                                ? "text-gold fill-gold"
                                : "text-text-muted"
                            )}
                          />
                        ))}
                        <span className="text-xs text-text-muted ml-1">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Floating CTA (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg-primary/90 backdrop-blur-md border-t border-border md:hidden z-30">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-lg font-bold text-text-primary">
              ${t.hourly_rate}
            </span>
            <span className="text-xs text-text-muted"> /25min</span>
          </div>
          <a
            href="#available-slots"
            className="flex-1 max-w-[200px] py-3 rounded-xl text-sm font-semibold text-center bg-accent hover:bg-accent-hover text-white transition-colors"
          >
            Book a Lesson
          </a>
        </div>
      </div>
    </div>
  );
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}
