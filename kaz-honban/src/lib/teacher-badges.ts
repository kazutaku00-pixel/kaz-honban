import type { TeacherWithProfile } from "@/types/database";

// Visual badges shown next to a teacher. There are two families:
//
// 1. Tier badges (mutually exclusive) — driven by total lesson count.
//    Communicates experience as a single concrete level.
// 2. Achievement badges (additive) — earned for specific milestones
//    (rating, free trial, languages, certifications).
//
// Numbers are surfaced verbatim ("50+ lessons", "4.9 ★") so learners can
// verify the badge against the underlying stat at a glance. Phase 1 reuses
// only existing TeacherProfile columns — no schema changes required.

export type TeacherBadge = {
  id: string;
  label: string;
  icon: "rising" | "trusted" | "top" | "master" | "topRated" | "freeTrial" | "polyglot" | "certified" | "trial";
  tone: string; // Tailwind utility group
  detail?: string; // small subtitle line shown in big badges
};

const TIERS: { min: number; badge: TeacherBadge }[] = [
  {
    min: 500,
    badge: {
      id: "master",
      label: "Master Teacher",
      icon: "master",
      tone: "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-400/40",
      detail: "500+ lessons taught",
    },
  },
  {
    min: 200,
    badge: {
      id: "top",
      label: "Top Teacher",
      icon: "top",
      tone: "bg-gradient-to-r from-rose-500/15 to-orange-500/15 text-orange-300 border-orange-400/40",
      detail: "200+ lessons taught",
    },
  },
  {
    min: 50,
    badge: {
      id: "trusted",
      label: "Trusted Teacher",
      icon: "trusted",
      tone: "bg-sky-500/15 text-sky-300 border-sky-400/30",
      detail: "50+ lessons taught",
    },
  },
  {
    min: 10,
    badge: {
      id: "rising",
      label: "Rising Teacher",
      icon: "rising",
      tone: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
      detail: "10+ lessons taught",
    },
  },
];

export function tierBadge(totalLessons: number): TeacherBadge | null {
  for (const t of TIERS) {
    if (totalLessons >= t.min) return t.badge;
  }
  return null;
}

export function achievementBadges(teacher: Pick<TeacherWithProfile, "avg_rating" | "review_count" | "trial_enabled" | "languages" | "certifications">): TeacherBadge[] {
  const out: TeacherBadge[] = [];

  if (teacher.avg_rating >= 4.8 && teacher.review_count >= 20) {
    out.push({
      id: "topRated",
      label: "Top Rated",
      icon: "topRated",
      tone: "bg-gold-subtle text-gold border-gold/30",
      detail: `${teacher.avg_rating.toFixed(1)} ★ · ${teacher.review_count} reviews`,
    });
  }

  if (teacher.trial_enabled) {
    out.push({
      id: "freeTrial",
      label: "Trial Available",
      icon: "trial",
      tone: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    });
  }

  if (teacher.languages.length >= 3) {
    out.push({
      id: "polyglot",
      label: `${teacher.languages.length} Languages`,
      icon: "polyglot",
      tone: "bg-violet-500/15 text-violet-300 border-violet-400/30",
    });
  }

  if (teacher.certifications && teacher.certifications.trim().length > 0) {
    out.push({
      id: "certified",
      label: "Certified",
      icon: "certified",
      tone: "bg-cyan-500/15 text-cyan-300 border-cyan-400/30",
    });
  }

  return out;
}

export function topBadges(
  teacher: Pick<
    TeacherWithProfile,
    | "avg_rating"
    | "review_count"
    | "trial_enabled"
    | "languages"
    | "certifications"
    | "total_lessons"
  >,
  limit = 3
): TeacherBadge[] {
  const tier = tierBadge(teacher.total_lessons);
  const all = [...(tier ? [tier] : []), ...achievementBadges(teacher)];
  return all.slice(0, limit);
}
