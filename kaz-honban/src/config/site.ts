export const siteConfig = {
  name: "NihonGo",
  tagline: "Learn Japanese with Real Teachers",
  description:
    "1-on-1 Japanese lessons with native speakers. From $10/15min. Join 50,000+ learners.",

  hero: {
    badge: "50,000+ learners on Instagram",
    titleEn: "Your Japanese\nJourney Starts Here",
    titleJa: "日本語、始めよう。",
    subtitle:
      "1-on-1 lessons with certified native Japanese teachers. Personalized to your level, schedule, and goals.",
    cta: { text: "Find Your Teacher", href: "/teachers" },
    secondaryCta: { text: "How It Works", href: "#how-it-works" },
    stats: [
      { value: "40+", label: "Native Teachers" },
      { value: "$10~", label: "per 15 min" },
      { value: "4.9", label: "Avg Rating" },
    ],
  },

  featuredTeachers: [
    {
      name: "Yuki",
      avatar: "Y",
      headline: "JLPT specialist & conversation coach",
      rating: 5.0,
      reviews: 128,
      price: 15,
      categories: ["JLPT", "Conversation"],
      isNew: false,
    },
    {
      name: "Haruka",
      avatar: "H",
      headline: "Business Japanese & keigo expert",
      rating: 4.9,
      reviews: 95,
      price: 20,
      categories: ["Business", "Keigo"],
      isNew: false,
    },
    {
      name: "Takeshi",
      avatar: "T",
      headline: "Fun conversational lessons for beginners",
      rating: 4.8,
      reviews: 72,
      price: 12,
      categories: ["Beginner", "Conversation"],
      isNew: false,
    },
    {
      name: "Mei",
      avatar: "M",
      headline: "Anime & pop culture Japanese",
      rating: 4.9,
      reviews: 64,
      price: 14,
      categories: ["Culture", "Casual"],
      isNew: true,
    },
    {
      name: "Kenji",
      avatar: "K",
      headline: "Academic Japanese & writing",
      rating: 4.7,
      reviews: 51,
      price: 18,
      categories: ["Academic", "Writing"],
      isNew: false,
    },
  ],

  howItWorks: [
    {
      step: "01",
      titleEn: "Find Your Teacher",
      titleJa: "先生を探す",
      description:
        "Browse profiles, watch intro videos, and pick a teacher that matches your style and goals.",
      icon: "Search",
    },
    {
      step: "02",
      titleEn: "Book a Lesson",
      titleJa: "予約する",
      description:
        "Choose a time that works for you. 15 or 30 minute lessons. No complicated scheduling.",
      icon: "Calendar",
    },
    {
      step: "03",
      titleEn: "Start Learning",
      titleJa: "レッスン開始",
      description:
        "Join your lesson with one click. Get homework, progress reports, and book your next session.",
      icon: "Video",
    },
  ],

  testimonials: [
    {
      name: "Sarah M.",
      country: "US",
      flag: "🇺🇸",
      comment:
        "I went from barely reading hiragana to passing JLPT N4 in 8 months. My teacher Yuki made every lesson fun and challenging.",
      rating: 5,
    },
    {
      name: "Lucas B.",
      country: "DE",
      flag: "🇩🇪",
      comment:
        "The homework after each lesson keeps me on track. I've never stuck with language learning this long before.",
      rating: 5,
    },
    {
      name: "Emma L.",
      country: "UK",
      flag: "🇬🇧",
      comment:
        "Having a real native speaker as my teacher is completely different from apps. I can actually hold conversations now.",
      rating: 5,
    },
  ],

  pricing: {
    title: "Simple, Transparent Pricing",
    subtitle: "No hidden fees. No subscriptions required. Pay per lesson.",
    tiers: [
      { duration: "15 min", price: "from $10", description: "Quick focused practice" },
      { duration: "30 min", price: "from $18", description: "Deep dive sessions" },
    ],
    note: "Platform fees are included in the lesson price. No additional charges.",
  },

  faq: [
    {
      q: "Do I need any prior Japanese knowledge?",
      a: "Not at all! Many of our teachers specialize in absolute beginners. They'll start from the very basics — hiragana, self-introduction, and simple phrases.",
    },
    {
      q: "How long is each lesson?",
      a: "You can choose between 15-minute or 30-minute lessons. 15 minutes is great for focused practice, while 30 minutes allows for deeper conversation and more exercises.",
    },
    {
      q: "Can I cancel or reschedule?",
      a: "Yes. Free cancellation up to 24 hours before the lesson. If something comes up last minute, please message your teacher directly.",
    },
    {
      q: "What equipment do I need?",
      a: "Just a device with a camera and microphone — a smartphone, tablet, or computer all work. Lessons happen right in your browser, no app download needed.",
    },
    {
      q: "How do payments work?",
      a: "We use PayPal for secure payments. You pay per lesson — no subscriptions, no commitments. Try one lesson and see if you like it.",
    },
  ],

  footer: {
    copyright: "NihonGo",
    links: [
      { text: "Terms", href: "/terms" },
      { text: "Privacy", href: "/privacy" },
      { text: "Contact", href: "mailto:support@nihongo.com" },
    ],
    social: {
      instagram: "https://instagram.com/nihongo",
    },
  },
};
