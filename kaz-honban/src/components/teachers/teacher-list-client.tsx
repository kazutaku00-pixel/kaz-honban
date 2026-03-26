"use client";

import { useState, useMemo, useCallback } from "react";
import { TeacherCard } from "./teacher-card";
import { TeacherFilter, type FilterState } from "./teacher-filter";
import { NextLessonBanner } from "./next-lesson-banner";
import { useI18n } from "@/lib/i18n";
import type { TeacherWithProfile, Booking, Profile } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

const ITEMS_PER_PAGE = 12;

interface TeacherListClientProps {
  initialTeachers: TeacherWithProfile[];
  nextBooking?: (Booking & { teacher: Profile }) | null;
  slotsByTeacher?: Record<string, string[]>;
}

export function TeacherListClient({ initialTeachers, nextBooking, slotsByTeacher = {} }: TeacherListClientProps) {
  const { t } = useI18n();
  const [filters, setFilters] = useState<FilterState>({
    keyword: "",
    category: "",
    priceRange: "",
    language: "",
    level: "",
    sort: "recommended",
    dayOfWeek: "",
    timeSlot: "",
  });
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = [...initialTeachers];

    // Keyword search
    if (filters.keyword.trim()) {
      const kw = filters.keyword.toLowerCase();
      list = list.filter(
        (t) =>
          t.profile.display_name.toLowerCase().includes(kw) ||
          (t.headline?.toLowerCase().includes(kw) ?? false) ||
          (t.bio?.toLowerCase().includes(kw) ?? false)
      );
    }

    // Category filter
    if (filters.category) {
      list = list.filter((t) => t.categories.includes(filters.category));
    }

    // Price range
    if (filters.priceRange) {
      const [minStr, maxStr] = filters.priceRange.split("-");
      const min = Number(minStr);
      const max = Number(maxStr);
      list = list.filter(
        (t) => t.hourly_rate >= min && (max ? t.hourly_rate <= max : true)
      );
    }

    // Language
    if (filters.language) {
      list = list.filter((t) => t.languages.includes(filters.language));
    }

    // Level
    if (filters.level) {
      list = list.filter((t) => t.levels.includes(filters.level));
    }

    // Time-based filter: day of week and time slot
    if (filters.dayOfWeek || filters.timeSlot) {
      list = list.filter((teacher) => {
        const slots = slotsByTeacher[teacher.user_id];
        if (!slots || slots.length === 0) return false;

        return slots.some((isoStr) => {
          const d = new Date(isoStr);

          // Day of week filter
          if (filters.dayOfWeek) {
            if (d.getDay() !== Number(filters.dayOfWeek)) return false;
          }

          // Time slot filter (user's local hour)
          if (filters.timeSlot) {
            const hour = d.getHours();
            switch (filters.timeSlot) {
              case "morning":
                if (hour < 6 || hour >= 12) return false;
                break;
              case "afternoon":
                if (hour < 12 || hour >= 17) return false;
                break;
              case "evening":
                if (hour < 17 || hour >= 21) return false;
                break;
              case "night":
                if (hour < 21 && hour >= 6) return false;
                break;
            }
          }

          return true;
        });
      });
    }

    // Sort
    switch (filters.sort) {
      case "rating":
        list.sort((a, b) => b.avg_rating - a.avg_rating);
        break;
      case "price_low":
        list.sort((a, b) => a.hourly_rate - b.hourly_rate);
        break;
      case "newest":
        list.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "recommended":
      default:
        // Recommended: weighted score of rating + review count + recency
        list.sort((a, b) => {
          const scoreA =
            a.avg_rating * 2 +
            Math.min(a.review_count, 50) * 0.1 +
            (isRecent(a.created_at) ? 1 : 0);
          const scoreB =
            b.avg_rating * 2 +
            Math.min(b.review_count, 50) * 0.1 +
            (isRecent(b.created_at) ? 1 : 0);
          return scoreB - scoreA;
        });
        break;
    }

    return list;
  }, [initialTeachers, filters, slotsByTeacher]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = page < totalPages;

  const handleToggleFavorite = useCallback(
    async (teacherId: string) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(teacherId)) {
          next.delete(teacherId);
          supabase
            .from("favorites")
            .delete()
            .eq("learner_id", user.id)
            .eq("teacher_id", teacherId)
            .then();
        } else {
          next.add(teacherId);
          supabase
            .from("favorites")
            .insert({ learner_id: user.id, teacher_id: teacherId } as never)
            .then();
        }
        return next;
      });
    },
    []
  );

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-display)] text-text-primary">
          {t("teachers.title")}
        </h1>
        <p className="mt-1 text-text-secondary text-sm">
          {t("teachers.subtitle")}
        </p>
      </div>

      {/* Next lesson banner */}
      {nextBooking && <NextLessonBanner booking={nextBooking} />}

      <TeacherFilter filters={filters} onChange={handleFilterChange} />

      {/* Results count */}
      <p className="mt-6 mb-4 text-sm text-text-muted">
        {filtered.length} {filtered.length === 1 ? t("teachers.found1") : t("teachers.found")}
      </p>

      {/* Teacher grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-secondary text-lg mb-2">
            {t("teachers.noResults")}
          </p>
          <p className="text-text-muted text-sm">
            {t("teachers.noResultsHint")}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {paginated.map((teacher, i) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                index={i}
                isFavorited={favorites.has(teacher.user_id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="px-6 py-3 rounded-xl text-sm font-medium border border-border text-text-secondary hover:text-text-primary hover:bg-white/5 hover:border-border-hover transition-all"
              >
                {t("teachers.loadMore")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function isRecent(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 30 * 24 * 60 * 60 * 1000;
}
