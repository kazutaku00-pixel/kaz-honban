"use client";

import { useState, useEffect } from "react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Star, ArrowRight, CheckCircle, Loader2, Heart, Sparkles, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { REVIEW_TAGS } from "@/lib/validations";

const MAX_TAGS = 6;

interface ReviewFormClientProps {
  booking: {
    id: string;
    teacher_id: string;
    teacher_name: string;
    teacher_avatar: string | null;
    teacher_headline: string | null;
  };
  alreadyReviewed: boolean;
  initialFavorited?: boolean;
  totalReviewsCount?: number;
  nextSlots: { id: string; start_at: string; end_at: string }[];
}

export function ReviewFormClient({
  booking,
  alreadyReviewed,
  initialFavorited = false,
  totalReviewsCount = 0,
  nextSlots,
}: ReviewFormClientProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(alreadyReviewed);
  const [error, setError] = useState<string | null>(null);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [savingFavorite, setSavingFavorite] = useState(false);
  // High-rating reviews default the heart to ON so satisfied learners save the
  // teacher with one tap — they can still untoggle. Phase 1's repeat-booking
  // funnel hinges on this nudge.
  const [favoriteAutoApplied, setFavoriteAutoApplied] = useState(false);

  useEffect(() => {
    if (!submitted) return;
    if (favoriteAutoApplied) return;
    if (rating < 4) return;
    if (initialFavorited || favorited) return;
    setFavoriteAutoApplied(true);
    void toggleFavorite(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  useUnsavedChanges(
    (rating > 0 || comment.length > 0 || selectedTags.length > 0) && !submitted
  );

  async function toggleFavorite(nextOn: boolean) {
    if (savingFavorite) return;
    setSavingFavorite(true);
    const previous = favorited;
    setFavorited(nextOn);
    try {
      const res = await fetch("/api/favorites", {
        method: nextOn ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: booking.teacher_id }),
      });
      // 409 on POST means already favorited — treat as success.
      if (!res.ok && res.status !== 409) {
        setFavorited(previous);
      }
    } catch {
      setFavorited(previous);
    } finally {
      setSavingFavorite(false);
    }
  }

  function handleShare() {
    const text = `${booking.teacher_name}先生のレッスン最高だった！日本語マーケットプレイス NihonGo で予約できるよ ✨`;
    const url = typeof window !== "undefined" ? `${window.location.origin}/teachers/${booking.teacher_id}` : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "NihonGo", text, url }).catch(() => {});
      return;
    }
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    if (typeof window !== "undefined") window.open(intent, "_blank", "noopener,noreferrer");
  }

  function toggleTag(value: string) {
    setSelectedTags((prev) => {
      if (prev.includes(value)) return prev.filter((t) => t !== value);
      if (prev.length >= MAX_TAGS) return prev;
      return [...prev, value];
    });
  }

  async function handleSubmit() {
    if (rating === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          rating,
          comment: comment.trim() || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        return;
      }
      // Treat "already reviewed" as a soft success — the learner's intent is
      // satisfied and the existing review stands.
      if (res.status === 409) {
        setSubmitted(true);
        return;
      }
      const data = await res.json().catch(() => ({} as { error?: string }));
      const fallback = (() => {
        switch (res.status) {
          case 400:
            return "This lesson can't be reviewed yet. Please wait until the lesson has ended.";
          case 401:
            return "Please sign in again to submit your review.";
          case 403:
            return "Only the student from this lesson can leave a review.";
          case 404:
            return "We couldn't find this booking. Try refreshing the page.";
          default:
            return "Something went wrong. Please try again in a moment.";
        }
      })();
      setError(data.error ?? fallback);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    const showFavoriteCard = !alreadyReviewed;
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="relative bg-bg-secondary rounded-2xl border border-border p-8 text-center space-y-4 overflow-hidden">
          {!alreadyReviewed && (
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              {/* Sparkle confetti — pure CSS, respects reduced-motion via globals.css */}
              {[...Array(8)].map((_, i) => (
                <span
                  key={i}
                  className="absolute block sparkle"
                  style={{
                    left: `${10 + i * 11}%`,
                    top: `${20 + (i % 3) * 20}%`,
                    animationDelay: `${i * 80}ms`,
                  }}
                >
                  <Sparkles size={14} className="text-gold" />
                </span>
              ))}
            </div>
          )}
          <CheckCircle size={48} className="text-green-400 mx-auto relative z-10" />
          <h1 className="text-xl font-bold text-text-primary relative z-10">
            {alreadyReviewed ? "Already Reviewed" : `ありがとう！⭐`}
          </h1>
          <p className="text-sm text-text-muted relative z-10 leading-relaxed">
            {alreadyReviewed ? (
              "You have already left a review for this lesson."
            ) : (
              <>
                Your review helps <span className="text-text-primary font-medium">{booking.teacher_name}</span> grow on NihonGo
                {totalReviewsCount > 0 && (
                  <>
                    <br />
                    <span className="text-xs">
                      {totalReviewsCount.toLocaleString()}+ learners have supported teachers this way 💛
                    </span>
                  </>
                )}
              </>
            )}
          </p>
          {!alreadyReviewed && (
            <button
              type="button"
              onClick={handleShare}
              className="relative z-10 inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition mt-1"
            >
              <Share2 size={12} />
              Share the love
            </button>
          )}
        </div>

        {/* Save teacher — surfaces at the moment of highest satisfaction. */}
        {showFavoriteCard && (
          <button
            type="button"
            onClick={() => toggleFavorite(!favorited)}
            disabled={savingFavorite}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-2xl border transition text-left",
              favorited
                ? "bg-accent/10 border-accent/30"
                : "bg-bg-secondary border-border hover:border-border-hover"
            )}
            aria-pressed={favorited}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition",
                favorited ? "bg-accent text-white" : "bg-white/5 text-text-muted"
              )}
            >
              <Heart size={18} className={favorited ? "fill-current" : ""} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">
                {favorited ? "Saved to favorites" : "Save this teacher"}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {favorited
                  ? `Tap again to remove ${booking.teacher_name}`
                  : `Find ${booking.teacher_name} faster next time`}
              </p>
            </div>
            {savingFavorite && <Loader2 size={16} className="animate-spin text-text-muted" />}
          </button>
        )}

        {/* Book again CTA */}
        {nextSlots.length > 0 && (
          <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
              Book again with {booking.teacher_name}?
            </h2>
            <div className="flex items-center gap-4 mb-4">
              {booking.teacher_avatar ? (
                <Image
                  src={booking.teacher_avatar}
                  alt={booking.teacher_name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-xl object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-bold text-lg">
                  {booking.teacher_name[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-text-primary">{booking.teacher_name}</p>
                {booking.teacher_headline && (
                  <p className="text-sm text-text-muted">{booking.teacher_headline}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {nextSlots.map((slot) => (
                <Link
                  key={slot.id}
                  href={`/teachers/${booking.teacher_id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition"
                >
                  <div className="text-sm">
                    <span className="text-text-primary font-medium">
                      {new Date(slot.start_at).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-text-muted ml-2">
                      {new Date(slot.start_at).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-accent" />
                </Link>
              ))}
            </div>
          </div>
        )}

        <Link
          href="/dashboard"
          className="block w-full py-3 text-center text-sm text-text-muted hover:text-text-secondary transition"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-text-primary">
          How was your lesson?
        </h1>
        <p className="text-sm text-text-muted">
          Rate your experience with {booking.teacher_name}
        </p>
      </div>

      {/* Teacher info */}
      <div className="flex items-center justify-center gap-4">
        {booking.teacher_avatar ? (
          <Image
            src={booking.teacher_avatar}
            alt={booking.teacher_name}
            width={64}
            height={64}
            className="w-16 h-16 rounded-xl object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-bold text-2xl">
            {booking.teacher_name[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Star rating */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                size={36}
                className={cn(
                  "transition-colors",
                  (hoveredStar || rating) >= star
                    ? "text-gold fill-gold"
                    : "text-text-muted"
                )}
              />
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-text-muted">
          {rating === 0
            ? "Tap to rate"
            : rating <= 2
              ? "We hope it gets better"
              : rating <= 3
                ? "Not bad"
                : rating <= 4
                  ? "Great lesson!"
                  : "Amazing!"}
        </p>
      </div>

      {/* Tag chips — quick, low-friction signal */}
      {rating > 0 && (
        <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-secondary">
              What stood out? <span className="text-text-muted">(optional)</span>
            </label>
            <span className="text-xs text-text-muted">
              {selectedTags.length}/{MAX_TAGS}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {REVIEW_TAGS.map((tag) => {
              const active = selectedTags.includes(tag.value);
              const disabled = !active && selectedTags.length >= MAX_TAGS;
              return (
                <button
                  key={tag.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleTag(tag.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                    active
                      ? "bg-accent text-white border-accent"
                      : "bg-white/5 text-text-secondary border-border hover:border-border-hover",
                    disabled && "opacity-40 cursor-not-allowed"
                  )}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Comment */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-3">
        <label className="text-sm font-medium text-text-secondary">
          Comment (optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          maxLength={1000}
          rows={4}
          className="w-full bg-white/5 rounded-xl border border-border p-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent/50 transition"
        />
        <p className="text-xs text-text-muted text-right">{comment.length}/1000</p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition",
          rating === 0
            ? "bg-white/5 text-text-muted cursor-not-allowed"
            : "bg-accent text-white hover:bg-accent/90",
          "disabled:opacity-50"
        )}
      >
        {submitting ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          "Submit Review"
        )}
      </button>

      {/* Skip */}
      <Link
        href="/dashboard"
        className="block w-full py-3 text-center text-sm text-text-muted hover:text-text-secondary transition"
      >
        Skip
      </Link>
    </div>
  );
}
