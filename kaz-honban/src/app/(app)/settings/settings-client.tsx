"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { LEVELS, LANGUAGES } from "@/lib/validations";
import type { UserRole, JapaneseLevel } from "@/types/database";
import Link from "next/link";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Australia/Sydney",
];

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
  const [learningGoals, setLearningGoals] = useState(initialLearner?.learning_goals ?? "");
  const [japaneseLevel, setJapaneseLevel] = useState(initialLearner?.japanese_level ?? "none");
  const [nativeLanguage, setNativeLanguage] = useState(initialLearner?.native_language ?? "en");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const isTeacher = roles.includes("teacher");
  const isLearner = roles.includes("learner");

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
        await supabase
          .from("learner_profiles")
          .update({
            learning_goals: learningGoals.trim() || null,
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
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-bold text-xl">
                {(displayName || "?")[0].toUpperCase()}
              </div>
              <button
                type="button"
                disabled
                className="px-4 py-2 rounded-xl bg-white/5 text-text-muted text-sm font-medium cursor-not-allowed"
              >
                Upload (coming soon)
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 flex items-center gap-1">
              <Globe size={14} />
              Timezone
            </label>
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
            </select>
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
              <label className="text-sm text-text-secondary mb-1 block">Learning Goals</label>
              <textarea
                value={learningGoals}
                onChange={(e) => setLearningGoals(e.target.value)}
                placeholder="What do you want to achieve?"
                rows={3}
                className="w-full bg-white/5 rounded-xl border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent/50 transition"
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
