'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex justify-between items-center py-6">
          <div className="text-2xl font-bold text-indigo-600">LessonMatch</div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-5 py-2 text-indigo-600 font-medium hover:text-indigo-700 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <div className="py-20 sm:py-32 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 leading-tight">
            Learn Anything,
            <br />
            <span className="text-indigo-600">From Anyone</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with expert teachers around the world for personalized online lessons via Zoom.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              Start Learning
            </Link>
            <Link
              href="/teachers"
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:border-indigo-300 hover:text-indigo-600 transition"
            >
              Browse Teachers
            </Link>
            <Link
              href="/test-call"
              className="px-8 py-4 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 transition shadow-lg shadow-green-200"
            >
              Video Call Test
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="py-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">Find Teachers</h3>
            <p className="text-gray-500 mt-2 text-sm">Browse expert teachers by subject, language, and availability.</p>
          </div>
          <div className="text-center p-6">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">Book Lessons</h3>
            <p className="text-gray-500 mt-2 text-sm">Schedule lessons at your convenience with easy booking.</p>
          </div>
          <div className="text-center p-6">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">Learn via Zoom</h3>
            <p className="text-gray-500 mt-2 text-sm">Join lessons with one click through integrated Zoom meetings.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
