import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | NihonGo",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-white transition"
        >
          &larr; Back
        </Link>

        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)]">
          Privacy Policy
        </h1>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-300">
          <p>Last updated: March 2026</p>

          <h2 className="text-white text-lg font-semibold">1. Information We Collect</h2>
          <p>
            We collect information you provide directly: name, email address,
            profile photo, and lesson preferences. We also collect usage data
            such as booking history and session activity.
          </p>

          <h2 className="text-white text-lg font-semibold">2. How We Use Your Information</h2>
          <p>
            Your information is used to provide and improve our services, match
            you with teachers, process bookings, and send relevant notifications.
          </p>

          <h2 className="text-white text-lg font-semibold">3. Data Sharing</h2>
          <p>
            We do not sell your personal data. We share limited information with
            teachers/learners as necessary for lessons (e.g., display name,
            profile photo). We use Supabase for data storage, Daily.co for video
            calls, and Vercel for hosting.
          </p>

          <h2 className="text-white text-lg font-semibold">4. Data Security</h2>
          <p>
            We implement industry-standard security measures including encrypted
            connections (HTTPS), row-level security in our database, and secure
            authentication via OAuth.
          </p>

          <h2 className="text-white text-lg font-semibold">5. Your Rights</h2>
          <p>
            You can access, update, or delete your personal data at any time
            through your account settings. To request complete data deletion,
            contact us directly.
          </p>

          <h2 className="text-white text-lg font-semibold">6. Cookies</h2>
          <p>
            We use essential cookies for authentication and session management.
            No third-party tracking cookies are used.
          </p>

          <h2 className="text-white text-lg font-semibold">7. Contact</h2>
          <p>
            For privacy-related questions, please contact us through the platform.
          </p>
        </div>
      </div>
    </div>
  );
}
