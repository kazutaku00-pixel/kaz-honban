"use client";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { ArrowRight, Instagram } from "lucide-react";

export function Hero() {
  const { hero } = siteConfig;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-mesh">
      {/* Floating Japanese characters — decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
        {[
          { char: "あ", size: 64, top: 61, left: 5, delay: 0, dur: 7.2 },
          { char: "い", size: 52, top: 25, left: 14.5, delay: 0.6, dur: 6.4 },
          { char: "う", size: 78, top: 68, left: 24, delay: 1.2, dur: 8.1 },
          { char: "え", size: 45, top: 15, left: 33.5, delay: 1.8, dur: 5.8 },
          { char: "お", size: 90, top: 52, left: 43, delay: 2.4, dur: 7.6 },
          { char: "か", size: 56, top: 38, left: 52.5, delay: 3.0, dur: 6.9 },
          { char: "き", size: 68, top: 72, left: 62, delay: 3.6, dur: 8.4 },
          { char: "日", size: 82, top: 20, left: 71.5, delay: 4.2, dur: 7.0 },
          { char: "本", size: 48, top: 58, left: 81, delay: 4.8, dur: 6.2 },
          { char: "語", size: 72, top: 35, left: 90.5, delay: 5.4, dur: 7.8 },
        ].map((item, i) => (
          <span
            key={i}
            className="absolute text-white/[0.03] font-[family-name:var(--font-japanese)] animate-float"
            style={{
              fontSize: `${item.size}px`,
              left: `${item.left}%`,
              top: `${item.top}%`,
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.dur}s`,
            }}
          >
            {item.char}
          </span>
        ))}
      </div>

      {/* Accent glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div
            className="animate-fade-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <span
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium",
                "bg-gradient-to-r from-accent-subtle to-gold-subtle",
                "border border-border text-text-secondary"
              )}
            >
              <Instagram size={14} className="text-accent" />
              {hero.badge}
            </span>
          </div>

          {/* Japanese title */}
          <h2
            className="mt-6 text-lg md:text-xl font-[family-name:var(--font-japanese)] text-gold tracking-[0.2em] animate-fade-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            {hero.titleJa}
          </h2>

          {/* Main title */}
          <h1
            className="mt-3 text-[clamp(2.5rem,7vw,5.5rem)] font-[family-name:var(--font-display)] font-bold leading-[0.95] tracking-tight text-text-primary whitespace-pre-line animate-fade-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            {hero.titleEn}
          </h1>

          {/* Subtitle */}
          <p
            className="mt-6 max-w-xl text-base md:text-lg text-text-secondary leading-relaxed animate-fade-slide-up"
            style={{ animationDelay: "0.4s" }}
          >
            {hero.subtitle}
          </p>

          {/* CTAs */}
          <div
            className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-fade-slide-up"
            style={{ animationDelay: "0.5s" }}
          >
            <a
              href="/signup"
              className={cn(
                "group flex items-center justify-center gap-2 w-full sm:w-auto",
                "px-8 py-4 rounded-2xl text-base font-semibold",
                "bg-accent text-white hover:bg-accent-hover transition-all duration-300",
                "shadow-[0_0_30px_rgba(255,107,74,0.3)]",
                "hover:shadow-[0_0_50px_rgba(255,107,74,0.5)]",
                "hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              Start Learning
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </a>
            <a
              href="#how-it-works"
              className={cn(
                "flex items-center justify-center w-full sm:w-auto",
                "px-8 py-4 rounded-2xl text-base font-medium",
                "border border-border text-text-secondary hover:text-text-primary",
                "hover:bg-white/5 hover:border-border-hover transition-all duration-300"
              )}
            >
              How It Works
            </a>
          </div>

          {/* Stats */}
          <div
            className="mt-16 flex items-center gap-8 md:gap-12 animate-fade-slide-up"
            style={{ animationDelay: "0.6s" }}
          >
            {hero.stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-2xl md:text-3xl font-[family-name:var(--font-display)] font-bold text-text-primary">
                  {stat.value}
                </span>
                <span className="mt-1 text-xs text-text-muted uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-slide-up opacity-50"
             style={{ animationDelay: "1s" }}>
          <span className="text-[10px] text-text-muted uppercase tracking-[0.3em]">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-text-muted to-transparent" />
        </div>
      </div>
    </section>
  );
}
