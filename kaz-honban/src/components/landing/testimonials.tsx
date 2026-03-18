"use client";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useReveal } from "./use-reveal";
import { Star, Quote } from "lucide-react";

export function Testimonials() {
  const ref = useReveal();

  return (
    <section className="relative py-24 md:py-32" ref={ref}>
      <div className="mx-auto max-w-7xl px-5">
        {/* Section header */}
        <div className="reveal text-center mb-16">
          <span className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
            Student Stories
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-[family-name:var(--font-display)] font-bold text-text-primary">
            Loved by Learners
          </h2>
          <p className="mt-2 font-[family-name:var(--font-japanese)] text-text-muted">
            生徒の声
          </p>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
          {siteConfig.testimonials.map((t, i) => (
            <div
              key={i}
              className={cn(
                "reveal group relative p-7 rounded-2xl",
                "bg-bg-secondary border border-border",
                "hover:border-border-hover transition-all duration-300",
                "hover:-translate-y-1"
              )}
            >
              {/* Quote icon */}
              <Quote
                size={32}
                className="text-accent/10 mb-4 rotate-180"
              />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star
                    key={j}
                    size={14}
                    className="text-gold fill-gold"
                  />
                ))}
              </div>

              {/* Comment */}
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                &ldquo;{t.comment}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg">
                  {t.flag}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {t.name}
                  </p>
                  <p className="text-xs text-text-muted">{t.country}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
