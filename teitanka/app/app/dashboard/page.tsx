'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import { mockBookings } from '../data/mock';
import type { BookingStatus } from '../types';

const statusColors: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export default function DashboardPage() {
  const [viewAs, setViewAs] = useState<'learner' | 'teacher'>('learner');
  const [bookings, setBookings] = useState(mockBookings);

  const filteredBookings =
    viewAs === 'learner'
      ? bookings.filter((b) => b.learner_id === 'l1')
      : bookings.filter((b) => b.teacher_id === 't1');

  const handleAccept = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'accepted' as BookingStatus } : b))
    );
  };

  const handleReject = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'rejected' as BookingStatus } : b))
    );
  };

  const handleComplete = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'completed' as BookingStatus } : b))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your lessons and bookings</p>
          </div>
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setViewAs('learner')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                viewAs === 'learner' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Learner View
            </button>
            <button
              onClick={() => setViewAs('teacher')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                viewAs === 'teacher' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Teacher View
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500">Total Bookings</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{filteredBookings.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500">Upcoming</div>
            <div className="text-3xl font-bold text-indigo-600 mt-1">
              {filteredBookings.filter((b) => b.status === 'accepted').length}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500">Completed</div>
            <div className="text-3xl font-bold text-green-600 mt-1">
              {filteredBookings.filter((b) => b.status === 'completed').length}
            </div>
          </div>
        </div>

        <Link
          href="/test-call"
          className="flex items-center gap-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl p-5 mb-8 hover:from-green-700 hover:to-emerald-700 transition shadow-lg"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-lg">Video Call Test Room</div>
            <div className="text-green-100 text-sm">Click to test video calling with Daily.co</div>
          </div>
          <svg className="w-6 h-6 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              {viewAs === 'learner' ? 'My Bookings' : 'Booking Requests'}
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                      {(viewAs === 'learner' ? booking.teacher_name : booking.learner_name)
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {viewAs === 'learner' ? booking.teacher_name : booking.learner_name}
                      </div>
                      <div className="text-sm text-gray-500">{booking.subject}</div>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(booking.scheduled_time).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                  {booking.status}
                </span>
                <div className="flex gap-2">
                  {booking.status === 'accepted' && (
                    <>
                      <Link
                        href={`/lesson/${booking.id}`}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
                      >
                        Join Lesson
                      </Link>
                      {viewAs === 'teacher' && (
                        <button
                          onClick={() => handleComplete(booking.id)}
                          className="px-3 py-1.5 border border-green-600 text-green-600 text-sm rounded-lg hover:bg-green-50 transition"
                        >
                          Complete
                        </button>
                      )}
                    </>
                  )}
                  {booking.status === 'pending' && viewAs === 'teacher' && (
                    <>
                      <button
                        onClick={() => handleAccept(booking.id)}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(booking.id)}
                        className="px-3 py-1.5 border border-red-500 text-red-500 text-sm rounded-lg hover:bg-red-50 transition"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {booking.status === 'completed' && viewAs === 'learner' && (
                    <Link
                      href={`/review/${booking.id}`}
                      className="px-3 py-1.5 border border-indigo-600 text-indigo-600 text-sm rounded-lg hover:bg-indigo-50 transition"
                    >
                      Write Review
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {filteredBookings.length === 0 && (
              <div className="px-6 py-12 text-center text-gray-500">No bookings yet.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
