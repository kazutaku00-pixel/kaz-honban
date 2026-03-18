"use client";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useReveal } from "./use-reveal";
import { Search, CalendarDays, Video } from "lucide-react";

const icons = { Search, Calendar: CalendarDays, Video };

export function HowItWorks() {
  const ref = useReveal();

  return (
    <section id="how-it-works" className="relative py-24 md:py-32 bg-bg-secondary/50" ref={ref}>
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-7xl px-5">
        {/* Section header */}
        <div className="reveal text-center mb-16 md:mb-20">
          <span className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
            Simple Process
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-[family-name:var(--font-display)] font-bold text-text-primary">
            Start in 3 Steps
          </h2>
          <p className="mt-2 font-[family-name:var(--font-japanese)] text-text-muted">
            かんたん3ステップ
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 stagger">
          {siteConfig.howItWorks.map((step, i) => {
            const Icon = icons[step.icon as keyof typeof icons];
            return (
              <div
                key={step.step}
                className={cn(
                  "reveal group relative p-8 rounded-2xl",
                  "bg-bg-primary border border-border",
                  "hover:border-border-hover transition-all duration-500",
                  "hover:shadow-[0_0_40px_rgba(255,107,74,0.05)]"
                )}
              >
                {/* Step number */}
                <div className="flex items-start justify-between mb-8">
                  <span className="text-5xl md:text-6xl font-[family-name:var(--font-display)] font-bold text-white/[0.04]">
                    {step.step}
                  </span>
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      "bg-accent-subtle text-accent",
                      "group-hover:bg-accent group-hover:text-white",
                      "transition-all duration-300"
                    )}
                  >
                    <Icon size={22} />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-text-primary mb-1">
                  {step.titleEn}
                </h3>
                <p className="text-sm font-[family-name:var(--font-japanese)] text-accent/70 mb-4">
                  {step.titleJa}
                </p>

                {/* Description */}
                <p className="text-sm text-text-secondary leading-relaxed">
                  {step.description}
                </p>

                {/* Connector line (desktop only) */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-border" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
