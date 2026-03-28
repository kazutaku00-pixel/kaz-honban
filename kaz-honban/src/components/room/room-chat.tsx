"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Send, ImagePlus, X, Loader2 } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  body: string;
  image_url: string | null;
  created_at: string;
}

interface RoomChatProps {
  bookingId: string;
  userId: string;
  otherName: string;
}

export function RoomChat({ bookingId, userId, otherName }: RoomChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Fetch existing messages
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, body, image_url, created_at")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);
    }
    load();
  }, [bookingId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB max
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function clearPending() {
    setPendingFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  async function handleSend() {
    const hasText = text.trim().length > 0;
    const hasImage = pendingFile !== null;
    if (!hasText && !hasImage) return;

    setSending(true);
    let imageUrl: string | null = null;

    try {
      // Upload image if present
      if (pendingFile) {
        setUploading(true);
        const ext = pendingFile.name.split(".").pop() ?? "jpg";
        const path = `chat/${bookingId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("chat-images")
          .upload(path, pendingFile, { upsert: false });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("chat-images")
            .getPublicUrl(path);
          imageUrl = urlData.publicUrl;
        }
        setUploading(false);
      }

      // Insert message
      await supabase.from("messages").insert({
        booking_id: bookingId,
        sender_id: userId,
        body: text.trim() || (imageUrl ? "" : ""),
        image_url: imageUrl,
      } as never);

      setText("");
      clearPending();
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full bg-bg-secondary border-l border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-text-primary">Chat</p>
        <p className="text-xs text-text-muted">{otherName}</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-text-muted text-center py-8">
            No messages yet
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === userId;
          return (
            <div
              key={msg.id}
              className={cn("flex", isMine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 space-y-1",
                  isMine
                    ? "bg-accent text-white rounded-br-md"
                    : "bg-white/10 text-text-primary rounded-bl-md"
                )}
              >
                {msg.image_url && (
                  <img
                    src={msg.image_url}
                    alt="shared"
                    className="rounded-lg max-w-full max-h-48 object-contain cursor-pointer"
                    onClick={() => window.open(msg.image_url!, "_blank")}
                  />
                )}
                {msg.body && (
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                )}
                <p
                  className={cn(
                    "text-[10px]",
                    isMine ? "text-white/60" : "text-text-muted"
                  )}
                >
                  {new Date(msg.created_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Image preview */}
      {previewUrl && (
        <div className="px-3 pb-1">
          <div className="relative inline-block">
            <img src={previewUrl} alt="preview" className="h-20 rounded-lg object-cover" />
            <button
              onClick={clearPending}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-3 border-t border-border flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-xl text-text-muted hover:text-accent hover:bg-white/5 transition shrink-0"
        >
          <ImagePlus size={20} />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 bg-white/5 border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition"
        />
        <button
          onClick={handleSend}
          disabled={sending || (!text.trim() && !pendingFile)}
          className="p-2 rounded-xl bg-accent text-white disabled:opacity-30 transition shrink-0"
        >
          {sending || uploading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
}
