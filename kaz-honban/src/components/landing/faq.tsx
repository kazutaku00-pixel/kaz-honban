"use client";

import { useState } from "react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useReveal } from "./use-reveal";
import { ChevronDown } from "lucide-react";

export function FAQ() {
  const ref = useReveal();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-24 md:py-32" ref={ref}>
      <div className="mx-auto max-w-3xl px-5">
        {/* Section header */}
        <div className="reveal text-center mb-16">
          <span className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
            FAQ
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-[family-name:var(--font-display)] font-bold text-text-primary">
            Common Questions
          </h2>
          <p className="mt-2 font-[family-name:var(--font-japanese)] text-text-muted">
            よくある質問
          </p>
        </div>

        {/* FAQ items */}
        <div className="reveal space-y-3">
          {siteConfig.faq.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={cn(
                  "rounded-xl border transition-all duration-300",
                  isOpen
                    ? "border-border-hover bg-bg-secondary"
                    : "border-border bg-bg-secondary/50 hover:border-border-hover"
                )}
              >
                <button
                  className="flex items-center justify-between w-full px-6 py-5 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <span className="text-sm font-medium text-text-primary pr-4">
                    {item.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className={cn(
                      "flex-shrink-0 text-text-muted transition-transform duration-300",
                      isOpen && "rotate-180 text-accent"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <p className="px-6 pb-5 text-sm text-text-secondary leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
