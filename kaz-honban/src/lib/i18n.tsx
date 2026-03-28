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
    "profile.introVideo": "Introduction Video",
    "profile.uploadVideo": "Upload Video",
    "profile.deleteVideo": "Delete",
    "profile.videoHint": "MP4, WebM, or MOV. Max 50MB, recommended 30-60 seconds.",
    "profile.videoUploading": "Uploading...",
    "profile.videoTooLarge": "Video too large. Max 50MB.",
    "profile.orYoutubeUrl": "Or paste a YouTube URL",
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

    // Teachers page
    "teachers.title": "Find Your Teacher",
    "teachers.subtitle": "Browse our community of native Japanese speakers and find the perfect teacher for your learning goals.",
    "teachers.searchPlaceholder": "Search teachers by name or keyword...",
    "teachers.allCategories": "All Categories",
    "teachers.allPrices": "All Prices",
    "teachers.allLanguages": "All Languages",
    "teachers.allLevels": "All Levels",
    "teachers.under": "Under $15",
    "teachers.recommended": "Recommended",
    "teachers.highestRating": "Highest Rating",
    "teachers.lowestPrice": "Lowest Price",
    "teachers.newest": "Newest",
    "teachers.found": "teachers found",
    "teachers.found1": "teacher found",
    "teachers.noResults": "No teachers found matching your filters",
    "teachers.noResultsHint": "Try adjusting your search or filters",
    "teachers.loadMore": "Load More Teachers",
    "teachers.viewProfile": "View Profile",
    "teachers.new": "New",
    "teachers.price": "Price",
    "teachers.language": "Language",
    "teachers.level": "Level",
    "teachers.day": "Day",
    "teachers.time": "Time",
    "teachers.anyDay": "Any Day",
    "teachers.anyTime": "Any Time",
    "teachers.morning": "Morning (6-12)",
    "teachers.afternoon": "Afternoon (12-17)",
    "teachers.evening": "Evening (17-21)",
    "teachers.night": "Night (21-6)",
    "teachers.sort": "Sort",
    "teachers.lessonsShort": "lessons",
    "teachers.category": "Category",

    // Teacher detail page
    "detail.backToTeachers": "Back to Teachers",
    "detail.reviews": "reviews",
    "detail.lessons": "lessons",
    "detail.aboutMe": "About Me",
    "detail.teachingStyle": "Teaching Style",
    "detail.certifications": "Certifications",
    "detail.introVideo": "Introduction Video",
    "detail.noReviews": "No reviews yet",
    "detail.bookLesson": "Book a Lesson",
    "detail.tabAbout": "About",
    "detail.tabSchedule": "Schedule",
    "detail.tabReviews": "Reviews",

    // Category labels
    "cat.daily_conversation": "Daily Conversation",
    "cat.business": "Business Japanese",
    "cat.jlpt": "JLPT Preparation",
    "cat.travel": "Travel Japanese",
    "cat.anime_manga": "Anime & Manga",
    "cat.pronunciation": "Pronunciation",
    "cat.reading_writing": "Reading & Writing",
    "cat.keigo": "Keigo (Polite Language)",

    // Empty states
    "empty.noSlots": "No available slots in the next 7 days",
    "empty.noSlotsHint": "Check back later or browse other teachers",
    "empty.noSlotsDay": "No slots on this day — try another date above",
    "empty.noTeachers": "No teachers found matching your filters",
    "empty.noTeachersHint": "Try adjusting your search or filters",
    "empty.noFavorites": "No favorites yet",
    "empty.noFavoritesHint": "Tap the heart on a teacher's card to save them here",
    "empty.noBookings": "No upcoming bookings",
    "empty.noPastBookings": "No past bookings yet",

    // Status labels
    "status.draft": "Draft",
    "status.submitted": "Under Review",
    "status.approved": "Approved",
    "status.rejected": "Rejected",
    "status.suspended": "Suspended",
    "status.confirmed": "Confirmed",
    "status.in_session": "In Session",
    "status.completed": "Completed",
    "status.cancelled": "Cancelled",
    "status.no_show": "No Show",

    // Errors
    "error.generic": "Something went wrong. Please try again.",
    "error.unauthorized": "Please log in to continue.",
    "error.notFound": "Not found",
    "error.slotUnavailable": "This slot is no longer available.",
    "error.bookingFailed": "Failed to create booking. Please try again.",

    // Notifications
    "notif.newBooking": "New Booking",
    "notif.bookingCancelled": "Booking Cancelled",
    "notif.lessonComplete": "Lesson Completed",
    "notif.reportReady": "Lesson Report Ready",
    "notif.newReview": "New Review",
    "notif.profileApproved": "Profile Approved!",
    "notif.profileRejected": "Profile Needs Changes",

    // Teacher profile pause
    "profile.visibility": "Profile Visibility",
    "profile.visible": "Visible to students",
    "profile.hidden": "Hidden from search",
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
    "profile.introVideo": "紹介動画",
    "profile.uploadVideo": "動画をアップロード",
    "profile.deleteVideo": "削除",
    "profile.videoHint": "MP4, WebM, MOV対応。最大50MB、30〜60秒推奨。",
    "profile.videoUploading": "アップロード中...",
    "profile.videoTooLarge": "動画が大きすぎます。最大50MBです。",
    "profile.orYoutubeUrl": "またはYouTube URLを貼り付け",
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

    // Teachers page
    "teachers.title": "先生を探す",
    "teachers.subtitle": "ネイティブの日本語講師コミュニティから、あなたにぴったりの先生を見つけましょう。",
    "teachers.searchPlaceholder": "名前やキーワードで検索...",
    "teachers.allCategories": "すべてのカテゴリ",
    "teachers.allPrices": "すべての価格",
    "teachers.allLanguages": "すべての言語",
    "teachers.allLevels": "すべてのレベル",
    "teachers.under": "$15以下",
    "teachers.recommended": "おすすめ",
    "teachers.highestRating": "評価が高い順",
    "teachers.lowestPrice": "価格が安い順",
    "teachers.newest": "新着順",
    "teachers.found": "人の先生が見つかりました",
    "teachers.found1": "人の先生が見つかりました",
    "teachers.noResults": "条件に合う先生が見つかりません",
    "teachers.noResultsHint": "検索条件を変更してみてください",
    "teachers.loadMore": "もっと見る",
    "teachers.viewProfile": "プロフィールを見る",
    "teachers.new": "新着",
    "teachers.price": "価格",
    "teachers.language": "言語",
    "teachers.level": "レベル",
    "teachers.day": "曜日",
    "teachers.time": "時間帯",
    "teachers.anyDay": "すべての曜日",
    "teachers.anyTime": "すべての時間",
    "teachers.morning": "朝 (6-12時)",
    "teachers.afternoon": "昼 (12-17時)",
    "teachers.evening": "夕方 (17-21時)",
    "teachers.night": "夜 (21-6時)",
    "teachers.sort": "並び替え",
    "teachers.lessonsShort": "レッスン",
    "teachers.category": "カテゴリ",

    // Teacher detail page
    "detail.backToTeachers": "先生一覧に戻る",
    "detail.reviews": "件のレビュー",
    "detail.lessons": "レッスン",
    "detail.aboutMe": "自己紹介",
    "detail.teachingStyle": "指導スタイル",
    "detail.certifications": "資格・証明書",
    "detail.introVideo": "紹介動画",
    "detail.noReviews": "まだレビューはありません",
    "detail.bookLesson": "レッスンを予約",
    "detail.tabAbout": "紹介",
    "detail.tabSchedule": "スケジュール",
    "detail.tabReviews": "レビュー",

    // Category labels
    "cat.daily_conversation": "日常会話",
    "cat.business": "ビジネス日本語",
    "cat.jlpt": "JLPT対策",
    "cat.travel": "旅行日本語",
    "cat.anime_manga": "アニメ・漫画",
    "cat.pronunciation": "発音",
    "cat.reading_writing": "読み書き",
    "cat.keigo": "敬語",

    // Empty states
    "empty.noSlots": "今後7日間に空きスロットがありません",
    "empty.noSlotsHint": "後でまた確認するか、他の先生を探してください",
    "empty.noSlotsDay": "この日は空きがありません — 他の日を選んでください",
    "empty.noTeachers": "条件に合う先生が見つかりません",
    "empty.noTeachersHint": "検索条件を変更してみてください",
    "empty.noFavorites": "お気に入りはまだありません",
    "empty.noFavoritesHint": "先生のカードのハートをタップして保存しましょう",
    "empty.noBookings": "今後の予約はありません",
    "empty.noPastBookings": "過去の予約はまだありません",

    // Status labels
    "status.draft": "下書き",
    "status.submitted": "審査中",
    "status.approved": "承認済み",
    "status.rejected": "不承認",
    "status.suspended": "停止中",
    "status.confirmed": "確定済み",
    "status.in_session": "レッスン中",
    "status.completed": "完了",
    "status.cancelled": "キャンセル",
    "status.no_show": "無断欠席",

    // Errors
    "error.generic": "エラーが発生しました。もう一度お試しください。",
    "error.unauthorized": "ログインしてください。",
    "error.notFound": "見つかりません",
    "error.slotUnavailable": "このスロットはすでに予約されています。",
    "error.bookingFailed": "予約に失敗しました。もう一度お試しください。",

    // Notifications
    "notif.newBooking": "新しい予約",
    "notif.bookingCancelled": "予約キャンセル",
    "notif.lessonComplete": "レッスン完了",
    "notif.reportReady": "レッスンレポート",
    "notif.newReview": "新しいレビュー",
    "notif.profileApproved": "プロフィール承認！",
    "notif.profileRejected": "プロフィール修正が必要です",

    // Teacher profile pause
    "profile.visibility": "プロフィール公開設定",
    "profile.visible": "生徒に表示中",
    "profile.hidden": "検索から非表示",
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
