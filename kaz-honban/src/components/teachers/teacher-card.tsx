"use client";

import Link from "next/link";
import { Star, Heart } from "lucide-react";
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

  return (
    <Link
      href={`/teachers/${teacher.user_id}`}
      className={cn(
        "group relative flex flex-col",
        "bg-bg-secondary rounded-2xl border border-border",
        "hover:border-border-hover hover:bg-bg-tertiary",
        "transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
      )}
    >
      {/* NEW badge */}
      {isNew(teacher.created_at) && (
        <div className="absolute -top-2 -right-2 z-10">
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
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          size={16}
          className={cn(
            "transition-colors",
            isFavorited
              ? "text-accent fill-accent"
              : "text-text-muted hover:text-text-secondary"
          )}
        />
      </button>

      <div className="p-5 flex flex-col flex-1">
        {/* Avatar + name + rating */}
        <div className="flex items-center gap-3 mb-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="w-12 h-12 rounded-xl object-cover"
            />
          ) : (
            <div
              className={cn(
                "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg",
                avatarColors[colorIdx]
              )}
            >
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-text-primary truncate">
              {profile.display_name}
            </h3>
            <div className="flex items-center gap-1">
              <Star size={12} className="text-gold fill-gold" />
              <span className="text-xs text-text-secondary">
                {teacher.avg_rating.toFixed(1)} ({teacher.review_count})
              </span>
            </div>
          </div>
        </div>

        {/* Headline */}
        <p className="text-sm text-text-secondary leading-relaxed mb-4 line-clamp-2">
          {teacher.headline}
        </p>

        {/* Category tags (max 3) */}
        <div className="flex flex-wrap gap-1.5 mb-4 overflow-hidden max-h-[28px]">
          {teacher.categories.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className="px-2.5 py-1 text-[10px] font-medium rounded-md bg-white/5 text-text-muted whitespace-nowrap"
            >
              {t(`cat.${cat}`)}
            </span>
          ))}
          {teacher.categories.length > 3 && (
            <span className="px-2 py-1 text-[10px] text-text-muted">
              +{teacher.categories.length - 3}
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <span className="text-lg font-bold text-text-primary">
              ${teacher.hourly_rate}
            </span>
            <span className="text-xs text-text-muted"> /25min</span>
          </div>
          <span className="text-xs text-accent font-medium group-hover:underline flex items-center gap-1">
            {t("teachers.viewProfile")}
          </span>
        </div>
      </div>
    </Link>
  );
}
