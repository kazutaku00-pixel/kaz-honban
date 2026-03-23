"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a]">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-400"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Something went wrong
              </h2>
              <p className="text-sm text-gray-400 mt-2">
                An unexpected error occurred. Please try again.
              </p>
            </div>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF6B4A] text-white font-semibold text-sm hover:bg-[#FF6B4A]/90 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
