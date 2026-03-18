"use client";

import { cn } from "@/lib/utils";
import { useReveal } from "./use-reveal";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  const ref = useReveal();

  return (
    <section className="relative py-24 md:py-32 overflow-hidden" ref={ref}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="reveal relative z-10 mx-auto max-w-3xl px-5 text-center">
        <p className="text-sm font-[family-name:var(--font-japanese)] text-gold/70 mb-4">
          あなたの日本語、次のレベルへ
        </p>
        <h2 className="text-3xl md:text-5xl font-[family-name:var(--font-display)] font-bold text-text-primary leading-tight">
          Ready to Start Your
          <br />
          Japanese Journey?
        </h2>
        <p className="mt-6 text-text-secondary max-w-md mx-auto">
          Join thousands of learners who found their perfect Japanese teacher.
          Your first lesson is just a click away.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/signup"
            className={cn(
              "group flex items-center justify-center gap-2 w-full sm:w-auto",
              "px-10 py-4 rounded-2xl text-base font-semibold",
              "bg-accent text-white hover:bg-accent-hover transition-all duration-300",
              "shadow-[0_0_40px_rgba(255,107,74,0.4)]",
              "hover:shadow-[0_0_60px_rgba(255,107,74,0.6)]",
              "hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            Find Your Teacher Now
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </a>
          <p className="text-xs text-text-muted">Free to sign up. No credit card required.</p>
        </div>
      </div>
    </section>
  );
}
