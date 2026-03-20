"use client";

import { cn } from "@/lib/utils";
import { CATEGORIES, LANGUAGES, LEVELS } from "@/lib/validations";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export type SortOption = "recommended" | "rating" | "price_low" | "newest";

export interface FilterState {
  keyword: string;
  category: string;
  priceRange: string;
  language: string;
  level: string;
  sort: SortOption;
}

const PRICE_RANGES = [
  { value: "", label: "All Prices" },
  { value: "0-15", label: "Under $15" },
  { value: "15-25", label: "$15 - $25" },
  { value: "25-40", label: "$25 - $40" },
  { value: "40-100", label: "$40+" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Highest Rating" },
  { value: "price_low", label: "Lowest Price" },
  { value: "newest", label: "Newest" },
];

interface TeacherFilterProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-colors whitespace-nowrap",
          value
            ? "border-accent/40 bg-accent-subtle text-accent"
            : "border-border bg-bg-secondary text-text-secondary hover:border-border-hover hover:text-text-primary"
        )}
      >
        {selectedLabel}
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 min-w-[180px] bg-bg-secondary border border-border rounded-xl shadow-xl overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-sm transition-colors",
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

export function TeacherFilter({ filters, onChange }: TeacherFilterProps) {
  const update = (partial: Partial<FilterState>) =>
    onChange({ ...filters, ...partial });

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
  ];

  const languageOptions = [
    { value: "", label: "All Languages" },
    ...LANGUAGES.map((l) => ({ value: l.value, label: l.label })),
  ];

  const levelOptions = [
    { value: "", label: "All Levels" },
    ...LEVELS.map((l) => ({ value: l.value, label: l.label })),
  ];

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search teachers by name or keyword..."
          value={filters.keyword}
          onChange={(e) => update({ keyword: e.target.value })}
          className={cn(
            "w-full px-4 py-3 pl-11 rounded-xl text-sm",
            "bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted",
            "focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20",
            "transition-colors"
          )}
        />
        <SlidersHorizontal
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
        />
      </div>

      {/* Category chips (horizontal scroll on mobile) */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {categoryOptions.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => update({ category: cat.value })}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              filters.category === cat.value
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border hover:border-border-hover"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Dropdowns row */}
      <div className="flex gap-2 flex-wrap">
        <Dropdown
          label="Price"
          value={filters.priceRange}
          options={PRICE_RANGES}
          onChange={(v) => update({ priceRange: v })}
        />
        <Dropdown
          label="Language"
          value={filters.language}
          options={languageOptions}
          onChange={(v) => update({ language: v })}
        />
        <Dropdown
          label="Level"
          value={filters.level}
          options={levelOptions}
          onChange={(v) => update({ level: v })}
        />
        <Dropdown
          label="Sort"
          value={filters.sort}
          options={SORT_OPTIONS}
          onChange={(v) => update({ sort: v as SortOption })}
        />
      </div>
    </div>
  );
}
