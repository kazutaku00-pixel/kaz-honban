"use client";

import { useState } from "react";
import { Share2, Check, Copy, Twitter, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface TeacherShareButtonProps {
  name: string;
  url: string;
}

export function TeacherShareButton({ name, url }: TeacherShareButtonProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== "undefined" ? window.location.origin + url : url;
  const text = t("share.message").replace("{name}", name);

  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: name, text, url: fullUrl });
      } catch {
        // user cancelled
      }
      return;
    }
    setOpen(!open);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1500);
  }

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(fullUrl)}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(fullUrl)}`;
  const instaText = `${text} ${fullUrl}`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleNativeShare}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
          "border-border bg-bg-secondary text-text-secondary hover:border-border-hover hover:text-text-primary"
        )}
        aria-label={t("share.label")}
      >
        <Share2 size={13} />
        {t("share.label")}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full right-0 mt-1.5 z-50 min-w-[180px] bg-bg-secondary border border-border rounded-xl shadow-xl overflow-hidden">
            <button
              type="button"
              onClick={handleCopy}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copied ? t("share.copied") : t("share.copy")}
            </button>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
            >
              <Twitter size={13} />
              X (Twitter)
            </a>
            <a
              href={lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
            >
              <MessageCircle size={13} />
              LINE
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(instaText);
                setCopied(true);
                setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors border-t border-border"
            >
              <span className="text-[11px] font-bold bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">IG</span>
              {t("share.instagram")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
