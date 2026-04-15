"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowLeft, Star, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeacherWithProfile } from "@/types/database";

type GoalValue =
  | "daily_conversation"
  | "jlpt"
  | "business"
  | "travel"
  | "anime_manga"
  | "keigo";

type LevelValue = "beginner" | "n5" | "n4" | "n3" | "n2" | "n1";

type BudgetValue = "low" | "mid" | "high";

interface Answers {
  goal: GoalValue | null;
  level: LevelValue | null;
  budget: BudgetValue | null;
}

const GOAL_OPTIONS: { value: GoalValue; label: string; emoji: string; help: string }[] = [
  { value: "daily_conversation", label: "Daily conversation", emoji: "💬", help: "Chat naturally with friends" },
  { value: "jlpt", label: "Pass JLPT", emoji: "🎓", help: "N5 through N1" },
  { value: "business", label: "Business Japanese", emoji: "💼", help: "Meetings, emails, keigo" },
  { value: "travel", label: "Travel", emoji: "✈️", help: "Survive a trip to Japan" },
  { value: "anime_manga", label: "Anime & manga", emoji: "🎌", help: "Understand without subs" },
  { value: "keigo", label: "Keigo / polite", emoji: "🙇", help: "Sound natural and polite" },
];

const LEVEL_OPTIONS: { value: LevelValue; label: string; sub: string }[] = [
  { value: "beginner", label: "Just starting", sub: "Hiragana / greetings" },
  { value: "n5", label: "N5", sub: "Basic phrases" },
  { value: "n4", label: "N4", sub: "Simple conversation" },
  { value: "n3", label: "N3", sub: "Everyday Japanese" },
  { value: "n2", label: "N2", sub: "Business-ready" },
  { value: "n1", label: "N1", sub: "Advanced fluency" },
];

const BUDGET_OPTIONS: { value: BudgetValue; label: string; range: string }[] = [
  { value: "low", label: "Budget-friendly", range: "under $10 / 30min" },
  { value: "mid", label: "Standard", range: "$10 – $20 / 30min" },
  { value: "high", label: "Premium", range: "over $20 / 30min" },
];

function score(
  teacher: TeacherWithProfile,
  answers: Answers
): number {
  let s = 0;
  const pricePer30 = teacher.hourly_rate / 2;

  // Goal match
  if (answers.goal && teacher.categories.includes(answers.goal)) s += 40;
  // JLPT: generic boost if goal=jlpt and any JLPT level matches learner's
  if (answers.goal === "jlpt" && teacher.categories.includes("jlpt")) s += 10;

  // Level match — teachers explicitly supporting the learner's current level
  if (answers.level && teacher.levels.includes(answers.level)) s += 25;
  // Beginner-friendly: teacher supports "beginner" OR n5/n4
  if (answers.level === "beginner" && (teacher.levels.includes("beginner") || teacher.levels.includes("n5"))) s += 10;

  // Budget — non-overlapping tiers so a single price lands in exactly one bucket.
  if (answers.budget === "low" && pricePer30 < 10) s += 20;
  if (answers.budget === "mid" && pricePer30 >= 10 && pricePer30 <= 20) s += 20;
  if (answers.budget === "high" && pricePer30 > 20) s += 20;

  // Quality signals (small tiebreakers — never dominate match)
  s += Math.min(teacher.avg_rating, 5) * 2; // up to 10
  s += Math.min(teacher.review_count, 25) * 0.2; // up to 5
  if (teacher.trial_enabled) s += 4;

  return s;
}

export function QuizClient({ teachers }: { teachers: TeacherWithProfile[] }) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [answers, setAnswers] = useState<Answers>({
    goal: null,
    level: null,
    budget: null,
  });

  const ranked = useMemo(() => {
    return [...teachers]
      .map((t) => ({ t, s: score(t, answers) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 3)
      .map((x) => x.t);
  }, [teachers, answers]);

  function pick<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setStep((s) => (s < 3 ? ((s + 1) as 0 | 1 | 2 | 3) : s));
  }

  function restart() {
    setAnswers({ goal: null, level: null, budget: null });
    setStep(0);
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-12 md:py-20">
      {/* Hero */}
      {step === 0 && (
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-accent-subtle text-accent border border-accent/20">
              <Sparkles size={12} />
              60-second quiz
            </span>
            <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] text-text-primary">
              Find your perfect teacher
            </h1>
            <p className="text-sm md:text-base text-text-secondary">
              Three quick questions. We&apos;ll match you with three teachers who fit.
            </p>
          </div>

          <QuestionBlock
            title="What's your main goal?"
            subtitle="Pick what matters most right now — you can change later."
          >
            <div className="grid grid-cols-2 gap-3">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => pick("goal", opt.value)}
                  className={cn(
                    "group text-left p-4 rounded-2xl border transition",
                    "bg-bg-secondary border-border hover:border-accent hover:bg-bg-tertiary",
                    "active:scale-[0.98]"
                  )}
                >
                  <div className="text-2xl mb-2">{opt.emoji}</div>
                  <div className="text-sm font-semibold text-text-primary">
                    {opt.label}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">{opt.help}</div>
                </button>
              ))}
            </div>
          </QuestionBlock>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <StepHeader current={2} total={3} onBack={() => setStep(0)} />
          <QuestionBlock
            title="Where are you now?"
            subtitle="Your current Japanese level."
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => pick("level", opt.value)}
                  className={cn(
                    "p-3 rounded-2xl border transition text-center",
                    "bg-bg-secondary border-border hover:border-accent hover:bg-bg-tertiary"
                  )}
                >
                  <div className="text-sm font-semibold text-text-primary">
                    {opt.label}
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">{opt.sub}</div>
                </button>
              ))}
            </div>
          </QuestionBlock>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <StepHeader current={3} total={3} onBack={() => setStep(1)} />
          <QuestionBlock
            title="What's your comfort zone on price?"
            subtitle="We'll prioritize teachers in this range."
          >
            <div className="space-y-3">
              {BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => pick("budget", opt.value)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border transition",
                    "bg-bg-secondary border-border hover:border-accent hover:bg-bg-tertiary"
                  )}
                >
                  <div className="text-left">
                    <div className="text-sm font-semibold text-text-primary">
                      {opt.label}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">{opt.range}</div>
                  </div>
                  <ArrowRight size={16} className="text-accent" />
                </button>
              ))}
            </div>
          </QuestionBlock>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={12} />
              Your top 3 matches
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-display)] text-text-primary">
              These teachers fit you
            </h2>
            <p className="text-xs text-text-muted">
              Based on your goal, level, and budget
            </p>
          </div>

          {ranked.length === 0 ? (
            <div className="text-center py-12 text-sm text-text-muted">
              No teachers match yet — browse the full list and filter manually.
            </div>
          ) : (
            <div className="space-y-3">
              {ranked.map((t, idx) => (
                <MatchCard key={t.user_id} teacher={t} rank={idx + 1} />
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <Link
              href="/teachers"
              className="flex-1 w-full text-center py-3 rounded-xl text-sm font-semibold bg-accent text-white hover:bg-accent-hover transition"
            >
              See all teachers
            </Link>
            <button
              onClick={restart}
              className="flex-1 w-full text-center py-3 rounded-xl text-sm font-medium border border-border text-text-secondary hover:bg-white/5 transition"
            >
              Redo the quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepHeader({
  current,
  total,
  onBack,
}: {
  current: number;
  total: number;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition"
      >
        <ArrowLeft size={14} /> Back
      </button>
      <span className="text-xs text-text-muted">
        Step {current} of {total}
      </span>
      <div className="w-10" />
    </div>
  );
}

function QuestionBlock({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold font-[family-name:var(--font-display)] text-text-primary">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-text-muted mt-1">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function MatchCard({
  teacher,
  rank,
}: {
  teacher: TeacherWithProfile;
  rank: number;
}) {
  const profile = teacher.profile;
  const initial = (profile.display_name ?? "?")[0].toUpperCase();
  return (
    <Link
      href={`/teachers/${teacher.user_id}`}
      className="group flex items-center gap-4 p-4 rounded-2xl bg-bg-secondary border border-border hover:border-accent hover:bg-bg-tertiary transition"
    >
      <div className="relative flex-shrink-0">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.display_name}
            width={64}
            height={64}
            className="w-16 h-16 rounded-xl object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white text-2xl font-bold">
            {initial}
          </div>
        )}
        <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center shadow-lg">
          {rank}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-text-primary truncate">
            {profile.display_name}
          </h3>
          {teacher.trial_enabled && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              Trial
            </span>
          )}
        </div>
        {teacher.headline && (
          <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
            {teacher.headline}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-xs">
            <Star size={11} className="text-gold fill-gold" />
            <span className="text-text-primary font-medium">
              {teacher.avg_rating.toFixed(1)}
            </span>
            <span className="text-text-muted">
              ({teacher.review_count})
            </span>
          </span>
          <span className="text-xs text-text-muted">
            ${teacher.hourly_rate / 2}/30min
          </span>
        </div>
      </div>
      <ArrowRight
        size={18}
        className="text-text-muted group-hover:text-accent group-hover:translate-x-1 transition shrink-0"
      />
    </Link>
  );
}
