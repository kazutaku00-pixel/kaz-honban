"use client";

import { useState, useMemo, useCallback } from "react";
import { TeacherCard } from "./teacher-card";
import { TeacherFilter, type FilterState } from "./teacher-filter";
import type { TeacherWithProfile } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

const ITEMS_PER_PAGE = 12;

interface TeacherListClientProps {
  initialTeachers: TeacherWithProfile[];
}

export function TeacherListClient({ initialTeachers }: TeacherListClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    keyword: "",
    category: "",
    priceRange: "",
    language: "",
    level: "",
    sort: "recommended",
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
  }, [initialTeachers, filters]);

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
      <TeacherFilter filters={filters} onChange={handleFilterChange} />

      {/* Results count */}
      <p className="mt-6 mb-4 text-sm text-text-muted">
        {filtered.length} teacher{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* Teacher grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-secondary text-lg mb-2">
            No teachers found matching your filters
          </p>
          <p className="text-text-muted text-sm">
            Try adjusting your search or filters
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
                Load More Teachers
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
