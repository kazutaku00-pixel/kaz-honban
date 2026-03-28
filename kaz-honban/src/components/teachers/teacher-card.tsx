"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Star, Heart, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { TeacherWithProfile } from "@/types/database";

const avatarColors = [
  "from-accent to-orange-400",
  "from-gold to-amber-400",
  "from-emerald-500 to-teal-400",
  "from-sky-500 to-blue-400",
  "from-violet-500 to-purple-400",
];

function isNew(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff < 14 * 24 * 60 * 60 * 1000;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(url) || url.includes("/videos/");
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/
  );
  return match?.[1] ?? null;
}

interface TeacherCardProps {
  teacher: TeacherWithProfile;
  index?: number;
  isFavorited?: boolean;
  onToggleFavorite?: (teacherId: string) => void;
}

export function TeacherCard({
  teacher,
  index = 0,
  isFavorited = false,
  onToggleFavorite,
}: TeacherCardProps) {
  const { t } = useI18n();
  const profile = teacher.profile;
  const initial = (profile.display_name ?? "?")[0].toUpperCase();
  const colorIdx = index % avatarColors.length;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const videoUrl = teacher.intro_video_url;
  const hasDirectVideo = videoUrl ? isDirectVideo(videoUrl) : false;
  const youtubeId = videoUrl && !hasDirectVideo ? extractYouTubeId(videoUrl) : null;
  const hasVideo = hasDirectVideo || !!youtubeId;

  function handleMouseEnter() {
    setIsHovering(true);
    if (hasDirectVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }

  function handleMouseLeave() {
    setIsHovering(false);
    if (hasDirectVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  return (
    <Link
      href={`/teachers/${teacher.user_id}`}
      className={cn(
        "group relative flex flex-col",
        "bg-bg-secondary rounded-2xl border border-border overflow-hidden",
        "hover:border-border-hover hover:bg-bg-tertiary",
        "transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video / Avatar Hero area */}
      <div className="relative aspect-[16/10] bg-bg-tertiary overflow-hidden">
        {hasDirectVideo && videoUrl ? (
          <>
            {/* Direct video — poster frame + hover play */}
            <video
              ref={videoRef}
              src={videoUrl}
              muted
              playsInline
              loop
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {!isHovering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                  <Play size={18} className="text-bg-primary ml-0.5" />
                </div>
              </div>
            )}
          </>
        ) : youtubeId ? (
          <>
            {/* YouTube thumbnail */}
            <img
              src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
              alt={profile.display_name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                <Play size={18} className="text-bg-primary ml-0.5" />
              </div>
            </div>
          </>
        ) : (
          /* Fallback — gradient with initial */
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br flex items-center justify-center",
              avatarColors[colorIdx]
            )}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-5xl font-bold text-white/80">{initial}</span>
            )}
          </div>
        )}

        {/* NEW badge */}
        {isNew(teacher.created_at) && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-accent text-white rounded-full shadow-lg">
              {t("teachers.new")}
            </span>
          </div>
        )}

        {/* Favorite button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite?.(teacher.user_id);
          }}
          className="absolute top-2.5 right-2.5 z-10 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            size={16}
            className={cn(
              "transition-colors",
              isFavorited
                ? "text-accent fill-accent"
                : "text-white/80 hover:text-white"
            )}
          />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Name + rating row */}
        <div className="flex items-center gap-3 mb-2">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="w-9 h-9 rounded-full object-cover border-2 border-bg-secondary -mt-7 relative z-10 shadow-lg"
            />
          ) : (
            <div
              className={cn(
                "w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm -mt-7 relative z-10 shadow-lg border-2 border-bg-secondary",
                avatarColors[colorIdx]
              )}
            >
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-text-primary truncate text-sm">
              {profile.display_name}
            </h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Star size={13} className="text-gold fill-gold" />
            <span className="text-xs font-medium text-text-primary">
              {teacher.avg_rating.toFixed(1)}
            </span>
            <span className="text-xs text-text-muted">
              · {teacher.total_lessons} {t("teachers.lessonsShort")}
            </span>
          </div>
        </div>

        {/* Headline */}
        <p className="text-xs text-text-secondary leading-relaxed mb-3 line-clamp-2">
          {teacher.headline}
        </p>

        {/* Category + language tags (compact) */}
        <div className="flex flex-wrap gap-1 mb-3 overflow-hidden max-h-[24px]">
          {teacher.categories.slice(0, 2).map((cat) => (
            <span
              key={cat}
              className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-accent-subtle text-accent"
            >
              {t(`cat.${cat}`)}
            </span>
          ))}
          {teacher.languages.slice(0, 2).map((lang) => (
            <span
              key={lang}
              className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-gold-subtle text-gold"
            >
              {lang.toUpperCase()}
            </span>
          ))}
          {teacher.categories.length + teacher.languages.length > 4 && (
            <span className="px-1.5 py-0.5 text-[10px] text-text-muted">
              +{teacher.categories.length + teacher.languages.length - 4}
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <span className="text-base font-bold text-text-primary">
              ${teacher.hourly_rate}
            </span>
            <span className="text-[10px] text-text-muted"> /25min</span>
          </div>
          <span className="text-xs text-accent font-medium group-hover:underline">
            {t("teachers.viewProfile")}
          </span>
        </div>
      </div>
    </Link>
  );
}
