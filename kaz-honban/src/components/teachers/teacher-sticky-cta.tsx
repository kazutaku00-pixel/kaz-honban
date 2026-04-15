"use client";

import { useEffect, useState } from "react";
import { T } from "@/components/i18n-text";

interface TeacherStickyCTAProps {
  hourlyRate: number;
}

export function TeacherStickyCTA({ hourlyRate }: TeacherStickyCTAProps) {
  const lessonPrice = hourlyRate / 2;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 200);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Mobile: fixed bottom bar — sits above the bottom tab nav (h-16) */}
      <div
        className={`fixed bottom-16 left-0 right-0 p-4 bg-bg-primary/95 backdrop-blur-md border-t border-border md:hidden z-30 transition-transform duration-300 ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-lg font-bold text-text-primary">${lessonPrice}</span>
            <span className="text-xs text-text-muted"> /30min</span>
          </div>
          <a
            href="#available-slots"
            className="flex-1 max-w-[200px] py-3 rounded-xl text-sm font-semibold text-center bg-accent hover:bg-accent-hover text-white transition-colors"
          >
            <T k="detail.bookLesson" />
          </a>
        </div>
      </div>

      {/* Desktop: fixed right sidebar CTA */}
      <div
        className={`hidden md:block fixed top-1/2 right-6 -translate-y-1/2 z-30 transition-all duration-300 ${
          visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"
        }`}
      >
        <div className="bg-bg-secondary border border-border rounded-2xl p-4 shadow-xl w-48">
          <div className="mb-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-text-primary">${lessonPrice}</span>
              <span className="text-xs text-text-muted">/30min</span>
            </div>
          </div>
          <a
            href="#available-slots"
            className="block w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-accent hover:bg-accent-hover text-white transition-colors"
          >
            <T k="detail.bookLesson" />
          </a>
        </div>
      </div>
    </>
  );
}
