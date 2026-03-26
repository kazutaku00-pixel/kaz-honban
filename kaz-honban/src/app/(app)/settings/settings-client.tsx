"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  LogOut,
  Loader2,
  User,
  Globe,
  Target,
  Languages,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { LEVELS, LANGUAGES, LEARNING_GOALS } from "@/lib/validations";
import type { UserRole, JapaneseLevel } from "@/types/database";
import Link from "next/link";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "America/Mexico_City",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Singapore",
  "Asia/Manila",
  "Australia/Sydney",
  "Pacific/Auckland",
];

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

interface SettingsClientProps {
  profile: {
    display_name: string;
    avatar_url: string | null;
    timezone: string;
  };
  learnerProfile: {
    learning_goals: string | null;
    japanese_level: JapaneseLevel;
    native_language: string;
  } | null;
  roles: UserRole[];
}

export function SettingsClient({
  profile: initialProfile,
  learnerProfile: initialLearner,
  roles,
}: SettingsClientProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialProfile.display_name);
  const [timezone, setTimezone] = useState(initialProfile.timezone);
  // Parse stored goals: format is "tag1,tag2,...|custom text"
  const parseGoals = (raw: string | null) => {
    if (!raw) return { tags: [] as string[], custom: "" };
    const pipeIdx = raw.indexOf("|");
    if (pipeIdx === -1) {
      // Legacy: check if it's comma-separated tags or free text
      const possibleTags = raw.split(",").map((s) => s.trim());
      const allValid = possibleTags.every((t) =>
        LEARNING_GOALS.some((g) => g.value === t)
      );
      if (allValid && possibleTags[0]) return { tags: possibleTags, custom: "" };
      return { tags: [], custom: raw };
    }
    const tagsPart = raw.substring(0, pipeIdx);
    const customPart = raw.substring(pipeIdx + 1);
    return {
      tags: tagsPart ? tagsPart.split(",").filter(Boolean) : [],
      custom: customPart,
    };
  };

  const initialGoals = parseGoals(initialLearner?.learning_goals ?? null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(initialGoals.tags);
  const [customGoal, setCustomGoal] = useState(initialGoals.custom);
  const [japaneseLevel, setJapaneseLevel] = useState(initialLearner?.japanese_level ?? "none");
  const [nativeLanguage, setNativeLanguage] = useState(initialLearner?.native_language ?? "en");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isTeacher = roles.includes("teacher");
  const isLearner = roles.includes("learner");

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

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const supabase = createClient();

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          timezone,
        } as never)
        .eq("id", (await supabase.auth.getUser()).data.user!.id);

      if (profileError) {
        setError("Failed to update profile");
        return;
      }

      // Update learner profile if applicable
      if (isLearner && initialLearner) {
        const userId = (await supabase.auth.getUser()).data.user!.id;
        const goalsStr =
          selectedGoals.length || customGoal.trim()
            ? `${selectedGoals.join(",")}|${customGoal.trim()}`
            : null;
        await supabase
          .from("learner_profiles")
          .update({
            learning_goals: goalsStr,
            japanese_level: japaneseLevel,
            native_language: nativeLanguage,
          } as never)
          .eq("user_id", userId);
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
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
        <h1 className="text-xl font-bold text-text-primary font-[family-name:var(--font-display)]">
          Settings
        </h1>
      </div>

      {/* Profile Section */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 text-text-muted">
          <User size={16} />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Profile</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              className="w-full bg-white/5 rounded-xl border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition"
            />
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Avatar</label>
            <div className="flex items-center gap-3">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-bold text-xl">
                    {(displayName || "?")[0].toUpperCase()}
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
                {uploadingAvatar ? "Uploading..." : "Upload Photo"}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 flex items-center gap-1">
              <Globe size={14} />
              Timezone
            </label>
            <div className="space-y-2">
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-white/5 rounded-xl border border-border px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition appearance-none"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz} className="bg-bg-secondary text-text-primary">
                    {tz}
                  </option>
                ))}
                {/* Include user's detected TZ if not in list */}
                {!TIMEZONES.includes(detectTimezone()) && (
                  <option value={detectTimezone()} className="bg-bg-secondary text-text-primary">
                    {detectTimezone()}
                  </option>
                )}
              </select>
              {timezone === "UTC" && (
                <button
                  type="button"
                  onClick={() => setTimezone(detectTimezone())}
                  className="text-xs text-accent hover:underline"
                >
                  Auto-detect: {detectTimezone()}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Learner Section */}
      {isLearner && (
        <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-2 text-text-muted">
            <Target size={16} />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Learning</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-text-secondary mb-2 block">Learning Goals</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {LEARNING_GOALS.map((goal) => {
                  const isSelected = selectedGoals.includes(goal.value);
                  return (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() =>
                        setSelectedGoals((prev) =>
                          isSelected
                            ? prev.filter((v) => v !== goal.value)
                            : [...prev, goal.value]
                        )
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                        isSelected
                          ? "bg-accent text-white"
                          : "bg-white/5 text-text-secondary border border-border hover:border-border-hover hover:text-text-primary"
                      )}
                    >
                      {goal.label}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="Other goals (optional)"
                className="w-full bg-white/5 rounded-xl border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition"
              />
            </div>

            <div>
              <label className="text-sm text-text-secondary mb-1 block">Japanese Level</label>
              <select
                value={japaneseLevel}
                onChange={(e) => setJapaneseLevel(e.target.value as JapaneseLevel)}
                className="w-full bg-white/5 rounded-xl border border-border px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition appearance-none"
              >
                <option value="none" className="bg-bg-secondary text-text-primary">
                  None / Beginner
                </option>
                {LEVELS.map((level) => (
                  <option key={level.value} value={level.value} className="bg-bg-secondary text-text-primary">
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-text-secondary mb-1 flex items-center gap-1">
                <Languages size={14} />
                Native Language
              </label>
              <select
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="w-full bg-white/5 rounded-xl border border-border px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition appearance-none"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value} className="bg-bg-secondary text-text-primary">
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Link */}
      {isTeacher && (
        <Link
          href="/teacher/profile"
          className="flex items-center justify-between bg-bg-secondary rounded-2xl border border-border p-4 hover:border-border-hover transition"
        >
          <span className="text-sm font-medium text-text-primary">Edit Teacher Profile</span>
          <span className="text-xs text-accent">Go &rarr;</span>
        </Link>
      )}

      {/* Error / Success */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-green-400 text-sm">
          Settings saved!
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 rounded-xl",
          "bg-accent text-white font-semibold text-sm",
          "hover:bg-accent/90 transition disabled:opacity-50"
        )}
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        Save Changes
      </button>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 text-red-400 font-medium text-sm hover:bg-red-500/10 transition disabled:opacity-50"
      >
        {signingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
        Sign Out
      </button>
    </div>
  );
}
