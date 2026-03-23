"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Locale = "en" | "ja";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const translations: Record<Locale, Record<string, string>> = {
  en: {
    // App Shell
    "nav.home": "Home",
    "nav.schedule": "Schedule",
    "nav.students": "Students",
    "nav.profile": "Profile",
    "nav.search": "Search",
    "nav.bookings": "Bookings",
    "nav.favorites": "Favorites",
    "nav.history": "History",
    "nav.logout": "Log out",
    "badge.teacher": "Teacher",
    "badge.student": "Student",

    // Learner Dashboard
    "learner.welcome": "Welcome back",
    "learner.ready": "Ready for your next Japanese lesson?",
    "learner.lessons": "Lessons",
    "learner.favorites": "Favorites",
    "learner.nextLesson": "Next Lesson",
    "learner.joinRoom": "Join Room",
    "learner.viewBooking": "View Booking Details",
    "learner.findTeacher": "Find your first teacher",
    "learner.browseDesc": "Browse our Japanese teachers and book a lesson",
    "learner.browseTeachers": "Browse Teachers",
    "learner.recentHomework": "Recent Homework",
    "learner.viewAll": "View all",
    "learner.recommended": "Recommended Teachers",
    "learner.seeAll": "See all",

    // Teacher Dashboard
    "dashboard.hello": "Hello",
    "dashboard.editSchedule": "Edit Schedule",
    "dashboard.editProfile": "Edit Profile",
    "dashboard.thisMonth": "This Month",
    "dashboard.avgRating": "Avg Rating",
    "dashboard.total": "Total",
    "dashboard.nextStudent": "Next Student",
    "dashboard.startLesson": "Start Lesson",
    "dashboard.todaySchedule": "Today's Schedule",
    "dashboard.noLessons": "No lessons scheduled for today",
    "dashboard.inSession": "In Session",
    "dashboard.confirmed": "Confirmed",
    "dashboard.join": "Join",
    "dashboard.pendingReports": "Pending Reports",
    "dashboard.write": "Write",

    // Teacher Profile
    "profile.title": "Teacher Profile",
    "profile.status": "Status",
    "profile.avatar": "Avatar",
    "profile.uploadSoon": "Upload (coming soon)",
    "profile.uploadPhoto": "Upload Photo",
    "profile.basicInfo": "Basic Info",
    "profile.headline": "Headline (max 80 chars)",
    "profile.headlinePlaceholder": "Friendly native Japanese teacher!",
    "profile.bio": "Bio (min 200 chars)",
    "profile.bioPlaceholder": "Tell learners about yourself, your teaching experience...",
    "profile.categories": "Categories",
    "profile.languages": "Languages Spoken",
    "profile.levels": "Student Levels",
    "profile.pricing": "Pricing",
    "profile.hourlyRate": "Hourly Rate ($)",
    "profile.durations": "Lesson Durations",
    "profile.trial": "Trial Lesson",
    "profile.trialPrice": "Trial Price ($)",
    "profile.additional": "Additional",
    "profile.certifications": "Certifications",
    "profile.certPlaceholder": "JLPT N1, Teaching Certificate...",
    "profile.teachingStyle": "Teaching Style",
    "profile.stylePlaceholder": "Describe your teaching approach...",
    "profile.introVideo": "Intro Video URL",
    "profile.saved": "Profile saved!",
    "profile.saveDraft": "Save Draft",
    "profile.submitReview": "Submit for Review",

    // Schedule
    "schedule.title": "Schedule",
    "schedule.buffer": "Buffer between slots",
    "schedule.min": "min",
    "schedule.weeklyTemplate": "Weekly Template",
    "schedule.noBlocks": "No blocks set",
    "schedule.to": "to",
    "schedule.add": "Add",
    "schedule.generate": "Generate Slots (Next 7 Days)",
    "schedule.upcoming": "Upcoming Slots",
    "schedule.open": "open",
    "schedule.booked": "booked",
    "schedule.blocked": "blocked",
    "schedule.held": "held",

    // Bookings
    "bookings.title": "My Bookings",
    "bookings.upcoming": "Upcoming",
    "bookings.past": "Past",
    "bookings.confirmed": "Confirmed",
    "bookings.inSession": "In Session",
    "bookings.completed": "Completed",
    "bookings.cancelled": "Cancelled",
    "bookings.noShow": "No Show",
    "bookings.learner": "Learner",
    "bookings.noUpcoming": "No upcoming bookings",
    "bookings.noPast": "No past bookings",
    "bookings.startLesson": "Start Lesson",
    "bookings.writeReport": "Write Report",
    "bookings.editReport": "Edit Report",

    // Lesson Report
    "report.title": "Lesson Report",
    "report.saved": "Report Saved!",
    "report.redirecting": "Redirecting to bookings...",
    "report.template": "Template",
    "report.summary": "Summary",
    "report.summaryPlaceholder": "Describe what you covered in this lesson...",
    "report.homework": "Homework",
    "report.homeworkPlaceholder": "Assign homework or practice exercises...",
    "report.nextRec": "Next Lesson Recommendation",
    "report.nextRecPlaceholder": "What should you focus on next time...",
    "report.internalNote": "Internal Note",
    "report.onlyYou": "Only you can see this",
    "report.notePlaceholder": "Private notes about the student, lesson quality...",
    "report.save": "Save Report",
    "report.update": "Update Report",

    // Days
    "day.sun": "Sun",
    "day.mon": "Mon",
    "day.tue": "Tue",
    "day.wed": "Wed",
    "day.thu": "Thu",
    "day.fri": "Fri",
    "day.sat": "Sat",
  },
  ja: {
    // App Shell
    "nav.home": "ホーム",
    "nav.schedule": "スケジュール",
    "nav.students": "生徒",
    "nav.profile": "プロフィール",
    "nav.search": "検索",
    "nav.bookings": "予約",
    "nav.favorites": "お気に入り",
    "nav.history": "履歴",
    "nav.logout": "ログアウト",
    "badge.teacher": "講師",
    "badge.student": "生徒",

    // Learner Dashboard
    "learner.welcome": "おかえりなさい",
    "learner.ready": "次の日本語レッスンの準備はできましたか？",
    "learner.lessons": "レッスン",
    "learner.favorites": "お気に入り",
    "learner.nextLesson": "次のレッスン",
    "learner.joinRoom": "入室する",
    "learner.viewBooking": "予約の詳細を見る",
    "learner.findTeacher": "先生を見つけよう",
    "learner.browseDesc": "日本語の先生を探してレッスンを予約しましょう",
    "learner.browseTeachers": "先生を探す",
    "learner.recentHomework": "最近の宿題",
    "learner.viewAll": "すべて見る",
    "learner.recommended": "おすすめの先生",
    "learner.seeAll": "すべて見る",

    // Teacher Dashboard
    "dashboard.hello": "こんにちは",
    "dashboard.editSchedule": "スケジュール編集",
    "dashboard.editProfile": "プロフィール編集",
    "dashboard.thisMonth": "今月",
    "dashboard.avgRating": "平均評価",
    "dashboard.total": "合計",
    "dashboard.nextStudent": "次の生徒",
    "dashboard.startLesson": "レッスン開始",
    "dashboard.todaySchedule": "今日のスケジュール",
    "dashboard.noLessons": "今日のレッスンはありません",
    "dashboard.inSession": "レッスン中",
    "dashboard.confirmed": "確定済み",
    "dashboard.join": "参加",
    "dashboard.pendingReports": "未提出レポート",
    "dashboard.write": "記入",

    // Teacher Profile
    "profile.title": "講師プロフィール",
    "profile.status": "ステータス",
    "profile.avatar": "アバター",
    "profile.uploadSoon": "アップロード（準備中）",
    "profile.uploadPhoto": "写真をアップロード",
    "profile.basicInfo": "基本情報",
    "profile.headline": "ひとこと紹介（80文字以内）",
    "profile.headlinePlaceholder": "フレンドリーなネイティブ日本語講師！",
    "profile.bio": "自己紹介（200文字以上）",
    "profile.bioPlaceholder": "あなたの経歴や指導経験について書いてください...",
    "profile.categories": "カテゴリ",
    "profile.languages": "対応言語",
    "profile.levels": "対応レベル",
    "profile.pricing": "料金設定",
    "profile.hourlyRate": "時間単価（$）",
    "profile.durations": "レッスン時間",
    "profile.trial": "体験レッスン",
    "profile.trialPrice": "体験価格（$）",
    "profile.additional": "その他",
    "profile.certifications": "資格・証明書",
    "profile.certPlaceholder": "JLPT N1、教員免許...",
    "profile.teachingStyle": "指導スタイル",
    "profile.stylePlaceholder": "あなたの指導方法を説明してください...",
    "profile.introVideo": "紹介動画URL",
    "profile.saved": "プロフィールを保存しました！",
    "profile.saveDraft": "下書き保存",
    "profile.submitReview": "審査に提出",

    // Schedule
    "schedule.title": "スケジュール",
    "schedule.buffer": "スロット間のバッファ",
    "schedule.min": "分",
    "schedule.weeklyTemplate": "週間テンプレート",
    "schedule.noBlocks": "未設定",
    "schedule.to": "〜",
    "schedule.add": "追加",
    "schedule.generate": "スロット生成（7日間）",
    "schedule.upcoming": "今後のスロット",
    "schedule.open": "空き",
    "schedule.booked": "予約済",
    "schedule.blocked": "ブロック",
    "schedule.held": "仮押さえ",

    // Bookings
    "bookings.title": "予約管理",
    "bookings.upcoming": "今後",
    "bookings.past": "過去",
    "bookings.confirmed": "確定済み",
    "bookings.inSession": "レッスン中",
    "bookings.completed": "完了",
    "bookings.cancelled": "キャンセル",
    "bookings.noShow": "無断欠席",
    "bookings.learner": "生徒",
    "bookings.noUpcoming": "今後の予約はありません",
    "bookings.noPast": "過去の予約はありません",
    "bookings.startLesson": "レッスン開始",
    "bookings.writeReport": "レポート記入",
    "bookings.editReport": "レポート編集",

    // Lesson Report
    "report.title": "レッスンレポート",
    "report.saved": "レポートを保存しました！",
    "report.redirecting": "予約一覧に戻ります...",
    "report.template": "テンプレート",
    "report.summary": "概要",
    "report.summaryPlaceholder": "このレッスンで扱った内容を記述してください...",
    "report.homework": "宿題",
    "report.homeworkPlaceholder": "宿題や練習課題を出してください...",
    "report.nextRec": "次回レッスンの提案",
    "report.nextRecPlaceholder": "次回のレッスンで集中すべきこと...",
    "report.internalNote": "内部メモ",
    "report.onlyYou": "あなただけが閲覧できます",
    "report.notePlaceholder": "生徒やレッスンについてのメモ...",
    "report.save": "レポート保存",
    "report.update": "レポート更新",

    // Days
    "day.sun": "日",
    "day.mon": "月",
    "day.tue": "火",
    "day.wed": "水",
    "day.thu": "木",
    "day.fri": "金",
    "day.sat": "土",
  },
};

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("nihongo-locale") as Locale | null;
    if (saved === "en" || saved === "ja") {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("nihongo-locale", newLocale);
  };

  const t = (key: string): string => {
    return translations[locale][key] ?? translations.en[key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "ja" : "en")}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-border hover:bg-white/10 transition-colors text-text-secondary"
      title={locale === "en" ? "日本語に切り替え" : "Switch to English"}
    >
      <span className="text-sm">{locale === "en" ? "🇯🇵" : "🇺🇸"}</span>
      {locale === "en" ? "日本語" : "EN"}
    </button>
  );
}
