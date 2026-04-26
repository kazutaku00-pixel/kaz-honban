// Pre-lesson preferences — stored as a JSON envelope inside the existing
// `bookings.learner_note` text column to avoid a schema migration. The
// learner's free-form note remains in the `note` field, so legacy plain-text
// notes keep working.
//
// Wire format:
//   { v: 1, pace: "...", correction: "...", focus: ["..."], note: "..." }
//
// Plain string is treated as the legacy free-form note.

export const LESSON_PACE_OPTIONS = [
  { value: "slow", label: "Speak slowly" },
  { value: "normal", label: "Normal pace" },
  { value: "natural", label: "Speak naturally — challenge me" },
] as const;

export const CORRECTION_STYLES = [
  { value: "correct_all", label: "Correct everything" },
  { value: "major_only", label: "Only major mistakes" },
  { value: "let_me_speak", label: "Don't interrupt — let me speak" },
] as const;

export const FOCUS_AREAS = [
  { value: "grammar", label: "Grammar" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "pronunciation", label: "Pronunciation" },
  { value: "listening", label: "Listening" },
  { value: "free_talk", label: "Free conversation" },
  { value: "writing", label: "Writing/Kanji" },
] as const;

export type LessonPace = (typeof LESSON_PACE_OPTIONS)[number]["value"];
export type CorrectionStyle = (typeof CORRECTION_STYLES)[number]["value"];
export type FocusArea = (typeof FOCUS_AREAS)[number]["value"];

export interface LessonPreferences {
  v: 1;
  pace?: LessonPace;
  correction?: CorrectionStyle;
  focus?: FocusArea[];
  encouragement?: boolean;
  note?: string;
}

export function encodePreferences(prefs: LessonPreferences | null): string | null {
  if (!prefs) return null;
  // If the learner only filled out a free-form note and nothing else,
  // store as plain text for max readability for older clients.
  const onlyNote =
    !prefs.pace &&
    !prefs.correction &&
    (!prefs.focus || prefs.focus.length === 0) &&
    prefs.encouragement === undefined;
  if (onlyNote) return prefs.note?.trim() || null;
  return JSON.stringify(prefs);
}

export function decodePreferences(raw: string | null): LessonPreferences | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  // Plain text — treat as note only.
  if (!trimmed.startsWith("{")) {
    return { v: 1, note: trimmed };
  }
  try {
    const parsed = JSON.parse(trimmed) as LessonPreferences;
    if (parsed && typeof parsed === "object" && parsed.v === 1) {
      return parsed;
    }
  } catch {
    /* fall through to legacy text */
  }
  return { v: 1, note: trimmed };
}

const PACE_LABELS = Object.fromEntries(
  LESSON_PACE_OPTIONS.map((o) => [o.value, o.label])
) as Record<LessonPace, string>;

const CORRECTION_LABELS = Object.fromEntries(
  CORRECTION_STYLES.map((o) => [o.value, o.label])
) as Record<CorrectionStyle, string>;

const FOCUS_LABELS = Object.fromEntries(
  FOCUS_AREAS.map((o) => [o.value, o.label])
) as Record<FocusArea, string>;

export function paceLabel(value: LessonPace) {
  return PACE_LABELS[value] ?? value;
}
export function correctionLabel(value: CorrectionStyle) {
  return CORRECTION_LABELS[value] ?? value;
}
export function focusLabel(value: FocusArea) {
  return FOCUS_LABELS[value] ?? value;
}
