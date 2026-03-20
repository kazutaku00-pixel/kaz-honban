"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ReviewFormClientProps {
  booking: {
    id: string;
    teacher_id: string;
    teacher_name: string;
    teacher_avatar: string | null;
    teacher_headline: string | null;
  };
  alreadyReviewed: boolean;
  nextSlots: { id: string; start_at: string; end_at: string }[];
}

export function ReviewFormClient({
  booking,
  alreadyReviewed,
  nextSlots,
}: ReviewFormClientProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(alreadyReviewed);
  const [error, setError] = useState<string | null>(null);

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
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to submit review");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="bg-bg-secondary rounded-2xl border border-border p-8 text-center space-y-4">
          <CheckCircle size={48} className="text-green-400 mx-auto" />
          <h1 className="text-xl font-bold text-text-primary">
            {alreadyReviewed ? "Already Reviewed" : "Thank you!"}
          </h1>
          <p className="text-sm text-text-muted">
            {alreadyReviewed
              ? "You have already left a review for this lesson."
              : "Your review helps other learners find great teachers."}
          </p>
        </div>

        {/* Book again CTA */}
        {nextSlots.length > 0 && (
          <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
              Book again with {booking.teacher_name}?
            </h2>
            <div className="flex items-center gap-4 mb-4">
              {booking.teacher_avatar ? (
                <img
                  src={booking.teacher_avatar}
                  alt={booking.teacher_name}
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
          <img
            src={booking.teacher_avatar}
            alt={booking.teacher_name}
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
