"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MessageSquareText, X, Copy, Check } from "lucide-react";

interface Phrase {
  jp: string;
  romaji: string;
  en: string;
}

interface PhraseGroup {
  id: string;
  label: string;
  phrases: Phrase[];
}

// Static, hand-picked Japanese helper phrases. Curated for the moments
// learners freeze: tech trouble, asking for repetition, slowing the lesson
// down, and graceful exits. Kept short on purpose — long lists kill the
// "I'll just glance" use case.
const PHRASE_GROUPS: PhraseGroup[] = [
  {
    id: "tech",
    label: "Tech trouble",
    phrases: [
      { jp: "音が聞こえません。", romaji: "Oto ga kikoemasen.", en: "I can't hear you." },
      { jp: "映像が見えません。", romaji: "Eizō ga miemasen.", en: "I can't see your video." },
      { jp: "もう一度入り直します。", romaji: "Mō ichido hairi-naoshimasu.", en: "I'll re-join the call." },
      { jp: "少しお待ちください。", romaji: "Sukoshi omachi kudasai.", en: "Please wait a moment." },
    ],
  },
  {
    id: "ask",
    label: "Need help",
    phrases: [
      { jp: "もう一度言ってください。", romaji: "Mō ichido itte kudasai.", en: "Please say that again." },
      { jp: "ゆっくり話してください。", romaji: "Yukkuri hanashite kudasai.", en: "Please speak slowly." },
      { jp: "意味がわかりません。", romaji: "Imi ga wakarimasen.", en: "I don't understand the meaning." },
      { jp: "英語で言ってもいいですか?", romaji: "Eigo de itte mo ii desu ka?", en: "Can I say it in English?" },
      { jp: "チャットに書いてください。", romaji: "Chatto ni kaite kudasai.", en: "Please write it in the chat." },
    ],
  },
  {
    id: "lesson",
    label: "Steer the lesson",
    phrases: [
      { jp: "文法を教えてください。", romaji: "Bunpō o oshiete kudasai.", en: "Please teach me grammar." },
      { jp: "発音を直してください。", romaji: "Hatsuon o naoshite kudasai.", en: "Please correct my pronunciation." },
      { jp: "自由に話したいです。", romaji: "Jiyū ni hanashitai desu.", en: "I want to free-talk." },
      { jp: "宿題を出してください。", romaji: "Shukudai o dashite kudasai.", en: "Please give me homework." },
    ],
  },
  {
    id: "social",
    label: "Greetings & goodbyes",
    phrases: [
      { jp: "よろしくお願いします。", romaji: "Yoroshiku onegaishimasu.", en: "Looking forward to working with you." },
      { jp: "ありがとうございました。", romaji: "Arigatō gozaimashita.", en: "Thank you (after the lesson)." },
      { jp: "また次回もよろしくお願いします。", romaji: "Mata jikai mo yoroshiku onegaishimasu.", en: "See you next time." },
    ],
  },
];

export function HelperPhrasesPanel() {
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState(PHRASE_GROUPS[0].id);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeGroup =
    PHRASE_GROUPS.find((g) => g.id === groupId) ?? PHRASE_GROUPS[0];

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((cur) => (cur === key ? null : cur)), 1400);
    } catch {
      /* clipboard might be blocked in iframe contexts; silent fail is fine */
    }
  }

  return (
    <>
      {/* Floating trigger button — sits above the leave button on mobile */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close helper phrases" : "Open helper phrases"}
        className={cn(
          "fixed z-[55] bottom-4 right-4 flex items-center gap-2 px-3.5 py-2.5",
          "rounded-full shadow-lg backdrop-blur-md border transition",
          open
            ? "bg-accent border-accent text-white"
            : "bg-bg-secondary/90 border-border text-text-secondary hover:text-text-primary"
        )}
      >
        <MessageSquareText size={16} />
        <span className="text-xs font-medium">Phrases</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Japanese helper phrases"
          className={cn(
            "fixed z-[55] right-4 bottom-20 w-[min(360px,calc(100vw-2rem))]",
            "max-h-[70vh] flex flex-col rounded-2xl bg-bg-secondary/95 backdrop-blur-md",
            "border border-border shadow-xl overflow-hidden"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-text-primary">Helper phrases</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X size={16} className="text-text-muted" />
            </button>
          </div>

          {/* Group tabs */}
          <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-border">
            {PHRASE_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGroupId(g.id)}
                className={cn(
                  "shrink-0 px-3 py-1 rounded-full text-[11px] font-medium border transition",
                  groupId === g.id
                    ? "bg-accent border-accent text-white"
                    : "bg-white/5 border-border text-text-muted hover:text-text-primary"
                )}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Phrase list */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {activeGroup.phrases.map((p, i) => {
              const key = `${activeGroup.id}-${i}`;
              const copied = copiedKey === key;
              return (
                <div
                  key={key}
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-text-primary leading-snug">
                      {p.jp}
                    </p>
                    <button
                      type="button"
                      onClick={() => copy(p.jp, key)}
                      aria-label="Copy Japanese"
                      className={cn(
                        "shrink-0 p-1 rounded-md transition",
                        copied
                          ? "text-emerald-400"
                          : "text-text-muted hover:text-text-primary"
                      )}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-text-muted italic">{p.romaji}</p>
                  <p className="text-[11px] text-text-secondary">{p.en}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
