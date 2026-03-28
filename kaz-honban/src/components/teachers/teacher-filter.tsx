"use client";

import { cn } from "@/lib/utils";
import { CATEGORIES, LANGUAGES, LEVELS } from "@/lib/validations";
import { Search, ChevronDown, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";

export type SortOption = "recommended" | "rating" | "price_low" | "newest";

export interface FilterState {
  keyword: string;
  category: string;
  priceRange: string;
  language: string;
  level: string;
  sort: SortOption;
  dayOfWeek: string;
  timeSlot: string;
}

function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? label;
  const isActive = !!value;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
          isActive
            ? "border-accent/40 bg-accent-subtle text-accent"
            : "border-border bg-bg-secondary text-text-secondary hover:border-border-hover hover:text-text-primary"
        )}
      >
        {isActive ? selectedLabel : label}
        {isActive ? (
          <X
            size={12}
            className="ml-0.5 hover:text-accent"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setOpen(false);
            }}
          />
        ) : (
          <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
        )}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 min-w-[180px] max-h-[280px] overflow-y-auto bg-bg-secondary border border-border rounded-xl shadow-xl">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2 text-xs transition-colors",
                opt.value === value
                  ? "bg-accent-subtle text-accent"
                  : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface TeacherFilterProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function TeacherFilter({ filters, onChange }: TeacherFilterProps) {
  const { t } = useI18n();
  const update = (partial: Partial<FilterState>) =>
    onChange({ ...filters, ...partial });

  const categoryOptions = [
    { value: "", label: t("teachers.allCategories") },
    ...CATEGORIES.map((c) => ({ value: c.value, label: t(`cat.${c.value}`) })),
  ];

  const priceRanges = [
    { value: "", label: t("teachers.allPrices") },
    { value: "0-15", label: t("teachers.under") },
    { value: "15-25", label: "$15 - $25" },
    { value: "25-40", label: "$25 - $40" },
    { value: "40-100", label: "$40+" },
  ];

  const languageOptions = [
    { value: "", label: t("teachers.allLanguages") },
    ...LANGUAGES.map((l) => ({ value: l.value, label: l.label })),
  ];

  const levelOptions = [
    { value: "", label: t("teachers.allLevels") },
    ...LEVELS.map((l) => ({ value: l.value, label: l.label })),
  ];

  const dayOptions = [
    { value: "", label: t("teachers.anyDay") },
    { value: "0", label: t("day.sun") },
    { value: "1", label: t("day.mon") },
    { value: "2", label: t("day.tue") },
    { value: "3", label: t("day.wed") },
    { value: "4", label: t("day.thu") },
    { value: "5", label: t("day.fri") },
    { value: "6", label: t("day.sat") },
  ];

  const timeSlotOptions = [
    { value: "", label: t("teachers.anyTime") },
    { value: "morning", label: t("teachers.morning") },
    { value: "afternoon", label: t("teachers.afternoon") },
    { value: "evening", label: t("teachers.evening") },
    { value: "night", label: t("teachers.night") },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "recommended", label: t("teachers.recommended") },
    { value: "rating", label: t("teachers.highestRating") },
    { value: "price_low", label: t("teachers.lowestPrice") },
    { value: "newest", label: t("teachers.newest") },
  ];

  const hasActiveFilters =
    filters.category ||
    filters.priceRange ||
    filters.language ||
    filters.level ||
    filters.dayOfWeek ||
    filters.timeSlot;

  return (
    <div>
      {/* Search + all filters in one row */}
      <div className="flex gap-1.5 flex-wrap items-center">
        {/* Compact inline search */}
        <div className="relative">
          <input
            type="text"
            placeholder={t("teachers.searchPlaceholder")}
            value={filters.keyword}
            onChange={(e) => update({ keyword: e.target.value })}
            className={cn(
              "w-[180px] sm:w-[200px] px-3 py-1.5 pl-8 rounded-full text-xs",
              "bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted",
              "focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20",
              "transition-colors"
            )}
          />
          <Search
            size={12}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
        </div>
        <Dropdown
          label={t("teachers.category")}
          value={filters.category}
          options={categoryOptions}
          onChange={(v) => update({ category: v })}
        />
        <Dropdown
          label={t("teachers.day")}
          value={filters.dayOfWeek}
          options={dayOptions}
          onChange={(v) => update({ dayOfWeek: v })}
        />
        <Dropdown
          label={t("teachers.time")}
          value={filters.timeSlot}
          options={timeSlotOptions}
          onChange={(v) => update({ timeSlot: v })}
        />
        <Dropdown
          label={t("teachers.price")}
          value={filters.priceRange}
          options={priceRanges}
          onChange={(v) => update({ priceRange: v })}
        />
        <Dropdown
          label={t("teachers.language")}
          value={filters.language}
          options={languageOptions}
          onChange={(v) => update({ language: v })}
        />
        <Dropdown
          label={t("teachers.level")}
          value={filters.level}
          options={levelOptions}
          onChange={(v) => update({ level: v })}
        />

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

        <Dropdown
          label={t("teachers.sort")}
          value={filters.sort}
          options={sortOptions}
          onChange={(v) => update({ sort: v as SortOption })}
        />

        {/* Clear all filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() =>
              onChange({
                ...filters,
                category: "",
                priceRange: "",
                language: "",
                level: "",
                dayOfWeek: "",
                timeSlot: "",
              })
            }
            className="px-2.5 py-1.5 rounded-full text-[10px] font-medium text-text-muted hover:text-accent transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}

