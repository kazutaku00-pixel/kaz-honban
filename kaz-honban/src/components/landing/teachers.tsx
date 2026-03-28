"use client";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useReveal } from "./use-reveal";
import { Star, ArrowRight } from "lucide-react";

const avatarColors = [
  "from-accent to-orange-400",
  "from-gold to-amber-400",
  "from-emerald-500 to-teal-400",
  "from-sky-500 to-blue-400",
  "from-violet-500 to-purple-400",
];

export function Teachers() {
  const ref = useReveal();

  return (
    <section id="teachers" className="relative py-24 md:py-32" ref={ref}>
      <div className="mx-auto max-w-7xl px-5">
        {/* Section header */}
        <div className="reveal text-center mb-16">
          <span className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
            Meet Our Teachers
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-[family-name:var(--font-display)] font-bold text-text-primary">
            Learn from the Best
          </h2>
          <p className="mt-4 text-text-secondary max-w-lg mx-auto">
            Native Japanese speakers with years of teaching experience. Find
            your perfect match.
          </p>
        </div>

        {/* Teacher cards — horizontal scroll on mobile */}
        <div className="reveal flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory -mx-5 px-5 md:mx-0 md:px-0 md:grid md:grid-cols-5 md:overflow-visible scrollbar-hide">
          {siteConfig.featuredTeachers.map((teacher, i) => (
            <div
              key={teacher.name}
              className={cn(
                "group relative flex-shrink-0 w-[260px] md:w-auto snap-center",
                "bg-bg-secondary rounded-2xl border border-border",
                "hover:border-border-hover hover:bg-bg-tertiary",
                "transition-all duration-300",
                "hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
              )}
            >
              {/* New badge */}
              {teacher.isNew && (
                <div className="absolute -top-2 -right-2 z-10">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-accent text-white rounded-full shadow-lg">
                    New
                  </span>
                </div>
              )}

              <div className="p-5">
                {/* Avatar */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg",
                      avatarColors[i % avatarColors.length]
                    )}
                  >
                    {teacher.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">
                      {teacher.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <Star
                        size={12}
                        className="text-gold fill-gold"
                      />
                      <span className="text-xs text-text-secondary">
                        {teacher.rating} ({teacher.reviews})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Headline */}
                <p className="text-sm text-text-secondary leading-relaxed mb-4 line-clamp-2">
                  {teacher.headline}
                </p>

                {/* Categories */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {teacher.categories.map((cat) => (
                    <span
                      key={cat}
                      className="px-2.5 py-1 text-[10px] font-medium rounded-md bg-white/5 text-text-muted"
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                {/* Price + CTA */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <span className="text-lg font-bold text-text-primary">
                      ${teacher.price}
                    </span>
                    <span className="text-xs text-text-muted"> /15min</span>
                  </div>
                  <span className="text-xs text-accent font-medium group-hover:underline cursor-pointer flex items-center gap-1">
                    View Profile
                    <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View all link */}
        <div className="reveal mt-10 text-center">
          <a
            href="/signup"
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium",
              "border border-border text-text-secondary hover:text-text-primary",
              "hover:bg-white/5 hover:border-border-hover transition-all"
            )}
          >
            View All 40+ Teachers
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
