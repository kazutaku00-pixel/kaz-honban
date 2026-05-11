import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-7xl font-bold text-white/10 font-[family-name:var(--font-display)]">
          404
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Page not found</h2>
          <p className="text-sm text-gray-400 mt-2">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
