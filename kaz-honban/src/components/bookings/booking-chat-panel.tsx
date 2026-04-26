"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface ChatMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  body: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
}

interface BookingChatPanelProps {
  bookingId: string;
  currentUserId: string;
  counterpartName: string;
  counterpartAvatar: string | null;
  open: boolean;
  onClose: () => void;
}

const MAX_BODY_LENGTH = 1000;

export function BookingChatPanel({
  bookingId,
  currentUserId,
  counterpartName,
  counterpartAvatar,
  open,
  onClose,
}: BookingChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Esc closes
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while open (mobile sheet)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Initial load + realtime subscription
  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setMessages((data ?? []) as unknown as ChatMessage[]);
      }
      setLoading(false);
    })();

    const channel = supabase
      .channel(`chat-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const msg = payload.new as unknown as ChatMessage;
          setMessages((prev) => {
            // De-dupe — optimistic insert may have already added it.
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [bookingId, open]);

  // Autoscroll to bottom whenever messages change while panel is open
  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  // Focus the textarea when panel opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = useCallback(async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: insertError } = await supabase
        .from("messages")
        .insert({
          booking_id: bookingId,
          sender_id: currentUserId,
          body,
        } as never)
        .select()
        .single();
      if (insertError) {
        setError(insertError.message);
        return;
      }
      // Optimistic — append immediately even before the realtime echo arrives.
      const fresh = data as unknown as ChatMessage;
      setMessages((prev) => {
        if (prev.some((m) => m.id === fresh.id)) return prev;
        return [...prev, fresh];
      });
      setDraft("");
    } catch {
      setError("Couldn't send. Check your connection.");
    } finally {
      setSending(false);
    }
  }, [draft, sending, bookingId, currentUserId]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Chat with ${counterpartName}`}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-bg-secondary border border-border w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl flex flex-col h-[85vh] sm:h-[600px] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          {counterpartAvatar ? (
            // Plain img tag — Image w/ next/image can't be loaded async-easily here
            // and the avatar is small enough that optimization gain is minimal.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={counterpartAvatar}
              alt={counterpartName}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
              {counterpartName[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {counterpartName}
            </p>
            <p className="text-[11px] text-text-muted">
              Pre-lesson chat
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        {/* Message list */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={20} className="animate-spin text-text-muted" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-xs text-text-muted py-8 leading-relaxed">
              No messages yet — say hi before the lesson, share what you&apos;d like
              to focus on, or send a question.
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === currentUserId;
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    mine ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words",
                      mine
                        ? "bg-accent text-white rounded-br-md"
                        : "bg-white/5 text-text-primary rounded-bl-md"
                    )}
                  >
                    {m.body}
                    <div
                      className={cn(
                        "text-[10px] mt-1",
                        mine ? "text-white/70 text-right" : "text-text-muted"
                      )}
                    >
                      {new Date(m.created_at).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {error && (
          <div className="px-4 py-2 text-xs text-red-400 border-t border-red-500/20 bg-red-500/5">
            {error}
          </div>
        )}

        {/* Composer */}
        <div className="border-t border-border p-3 flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_BODY_LENGTH))}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Type a message…"
            className={cn(
              "flex-1 resize-none rounded-xl bg-white/5 border border-white/10",
              "px-3 py-2 text-sm text-text-primary placeholder:text-text-muted",
              "focus:outline-none focus:border-accent/50 transition",
              "max-h-32"
            )}
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim() || sending}
            aria-label="Send message"
            className={cn(
              "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition",
              draft.trim() && !sending
                ? "bg-accent text-white hover:bg-accent/90"
                : "bg-white/5 text-text-muted cursor-not-allowed"
            )}
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
