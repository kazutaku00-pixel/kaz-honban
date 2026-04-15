"use client";

import { ShieldCheck, Undo2, BadgeCheck, Lock } from "lucide-react";
import { useReveal } from "./use-reveal";

const ITEMS = [
  {
    icon: Undo2,
    title: "Not a fit? Full refund.",
    body: "If your first lesson doesn't feel right, email us within 48 hours for a full refund. No forms, no arguments.",
  },
  {
    icon: BadgeCheck,
    title: "Verified teachers only",
    body: "Every teacher passes identity verification and a profile review. You'll never see a random stranger.",
  },
  {
    icon: ShieldCheck,
    title: "Safe 1-on-1 room",
    body: "Private video rooms with knock-to-enter disabled, 2-person cap, and expiring links. No recordings.",
  },
  {
    icon: Lock,
    title: "No hidden fees",
    body: "The price on the teacher card is the price you pay. Cancel up to 2 hours before, free.",
  },
];

export function Trust() {
  const ref = useReveal();

  return (
    <section className="relative py-20 md:py-28" ref={ref}>
      <div className="mx-auto max-w-5xl px-5">
        <div className="reveal text-center mb-12">
          <span className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
            Peace of mind
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-[family-name:var(--font-display)] font-bold text-text-primary">
            Try a lesson risk-free
          </h2>
          <p className="mt-3 text-sm md:text-base text-text-secondary max-w-lg mx-auto">
            We make it easy to give Japanese lessons a try. Here&apos;s the fine print,
            in plain English.
          </p>
        </div>

        <div className="reveal grid grid-cols-1 md:grid-cols-2 gap-4">
          {ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex gap-4 p-6 rounded-2xl bg-bg-secondary border border-border"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent-subtle flex items-center justify-center">
                <item.icon size={18} className="text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-text-secondary leading-relaxed">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
