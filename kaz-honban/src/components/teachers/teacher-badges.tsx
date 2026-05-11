"use client";

import { cn } from "@/lib/utils";
import {
  Sprout,
  Star,
  Trophy,
  Crown,
  Sparkles,
  Languages,
  GraduationCap,
  Gift,
} from "lucide-react";
import type { TeacherBadge } from "@/lib/teacher-badges";

const ICON_MAP = {
  rising: Sprout,
  trusted: Star,
  top: Trophy,
  master: Crown,
  topRated: Sparkles,
  freeTrial: Gift,
  trial: Gift,
  polyglot: Languages,
  certified: GraduationCap,
} as const;

interface BadgeProps {
  badge: TeacherBadge;
  size?: "sm" | "md";
  showDetail?: boolean;
}

export function TeacherBadgeChip({ badge, size = "sm", showDetail = false }: BadgeProps) {
  const Icon = ICON_MAP[badge.icon];
  const sizing =
    size === "md"
      ? "px-3 py-1.5 text-xs"
      : "px-2 py-0.5 text-[10px]";
  const iconSize = size === "md" ? 14 : 11;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap",
        sizing,
        badge.tone
      )}
    >
      <Icon size={iconSize} className="shrink-0" />
      {badge.label}
      {showDetail && badge.detail && (
        <span className="ml-1 opacity-70 font-normal">· {badge.detail}</span>
      )}
    </span>
  );
}

interface BadgeRowProps {
  badges: TeacherBadge[];
  size?: "sm" | "md";
  showDetail?: boolean;
  className?: string;
}

export function TeacherBadgeRow({ badges, size = "sm", showDetail = false, className }: BadgeRowProps) {
  if (badges.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {badges.map((b) => (
        <TeacherBadgeChip key={b.id} badge={b} size={size} showDetail={showDetail} />
      ))}
    </div>
  );
}
