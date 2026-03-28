"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { BookOpen, X, Send, Loader2 } from "lucide-react";

interface VocabCardFormProps {
  bookingId: string;
  userId: string;
}

export function VocabCardForm({ bookingId, userId }: VocabCardFormProps) {
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  const [reading, setReading] = useState("");
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit() {
    if (!word.trim() || !meaning.trim()) return;
    setSending(true);
    const supabase = createClient();
    const data = {
      word: word.trim(),
      reading: reading.trim() || undefined,
      meaning: meaning.trim(),
      example: example.trim() || undefined,
    };
    await supabase.from("messages").insert({
      booking_id: bookingId,
      sender_id: userId,
      body: `[VOCAB]${JSON.stringify(data)}`,
    } as never);
    setWord("");
    setReading("");
    setMeaning("");
    setExample("");
    setSending(false);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-xl text-text-muted hover:text-accent hover:bg-white/5 transition shrink-0"
        title="Send vocabulary card"
      >
        <BookOpen size={20} />
      </button>
    );
  }

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 mx-3 bg-bg-secondary border border-border rounded-xl p-3 shadow-2xl space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-primary">Vocabulary Card</p>
        <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary">
          <X size={16} />
        </button>
      </div>

      <input
        value={word}
        onChange={(e) => setWord(e.target.value)}
        placeholder="Word / 単語 (e.g. 食べる)"
        className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50"
      />
      <input
        value={reading}
        onChange={(e) => setReading(e.target.value)}
        placeholder="Reading / 読み方 (e.g. たべる)"
        className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50"
      />
      <input
        value={meaning}
        onChange={(e) => setMeaning(e.target.value)}
        placeholder="Meaning (e.g. to eat)"
        className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50"
      />
      <input
        value={example}
        onChange={(e) => setExample(e.target.value)}
        placeholder="Example / 例文 (optional)"
        className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50"
      />

      <button
        onClick={handleSubmit}
        disabled={sending || !word.trim() || !meaning.trim()}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition",
          "bg-accent text-white disabled:opacity-40"
        )}
      >
        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        Send Card
      </button>
    </div>
  );
}
