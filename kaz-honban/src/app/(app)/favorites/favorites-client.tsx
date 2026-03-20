"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Heart } from "lucide-react";
import { TeacherCard } from "@/components/teachers/teacher-card";
import type { TeacherWithProfile } from "@/types/database";

interface FavoritesClientProps {
  teachers: TeacherWithProfile[];
}

export function FavoritesClient({ teachers }: FavoritesClientProps) {
  const router = useRouter();

  async function handleToggleFavorite(teacherId: string) {
    await fetch("/api/favorites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacher_id: teacherId }),
    });
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
        <h1 className="text-xl font-bold text-text-primary font-[family-name:var(--font-display)]">
          Favorite Teachers
        </h1>
      </div>

      {teachers.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <Heart className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-muted">No favorites yet</p>
          <p className="text-sm text-text-muted">
            Tap the heart on a teacher&apos;s card to save them here
          </p>
          <button
            onClick={() => router.push("/teachers")}
            className="mt-2 px-6 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent/90 transition"
          >
            Browse Teachers
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {teachers.map((teacher, idx) => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              index={idx}
              isFavorited={true}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
