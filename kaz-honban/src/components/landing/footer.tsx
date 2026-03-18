import { siteConfig } from "@/config/site";
import { Instagram } from "lucide-react";

export function Footer() {
  const { footer } = siteConfig;

  return (
    <footer className="relative border-t border-border bg-bg-secondary/30">
      <div className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold font-[family-name:var(--font-display)] tracking-tight text-text-primary">
              Nihon<span className="text-accent">Go</span>
            </span>
            <span className="text-xs text-text-muted">
              Learn Japanese with Real Teachers
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            {footer.links.map((link) => (
              <a
                key={link.text}
                href={link.href}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                {link.text}
              </a>
            ))}
            <a
              href={footer.social.instagram}
              className="text-text-muted hover:text-accent transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} {footer.copyright}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
