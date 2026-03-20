import { createServiceRoleClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { BookingStatusChanger } from "@/components/admin/booking-status-changer";
import type { BookingStatus } from "@/types/database";

interface SearchParams {
  status?: string;
}

const STATUS_COLORS: Record<BookingStatus, string> = {
  confirmed: "bg-blue-500/20 text-blue-400",
  in_session: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
  no_show: "bg-orange-500/20 text-orange-400",
};

const ALL_STATUSES: BookingStatus[] = [
  "confirmed",
  "in_session",
  "completed",
  "cancelled",
  "no_show",
];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { status } = await searchParams;
  const admin = createServiceRoleClient();

  let query = admin
    .from("bookings")
    .select(
      "*, learner:profiles!bookings_learner_id_fkey(display_name, email), teacher:profiles!bookings_teacher_id_fkey(display_name, email)"
    )
    .order("scheduled_start_at", { ascending: false })
    .limit(100);

  if (status && ALL_STATUSES.includes(status as BookingStatus)) {
    query = query.eq("status", status);
  }

  const { data: bookingsRaw, error } = await query;
  const bookings = bookingsRaw as unknown as {
    id: string;
    learner_id: string;
    teacher_id: string;
    scheduled_start_at: string;
    duration_minutes: number;
    status: string;
    learner: { display_name: string; email: string } | null;
    teacher: { display_name: string; email: string } | null;
  }[] | null;

  return (
    <div className="md:ml-56">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        Bookings Management
      </h1>

      {/* Status filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <a
          href="/admin/bookings"
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
            !status
              ? "bg-accent text-white"
              : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
          )}
        >
          All
        </a>
        {ALL_STATUSES.map((s) => (
          <a
            key={s}
            href={`/admin/bookings?status=${s}`}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
              status === s
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            )}
          >
            {s.replace("_", " ")}
          </a>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm mb-4">
          Failed to load bookings: {error.message}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block bg-bg-secondary rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-medium">Learner</th>
              <th className="text-left px-4 py-3 font-medium">Teacher</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Duration</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-center px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookings?.map((booking) => {
              const learner = booking.learner;
              const teacher = booking.teacher;

              return (
                <tr key={booking.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-text-primary">
                    {learner?.display_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {teacher?.display_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {new Date(booking.scheduled_start_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {booking.duration_minutes}min
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase",
                        STATUS_COLORS[booking.status as BookingStatus]
                      )}
                    >
                      {booking.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <BookingStatusChanger
                      bookingId={booking.id}
                      currentStatus={booking.status as BookingStatus}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {bookings?.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            No bookings found.
          </div>
        )}
        {bookings?.map((booking) => {
          const learner = booking.learner as unknown as {
            display_name: string;
            email: string;
          };
          const teacher = booking.teacher as unknown as {
            display_name: string;
            email: string;
          };

          return (
            <div
              key={booking.id}
              className="bg-bg-secondary rounded-xl border border-border p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase",
                    STATUS_COLORS[booking.status as BookingStatus]
                  )}
                >
                  {booking.status?.replace("_", " ")}
                </span>
                <span className="text-[10px] text-text-muted">
                  {booking.duration_minutes}min
                </span>
              </div>
              <div className="text-sm">
                <div className="text-text-primary">
                  <span className="text-text-muted">Learner:</span>{" "}
                  {learner?.display_name || "—"}
                </div>
                <div className="text-text-secondary">
                  <span className="text-text-muted">Teacher:</span>{" "}
                  {teacher?.display_name || "—"}
                </div>
              </div>
              <div className="text-xs text-text-muted">
                {new Date(booking.scheduled_start_at).toLocaleString()}
              </div>
              <BookingStatusChanger
                bookingId={booking.id}
                currentStatus={booking.status as BookingStatus}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
