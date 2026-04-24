import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { Star, Globe, BookOpen, BadgeCheck, Play, GraduationCap, MapPin, Clock } from "lucide-react";
import { CATEGORIES, LANGUAGES, LEVELS, REVIEW_TAGS } from "@/lib/validations";
import { AvailableSlots } from "@/components/teachers/available-slots";
import { TeacherDetailTabs } from "@/components/teachers/teacher-detail-tabs";
import { IntroVideoPlayer } from "@/components/teachers/intro-video-player";
import { TeacherShareButton } from "@/components/teachers/teacher-share-button";
import { TeacherStickyCTA } from "@/components/teachers/teacher-sticky-cta";
import { BackButton } from "@/components/teachers/back-button";
import { T } from "@/components/i18n-text";
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

  // Aggregate review tags across the teacher's reviews — top 5 by frequency.
  const tagCounts = new Map<string, number>();
  for (const r of reviewList) {
    for (const tag of r.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const profile = t.profile;
  const initial = (profile.display_name ?? "?")[0].toUpperCase();
  const colorIdx = initial.charCodeAt(0) % avatarColors.length;

  // Determine video type
  const hasDirectVideo = t.intro_video_url ? isDirectVideo(t.intro_video_url) : false;
  const youtubeId = t.intro_video_url && !hasDirectVideo
    ? extractYouTubeId(t.intro_video_url)
    : null;
  const hasVideo = hasDirectVideo || !!youtubeId;

  // ─── About Tab Content ───
  const aboutContent = (
    <div className="space-y-6">
      {/* Bio */}
      {t.bio && (
        <div className="bg-bg-secondary rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-2"><T k="detail.aboutMe" /></h3>
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
            {t.bio}
          </p>
        </div>
      )}

      {/* Background facts (university / from / experience) */}
      {(t.university || t.country_of_origin || t.years_of_experience != null) && (
        <div className="bg-bg-secondary rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            <T k="detail.background" />
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {t.university && (
              <div className="flex items-start gap-2">
                <GraduationCap size={16} className="text-accent mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-text-muted">
                    <T k="detail.university" />
                  </p>
                  <p className="text-sm text-text-primary font-medium break-words">
                    {t.university}
                  </p>
                </div>
              </div>
            )}
            {t.country_of_origin && (
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-text-muted">
                    <T k="detail.from" />
                  </p>
                  <p className="text-sm text-text-primary font-medium break-words">
                    {t.country_of_origin}
                  </p>
                </div>
              </div>
            )}
            {t.years_of_experience != null && (
              <div className="flex items-start gap-2">
                <Clock size={16} className="text-gold mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-text-muted">
                    <T k="detail.experience" />
                  </p>
                  <p className="text-sm text-text-primary font-medium">
                    {t.years_of_experience}
                    {" "}
                    <T k="detail.years" />
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* About me cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {t.teaching_style && (
          <div className="bg-bg-secondary rounded-2xl border border-border p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1.5">
              <Globe size={14} className="text-accent" />
              <T k="detail.teachingStyle" />
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              {t.teaching_style}
            </p>
          </div>
        )}
        {t.certifications && (
          <div className="bg-bg-secondary rounded-2xl border border-border p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1.5">
              <BadgeCheck size={14} className="text-emerald-400" />
              <T k="detail.certifications" />
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              {t.certifications}
            </p>
          </div>
        )}
        {/* Stats card */}
        <div className="bg-bg-secondary rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3"><T k="detail.stats" /></h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Star size={12} className="text-gold fill-gold" /> <T k="detail.avgRating" />
              </span>
              <span className="text-sm font-semibold text-text-primary">{t.avg_rating.toFixed(1)} / 5.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted flex items-center gap-1">
                <BookOpen size={12} /> <T k="detail.reviewCount" />
              </span>
              <span className="text-sm font-semibold text-text-primary">{t.review_count}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted flex items-center gap-1">
                <BookOpen size={12} /> <T k="detail.totalLessons" />
              </span>
              <span className="text-sm font-semibold text-text-primary">{t.total_lessons}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted flex items-center gap-1">
                <BookOpen size={12} /> Hours taught
              </span>
              <span className="text-sm font-semibold text-text-primary">
                {Math.round((t.total_lessons * 30) / 60)}h
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Intro video — full width in About tab (for non-hero video) */}
      {hasVideo && !hasDirectVideo && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Play size={16} className="text-accent" />
            <T k="detail.introVideo" />
          </h3>
          <IntroVideoPlayer
            src={t.intro_video_url!}
            youtubeId={youtubeId}
          />
        </div>
      )}
    </div>
  );

  // ─── Schedule Tab Content ───
  const scheduleContent = (
    <div id="available-slots" className="bg-bg-secondary rounded-2xl border border-border p-5 md:p-6">
      <AvailableSlots
        teacherId={t.user_id}
        teacherTimezone={profile.timezone}
        teacherName={profile.display_name}
        teacherAvatar={profile.avatar_url}
        teacherHeadline={t.headline}
        hourlyRate={t.hourly_rate}
      />
    </div>
  );

  // ─── Reviews Tab Content ───
  const reviewsContent = (
    <div>
      {reviewList.length === 0 ? (
        <p className="text-text-muted text-sm py-8 text-center">
          <T k="detail.noReviews" />
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
                  <Image
                    src={review.reviewer.avatar_url}
                    alt={review.reviewer.display_name}
                    width={32}
                    height={32}
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
              {review.tags && review.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {review.tags.map((tag) => {
                    const label = REVIEW_TAGS.find((x) => x.value === tag)?.label ?? tag;
                    return (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary pb-32 md:pb-16">
      {/* Top nav: back + share */}
      <div className="mx-auto max-w-4xl px-5 pt-4 flex items-center justify-between">
        <BackButton fallbackHref="/teachers" />
        <TeacherShareButton
          name={profile.display_name}
          url={`/teachers/${t.user_id}`}
        />
      </div>

      <div className="mx-auto max-w-4xl px-5 py-6 md:py-8">
        {/* ── Hero: photo + video side by side ── */}
        <div className="mb-8">
          {hasVideo ? (
            /* Layout with video: left=info, right=video */
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              {/* Left: avatar + info */}
              <div className="md:w-1/2 flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.display_name}
                        width={96}
                        height={96}
                        className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover"
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-3xl",
                          avatarColors[colorIdx]
                        )}
                      >
                        {initial}
                      </div>
                    )}
                  </div>

                  {/* Name + headline */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl md:text-2xl font-bold font-[family-name:var(--font-display)] text-text-primary">
                        {profile.display_name}
                      </h1>
                      {/* Verified badge — all shown teachers are approved */}
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        <BadgeCheck size={11} />
                        Verified
                      </span>
                    </div>
                    {t.headline && (
                      <p className="mt-1 text-text-secondary text-xs md:text-sm line-clamp-2">
                        {t.headline}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star size={15} className="text-gold fill-gold" />
                    <span className="text-sm font-semibold text-text-primary">
                      {t.avg_rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-text-muted">
                      ({t.review_count} <T k="detail.reviews" />)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen size={14} className="text-text-muted" />
                    <span className="text-xs text-text-secondary">
                      {t.total_lessons} <T k="detail.lessons" />
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3 flex-wrap">
                  <div className="bg-bg-secondary rounded-xl px-4 py-2 border border-border">
                    <span className="text-xl font-bold text-text-primary">${t.hourly_rate / 2}</span>
                    <span className="text-xs text-text-muted ml-1">/30min</span>
                  </div>
                  {t.trial_enabled && t.trial_price !== null && (
                    <div className="bg-accent-subtle rounded-xl px-4 py-2 border border-accent/30">
                      <span className="text-sm font-bold text-accent">Trial ${t.trial_price}</span>
                    </div>
                  )}
                </div>

                {/* Book CTA (desktop, below price) */}
                <a
                  href="#available-slots"
                  className="hidden md:inline-flex items-center justify-center py-3 px-6 rounded-xl text-sm font-semibold bg-accent hover:bg-accent-hover text-white transition-colors self-start"
                >
                  <T k="detail.bookLesson" />
                </a>
              </div>

              {/* Right: intro video */}
              <div className="md:w-1/2">
                <IntroVideoPlayer
                  src={t.intro_video_url!}
                  youtubeId={youtubeId}
                />
              </div>
            </div>
          ) : (
            /* No video: original layout */
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              <div className="flex-shrink-0">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    width={144}
                    height={144}
                    className="w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover"
                  />
                ) : (
                  <div
                    className={cn(
                      "w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-4xl md:text-5xl",
                      avatarColors[colorIdx]
                    )}
                  >
                    {initial}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-display)] text-text-primary">
                    {profile.display_name}
                  </h1>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    <BadgeCheck size={11} />
                    Verified
                  </span>
                </div>
                {t.headline && (
                  <p className="mt-1 text-text-secondary text-sm md:text-base">{t.headline}</p>
                )}
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-gold fill-gold" />
                    <span className="text-sm font-medium text-text-primary">
                      {t.avg_rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-text-muted">
                      ({t.review_count} <T k="detail.reviews" />)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen size={16} className="text-text-muted" />
                    <span className="text-sm text-text-secondary">
                      {t.total_lessons} <T k="detail.lessons" />
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-3 flex-wrap">
                  <div className="bg-bg-secondary rounded-xl px-4 py-2 border border-border">
                    <span className="text-xl font-bold text-text-primary">${t.hourly_rate / 2}</span>
                    <span className="text-xs text-text-muted ml-1">/30min</span>
                  </div>
                  {t.trial_enabled && t.trial_price !== null && (
                    <div className="bg-accent-subtle rounded-xl px-4 py-2 border border-accent/30">
                      <span className="text-sm font-bold text-accent">Trial ${t.trial_price}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {t.categories.map((cat) => (
            <span
              key={cat}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-accent-subtle text-accent border border-accent/20"
            >
              {getLabel(cat, CATEGORIES)}
            </span>
          ))}
          {t.languages.map((lang) => (
            <span
              key={lang}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gold-subtle text-gold border border-gold/20"
            >
              {getLabel(lang, LANGUAGES)}
            </span>
          ))}
          {t.levels.map((lvl) => (
            <span
              key={lvl}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            >
              {getLabel(lvl, LEVELS)}
            </span>
          ))}
        </div>

        {/* Aggregated review tags (social proof) */}
        {topTags.length > 0 && (
          <div className="mb-6 bg-bg-secondary rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              What learners say
            </p>
            <div className="flex flex-wrap gap-2">
              {topTags.map(([value, count]) => {
                const label = REVIEW_TAGS.find((x) => x.value === value)?.label ?? value;
                return (
                  <span
                    key={value}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  >
                    {label}
                    <span className="ml-1.5 text-emerald-400/70 font-semibold">×{count}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabbed content */}
        <TeacherDetailTabs
          aboutContent={aboutContent}
          scheduleContent={scheduleContent}
          reviewsContent={reviewsContent}
          reviewCount={t.review_count}
        />
      </div>

      {/* Sticky CTA (scroll-triggered, mobile + desktop) */}
      <TeacherStickyCTA hourlyRate={t.hourly_rate} />
    </div>
  );
}

function isDirectVideo(url: string): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(url) || url.includes("/videos/");
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
