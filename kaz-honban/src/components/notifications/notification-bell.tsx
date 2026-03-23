"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/providers/user-provider";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications((data ?? []) as unknown as Notification[]);
      setLoading(false);
    }
    fetch();
  }, [user]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markAsRead(id: string) {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true } as never)
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  function handleClick(n: Notification) {
    if (!n.is_read) markAsRead(n.id);
    if (n.link) {
      window.location.href = n.link;
    }
    setOpen(false);
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-white/5 transition"
      >
        <Bell size={18} className="text-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl bg-bg-secondary border border-border shadow-2xl z-50">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">
              Notifications
            </h3>
          </div>

          {loading ? (
            <div className="p-4 text-center text-text-muted text-sm">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-sm">
              No notifications yet
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-border/50 hover:bg-white/5 transition",
                    !n.is_read && "bg-accent/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm truncate",
                          n.is_read
                            ? "text-text-secondary"
                            : "text-text-primary font-medium"
                        )}
                      >
                        {n.title}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-text-muted">
                        {timeAgo(n.created_at)}
                      </span>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-accent" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
