"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40">
      <div className="mx-auto max-w-7xl px-5 py-4">
        <nav
          className={cn(
            "flex items-center justify-between rounded-2xl px-6 py-3",
            "bg-bg-secondary/80 backdrop-blur-xl border border-border"
          )}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold font-[family-name:var(--font-display)] tracking-tight text-text-primary">
              Nihon<span className="text-accent">Go</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              How It Works
            </a>
            <a
              href="#teachers"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Teachers
            </a>
            <a
              href="#pricing"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              FAQ
            </a>
          </div>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden sm:inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Log in
            </a>
            <a
              href="/signup"
              className={cn(
                "hidden sm:inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold",
                "bg-accent text-white hover:bg-accent-hover transition-all",
                "shadow-[0_0_20px_rgba(255,107,74,0.3)]",
                "hover:shadow-[0_0_30px_rgba(255,107,74,0.5)]"
              )}
            >
              Start Learning
            </a>
            <button
              className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <div
          className={cn(
            "md:hidden absolute left-5 right-5 top-full mt-2 rounded-2xl overflow-hidden",
            "bg-bg-secondary/95 backdrop-blur-xl border border-border",
            "transition-all duration-300 origin-top",
            menuOpen
              ? "opacity-100 scale-y-100"
              : "opacity-0 scale-y-95 pointer-events-none"
          )}
        >
          <div className="flex flex-col p-4 gap-1">
            {["How It Works", "Teachers", "Pricing", "FAQ"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            <div className="border-t border-border my-2" />
            <a
              href="/login"
              className="px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors text-center"
              onClick={() => setMenuOpen(false)}
            >
              Log in
            </a>
            <a
              href="/signup"
              className="px-4 py-3 text-sm font-semibold text-accent hover:bg-accent-subtle rounded-lg transition-colors text-center"
              onClick={() => setMenuOpen(false)}
            >
              Start Learning
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
