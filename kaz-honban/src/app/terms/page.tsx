import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | NihonGo",
};

export default function TermsPage() {
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
          Terms of Service
        </h1>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-300">
          <p>Last updated: March 2026</p>

          <h2 className="text-white text-lg font-semibold">1. Service Overview</h2>
          <p>
            NihonGo is a marketplace connecting Japanese language learners with
            native-speaking teachers for 1-on-1 online lessons via video call.
          </p>

          <h2 className="text-white text-lg font-semibold">2. User Accounts</h2>
          <p>
            You must create an account to use NihonGo. You are responsible for
            maintaining the security of your account and all activities under it.
          </p>

          <h2 className="text-white text-lg font-semibold">3. Bookings &amp; Cancellations</h2>
          <p>
            Lessons can be cancelled up to 2 hours before the scheduled start
            time. No-shows may result in account restrictions.
          </p>

          <h2 className="text-white text-lg font-semibold">4. Conduct</h2>
          <p>
            Users must treat each other with respect. Harassment, discrimination,
            or inappropriate behavior will result in account suspension.
          </p>

          <h2 className="text-white text-lg font-semibold">5. Intellectual Property</h2>
          <p>
            All content on NihonGo, including the platform design, is owned by
            NihonGo. Lesson materials created by teachers remain their property.
          </p>

          <h2 className="text-white text-lg font-semibold">6. Limitation of Liability</h2>
          <p>
            NihonGo provides the platform as-is. We are not liable for the
            quality of individual lessons or disputes between users.
          </p>

          <h2 className="text-white text-lg font-semibold">7. Changes</h2>
          <p>
            We may update these terms at any time. Continued use of the platform
            constitutes acceptance of updated terms.
          </p>
        </div>
      </div>
    </div>
  );
}
