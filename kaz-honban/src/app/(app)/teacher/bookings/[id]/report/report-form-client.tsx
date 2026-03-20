"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { LESSON_REPORT_TEMPLATES } from "@/lib/validations";

const TEMPLATE_SUMMARIES: Record<string, string> = {
  grammar:
    "Today we practiced grammar patterns. The student learned [grammar point] and practiced through [exercises/conversation].",
  conversation:
    "Today we had a conversation practice session. Topics discussed: [topics]. Vocabulary introduced: [vocabulary].",
  jlpt: "Today we worked on JLPT [N level] preparation. Sections covered: [vocabulary/grammar/reading/listening].",
  free_talk:
    "Today we had a free conversation session. The student talked about [topics] and practiced [skills].",
};

interface ReportFormClientProps {
  bookingId: string;
  learnerName: string;
  scheduledAt: string;
  durationMinutes: number;
  existingReport: {
    id: string;
    template_type: string | null;
    summary: string | null;
    homework: string | null;
    next_recommendation: string | null;
    internal_note: string | null;
  } | null;
}

export function ReportFormClient({
  bookingId,
  learnerName,
  scheduledAt,
  durationMinutes,
  existingReport,
}: ReportFormClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [templateType, setTemplateType] = useState(existingReport?.template_type ?? "");
  const [summary, setSummary] = useState(existingReport?.summary ?? "");
  const [homework, setHomework] = useState(existingReport?.homework ?? "");
  const [nextRecommendation, setNextRecommendation] = useState(
    existingReport?.next_recommendation ?? ""
  );
  const [internalNote, setInternalNote] = useState(existingReport?.internal_note ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectTemplate(value: string) {
    setTemplateType(value);
    if (!summary || summary === TEMPLATE_SUMMARIES[templateType]) {
      setSummary(TEMPLATE_SUMMARIES[value] ?? "");
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      if (existingReport) {
        const res = await fetch("/api/lesson-reports", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            report_id: existingReport.id,
            template_type: templateType || undefined,
            summary: summary.trim() || undefined,
            homework: homework.trim() || undefined,
            next_recommendation: nextRecommendation.trim() || undefined,
            internal_note: internalNote.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to update report");
          return;
        }
      } else {
        const res = await fetch("/api/lesson-reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_id: bookingId,
            template_type: templateType || undefined,
            summary: summary.trim() || undefined,
            homework: homework.trim() || undefined,
            next_recommendation: nextRecommendation.trim() || undefined,
            internal_note: internalNote.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to save report");
          return;
        }
      }
      setSaved(true);
      setTimeout(() => router.push("/teacher/bookings"), 1500);
    } catch {
      setError("Failed to save report");
    } finally {
      setSubmitting(false);
    }
  }

  if (saved) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-bg-secondary rounded-2xl border border-border p-8 text-center space-y-4">
          <CheckCircle size={48} className="text-green-400 mx-auto" />
          <h1 className="text-xl font-bold text-text-primary">{t("report.saved")}</h1>
          <p className="text-sm text-text-muted">{t("report.redirecting")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary font-[family-name:var(--font-display)]">
            {t("report.title")}
          </h1>
          <p className="text-sm text-text-muted">
            {learnerName} &middot;{" "}
            {new Date(scheduledAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            &middot; {durationMinutes} min
          </p>
        </div>
      </div>

      {/* Template Selector */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-3">
        <label className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          {t("report.template")}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {LESSON_REPORT_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.value}
              type="button"
              onClick={() => selectTemplate(tmpl.value)}
              className={cn(
                "py-2.5 px-3 rounded-xl text-sm font-medium transition",
                templateType === tmpl.value
                  ? "bg-gold text-white"
                  : "bg-white/5 text-text-secondary hover:bg-white/10"
              )}
            >
              {tmpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-3">
        <label className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
          <FileText size={14} />
          {t("report.summary")}
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder={t("report.summaryPlaceholder")}
          maxLength={2000}
          rows={4}
          className="w-full bg-white/5 rounded-xl border border-border p-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-gold/50 transition"
        />
      </div>

      {/* Homework */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-3">
        <label className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          {t("report.homework")}
        </label>
        <textarea
          value={homework}
          onChange={(e) => setHomework(e.target.value)}
          placeholder={t("report.homeworkPlaceholder")}
          maxLength={2000}
          rows={3}
          className="w-full bg-white/5 rounded-xl border border-border p-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-gold/50 transition"
        />
      </div>

      {/* Next Recommendation */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-3">
        <label className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          {t("report.nextRec")}
        </label>
        <textarea
          value={nextRecommendation}
          onChange={(e) => setNextRecommendation(e.target.value)}
          placeholder={t("report.nextRecPlaceholder")}
          maxLength={1000}
          rows={2}
          className="w-full bg-white/5 rounded-xl border border-border p-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-gold/50 transition"
        />
      </div>

      {/* Internal Note */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-3">
        <label className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
          <EyeOff size={14} />
          {t("report.internalNote")}
        </label>
        <p className="text-xs text-text-muted">{t("report.onlyYou")}</p>
        <textarea
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value)}
          placeholder={t("report.notePlaceholder")}
          maxLength={2000}
          rows={2}
          className="w-full bg-white/5 rounded-xl border border-border p-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-gold/50 transition"
        />
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
        disabled={submitting}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 rounded-xl",
          "bg-gold text-white font-semibold text-sm",
          "hover:bg-gold/90 transition",
          "disabled:opacity-50"
        )}
      >
        {submitting ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          existingReport ? t("report.update") : t("report.save")
        )}
      </button>
    </div>
  );
}
