"use client";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useReveal } from "./use-reveal";
import { Check, ArrowRight } from "lucide-react";

export function Pricing() {
  const ref = useReveal();
  const { pricing } = siteConfig;

  return (
    <section id="pricing" className="relative py-24 md:py-32 bg-bg-secondary/50" ref={ref}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-5xl px-5">
        {/* Section header */}
        <div className="reveal text-center mb-16">
          <span className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
            Pricing
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-[family-name:var(--font-display)] font-bold text-text-primary">
            {pricing.title}
          </h2>
          <p className="mt-4 text-text-secondary max-w-md mx-auto">
            {pricing.subtitle}
          </p>
        </div>

        {/* Pricing tiers */}
        <div className="reveal grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {pricing.tiers.map((tier, i) => (
            <div
              key={tier.duration}
              className={cn(
                "relative p-8 rounded-2xl border transition-all duration-300",
                i === 1
                  ? "bg-gradient-to-b from-accent/5 to-bg-primary border-accent/20 shadow-[0_0_40px_rgba(255,107,74,0.1)]"
                  : "bg-bg-primary border-border hover:border-border-hover"
              )}
            >
              {i === 1 && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-accent text-white rounded-full">
                  Popular
                </span>
              )}

              <h3 className="text-sm text-text-muted uppercase tracking-wider mb-2">
                {tier.duration}
              </h3>
              <p className="text-3xl md:text-4xl font-[family-name:var(--font-display)] font-bold text-text-primary mb-2">
                {tier.price}
              </p>
              <p className="text-sm text-text-secondary mb-6">
                {tier.description}
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  "Native Japanese teacher",
                  "Personalized lesson plan",
                  "Homework & progress reports",
                  "Flexible scheduling",
                ].map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2.5 text-sm text-text-secondary"
                  >
                    <Check size={15} className="text-accent flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href="/teachers"
                className={cn(
                  "flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-semibold transition-all",
                  i === 1
                    ? "bg-accent text-white hover:bg-accent-hover shadow-[0_0_20px_rgba(255,107,74,0.2)]"
                    : "bg-white/5 text-text-primary hover:bg-white/10 border border-border"
                )}
              >
                Browse Teachers
                <ArrowRight size={16} />
              </a>
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="reveal mt-8 text-center text-xs text-text-muted">
          {pricing.note}
        </p>
      </div>
    </section>
  );
}
