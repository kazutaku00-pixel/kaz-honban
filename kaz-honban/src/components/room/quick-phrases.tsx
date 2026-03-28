"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const PHRASES = [
  { ja: "わかりました", en: "I understand" },
  { ja: "もう一度お願いします", en: "Please repeat" },
  { ja: "もう少しゆっくり", en: "Slower please" },
  { ja: "わかりません", en: "I don't understand" },
  { ja: "どう読みますか？", en: "How do you read this?" },
  { ja: "どういう意味ですか？", en: "What does this mean?" },
  { ja: "すごい！", en: "Amazing!" },
  { ja: "ありがとう", en: "Thank you" },
];

interface QuickPhrasesProps {
  bookingId: string;
  userId: string;
}

export function QuickPhrases({ bookingId, userId }: QuickPhrasesProps) {
  const [sending, setSending] = useState<number | null>(null);

  async function handleSend(index: number) {
    if (sending !== null) return;
    setSending(index);
    const phrase = PHRASES[index];
    const supabase = createClient();
    await supabase.from("messages").insert({
      booking_id: bookingId,
      sender_id: userId,
      body: `[PHRASE]${phrase.ja} / ${phrase.en}`,
    } as never);
    setSending(null);
  }

  return (
    <div className="flex gap-1.5 overflow-x-auto px-3 py-2 scrollbar-none">
      {PHRASES.map((phrase, i) => (
        <button
          key={i}
          onClick={() => handleSend(i)}
          disabled={sending !== null}
          className="shrink-0 px-3 py-1.5 rounded-full bg-white/10 hover:bg-accent/20 hover:text-accent text-text-secondary text-xs font-medium transition whitespace-nowrap disabled:opacity-50"
        >
          {phrase.ja}
        </button>
      ))}
    </div>
  );
}
