"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle,
  Send,
  User,
  DollarSign,
  BookOpen,
  Languages,
  BarChart,
  Video,
  Award,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, LANGUAGES, LEVELS } from "@/lib/validations";
import type { TeacherApprovalStatus } from "@/types/database";

interface TeacherProfileFormClientProps {
  existingProfile: {
    headline: string;
    bio: string;
    hourly_rate: number;
    categories: string[];
    languages: string[];
    levels: string[];
    lesson_duration_options: number[];
    teaching_style: string;
    certifications: string;
    intro_video_url: string;
    trial_enabled: boolean;
    trial_price: number;
    approval_status: TeacherApprovalStatus;
    is_public: boolean;
  } | null;
  avatarUrl: string | null;
  displayName: string;
}

export function TeacherProfileFormClient({
  existingProfile,
  avatarUrl: initialAvatarUrl,
  displayName,
}: TeacherProfileFormClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState("");
  const [headline, setHeadline] = useState(existingProfile?.headline ?? "");
  const [bio, setBio] = useState(existingProfile?.bio ?? "");
  const [hourlyRate, setHourlyRate] = useState(existingProfile?.hourly_rate ?? 15);
  const [categories, setCategories] = useState<string[]>(existingProfile?.categories ?? []);
  const [languages, setLanguages] = useState<string[]>(existingProfile?.languages ?? []);
  const [levels, setLevels] = useState<string[]>(existingProfile?.levels ?? []);
  const [durationOptions, setDurationOptions] = useState<number[]>(
    existingProfile?.lesson_duration_options ?? [25]
  );
  const [teachingStyle, setTeachingStyle] = useState(existingProfile?.teaching_style ?? "");
  const [certifications, setCertifications] = useState(existingProfile?.certifications ?? "");
  const [introVideoUrl, setIntroVideoUrl] = useState(existingProfile?.intro_video_url ?? "");
  const [trialEnabled, setTrialEnabled] = useState(existingProfile?.trial_enabled ?? false);
  const [trialPrice, setTrialPrice] = useState(existingProfile?.trial_price ?? 0);
  const [isPublic, setIsPublic] = useState(existingProfile?.is_public ?? false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to upload avatar");
        return;
      }

      setAvatarUrl(data.avatar_url);
      router.refresh();
    } catch {
      setError("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 50 * 1024 * 1024) {
      setError(t("profile.videoTooLarge"));
      return;
    }

    setUploadingVideo(true);
    setVideoProgress(t("profile.videoUploading"));
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/intro-video", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to upload video");
        return;
      }

      setIntroVideoUrl(data.video_url);
      setVideoProgress("");
      router.refresh();
    } catch {
      setError("Failed to upload video");
    } finally {
      setUploadingVideo(false);
      setVideoProgress("");
    }
  }

  async function handleVideoDelete() {
    setError(null);
    try {
      const res = await fetch("/api/intro-video", { method: "DELETE" });
      if (res.ok) {
        setIntroVideoUrl("");
        router.refresh();
      }
    } catch {
      setError("Failed to delete video");
    }
  }

  function toggleArrayItem(arr: string[], item: string, setter: (v: string[]) => void) {
    setter(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]);
  }

  function toggleDuration(d: number) {
    setDurationOptions(
      durationOptions.includes(d)
        ? durationOptions.filter((x) => x !== d)
        : [...durationOptions, d]
    );
  }

  async function handleSave(submitForReview = false) {
    if (submitForReview) {
      setSubmitting(true);
    } else {
      setSaving(true);
    }
    setError(null);
    setSaved(false);

    try {
      const supabase = createClient();
      const userId = (await supabase.auth.getUser()).data.user!.id;

      const payload = {
        headline: headline.trim(),
        bio: bio.trim(),
        hourly_rate: hourlyRate,
        categories,
        languages,
        levels,
        lesson_duration_options: durationOptions,
        teaching_style: teachingStyle.trim() || null,
        certifications: certifications.trim() || null,
        intro_video_url: introVideoUrl.trim() || null,
        trial_enabled: trialEnabled,
        trial_price: trialPrice,
        is_public: isPublic,
        ...(submitForReview ? { approval_status: "submitted" } : {}),
      } as never;

      const { error: updateError } = await supabase
        .from("teacher_profiles")
        .update(payload)
        .eq("user_id", userId);

      if (updateError) {
        setError("Failed to save profile");
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  }

  const approvalStatus = existingProfile?.approval_status ?? "draft";

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
            {t("profile.title")}
          </h1>
          <p className="text-xs text-text-muted capitalize">{t("profile.status")}: {approvalStatus}</p>
        </div>
      </div>

      {/* Avatar section */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-3">
        <div className="flex items-center gap-2 text-text-muted">
          <User size={16} />
          <h2 className="text-sm font-semibold uppercase tracking-wider">{t("profile.avatar")}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center text-white font-bold text-2xl">
                {(displayName || "T")[0].toUpperCase()}
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="px-4 py-2 rounded-xl bg-white/5 text-text-secondary text-sm font-medium hover:bg-white/10 transition disabled:opacity-50 flex items-center gap-2"
          >
            {uploadingAvatar ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Camera size={14} />
            )}
            {uploadingAvatar ? "Uploading..." : t("profile.uploadPhoto")}
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">{t("profile.basicInfo")}</h2>
        <div>
          <label className="text-sm text-text-secondary mb-1 block">{t("profile.headline")}</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            maxLength={80}
            placeholder={t("profile.headlinePlaceholder")}
            className="w-full bg-white/5 rounded-xl border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition"
          />
        </div>
        <div>
          <label className="text-sm text-text-secondary mb-1 block">{t("profile.bio")}</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={1000}
            rows={6}
            placeholder={t("profile.bioPlaceholder")}
            className="w-full bg-white/5 rounded-xl border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-gold/50 transition"
          />
          <p className="text-xs text-text-muted text-right mt-1">{bio.length}/1000</p>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-3">
        <div className="flex items-center gap-2 text-text-muted">
          <BookOpen size={16} />
          <h2 className="text-sm font-semibold uppercase tracking-wider">{t("profile.categories")}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => toggleArrayItem(categories, cat.value, setCategories)}
              className={cn(
                "px-3 py-2 rounded-xl text-sm font-medium transition",
                categories.includes(cat.value)
                  ? "bg-gold text-white"
                  : "bg-white/5 text-text-secondary hover:bg-white/10"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-3">
        <div className="flex items-center gap-2 text-text-muted">
          <Languages size={16} />
          <h2 className="text-sm font-semibold uppercase tracking-wider">{t("profile.languages")}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.value}
              type="button"
              onClick={() => toggleArrayItem(languages, lang.value, setLanguages)}
              className={cn(
                "px-3 py-2 rounded-xl text-sm font-medium transition",
                languages.includes(lang.value)
                  ? "bg-gold text-white"
                  : "bg-white/5 text-text-secondary hover:bg-white/10"
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Levels */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-3">
        <div className="flex items-center gap-2 text-text-muted">
          <BarChart size={16} />
          <h2 className="text-sm font-semibold uppercase tracking-wider">{t("profile.levels")}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => toggleArrayItem(levels, level.value, setLevels)}
              className={cn(
                "px-3 py-2 rounded-xl text-sm font-medium transition",
                levels.includes(level.value)
                  ? "bg-gold text-white"
                  : "bg-white/5 text-text-secondary hover:bg-white/10"
              )}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 text-text-muted">
          <DollarSign size={16} />
          <h2 className="text-sm font-semibold uppercase tracking-wider">{t("profile.pricing")}</h2>
        </div>
        <div>
          <label className="text-sm text-text-secondary mb-1 block">{t("profile.hourlyRate")}</label>
          <input
            type="number"
            min={5}
            max={100}
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Number(e.target.value))}
            className="w-full bg-white/5 rounded-xl border border-border px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-gold/50 transition"
          />
        </div>
        <div>
          <label className="text-sm text-text-secondary mb-1 block">{t("profile.durations")}</label>
          <div className="flex gap-3">
            {[25, 50].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDuration(d)}
                className={cn(
                  "flex-1 py-3 rounded-xl font-medium text-sm transition",
                  durationOptions.includes(d)
                    ? "bg-gold text-white"
                    : "bg-white/5 text-text-secondary hover:bg-white/10"
                )}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-secondary">{t("profile.trial")}</label>
          <button
            type="button"
            onClick={() => setTrialEnabled(!trialEnabled)}
            className={cn(
              "w-12 h-6 rounded-full transition-colors relative",
              trialEnabled ? "bg-gold" : "bg-white/10"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform",
                trialEnabled ? "translate-x-6" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
        {trialEnabled && (
          <div>
            <label className="text-sm text-text-secondary mb-1 block">{t("profile.trialPrice")}</label>
            <input
              type="number"
              min={0}
              max={50}
              value={trialPrice}
              onChange={(e) => setTrialPrice(Number(e.target.value))}
              className="w-full bg-white/5 rounded-xl border border-border px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-gold/50 transition"
            />
          </div>
        )}
      </div>

      {/* Visibility Toggle */}
      {approvalStatus === "approved" && (
        <div className="bg-bg-secondary rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">{t("profile.visibility")}</h2>
              <p className="text-xs text-text-muted mt-1">
                {isPublic ? t("profile.visible") : t("profile.hidden")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                isPublic ? "bg-green-500" : "bg-white/10"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform",
                  isPublic ? "translate-x-6" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        </div>
      )}

      {/* Additional Details */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">{t("profile.additional")}</h2>
        <div>
          <label className="text-sm text-text-secondary mb-1 flex items-center gap-1">
            <Award size={14} />
            {t("profile.certifications")}
          </label>
          <textarea
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            rows={2}
            placeholder={t("profile.certPlaceholder")}
            className="w-full bg-white/5 rounded-xl border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-gold/50 transition"
          />
        </div>
        <div>
          <label className="text-sm text-text-secondary mb-1 block">{t("profile.teachingStyle")}</label>
          <textarea
            value={teachingStyle}
            onChange={(e) => setTeachingStyle(e.target.value)}
            rows={2}
            placeholder={t("profile.stylePlaceholder")}
            className="w-full bg-white/5 rounded-xl border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-gold/50 transition"
          />
        </div>
        <div className="space-y-3">
          <label className="text-sm text-text-secondary flex items-center gap-1">
            <Video size={14} />
            {t("profile.introVideo")}
          </label>

          {/* Current video preview */}
          {introVideoUrl && (
            <div className="rounded-xl border border-border overflow-hidden">
              {isDirectVideo(introVideoUrl) ? (
                <video
                  src={introVideoUrl}
                  controls
                  className="w-full aspect-video bg-black"
                  preload="metadata"
                />
              ) : extractYouTubeId(introVideoUrl) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(introVideoUrl)}`}
                  title="Intro video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                  allowFullScreen
                  className="w-full aspect-video"
                />
              ) : null}
            </div>
          )}

          {/* Upload button */}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleVideoUpload}
            className="hidden"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploadingVideo}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gold/10 text-gold text-sm font-medium hover:bg-gold/20 transition disabled:opacity-50"
            >
              {uploadingVideo ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {videoProgress}
                </>
              ) : (
                <>
                  <Video size={16} />
                  {t("profile.uploadVideo")}
                </>
              )}
            </button>
            {introVideoUrl && (
              <button
                type="button"
                onClick={handleVideoDelete}
                className="px-4 py-3 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition"
              >
                {t("profile.deleteVideo")}
              </button>
            )}
          </div>
          <p className="text-xs text-text-muted">{t("profile.videoHint")}</p>

          {/* YouTube URL fallback */}
          <div className="pt-2 border-t border-border">
            <label className="text-xs text-text-muted mb-1 block">{t("profile.orYoutubeUrl")}</label>
            <input
              type="url"
              value={isDirectVideo(introVideoUrl) ? "" : introVideoUrl}
              onChange={(e) => setIntroVideoUrl(e.target.value)}
              placeholder="https://youtube.com/..."
              disabled={isDirectVideo(introVideoUrl)}
              className="w-full bg-white/5 rounded-xl border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition disabled:opacity-40"
            />
          </div>
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-green-400 text-sm flex items-center gap-2">
          <CheckCircle size={16} />
          {t("profile.saved")}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3 rounded-xl",
            "bg-gold text-white font-semibold text-sm",
            "hover:bg-gold/90 transition disabled:opacity-50"
          )}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {t("profile.saveDraft")}
        </button>

        {(approvalStatus === "draft" || approvalStatus === "rejected") && (
          <button
            onClick={() => handleSave(true)}
            disabled={submitting || bio.length < 200 || categories.length === 0}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-xl",
              "bg-gold/20 text-gold font-semibold text-sm",
              "hover:bg-gold/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {t("profile.submitReview")}
          </button>
        )}
      </div>
    </div>
  );
}

function isDirectVideo(url: string): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(url) || url.includes("/videos/");
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}
