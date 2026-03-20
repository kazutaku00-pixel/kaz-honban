import { createServiceRoleClient } from "@/lib/supabase/server";
import { Users, GraduationCap, CalendarDays, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

export default async function AdminDashboardPage() {
  const admin = createServiceRoleClient();

  const [
    { count: totalUsers },
    { count: activeTeachers },
    { count: totalBookings },
    { count: bookingsThisMonth },
    { data: avgRatingData },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin
      .from("teacher_profiles")
      .select("*", { count: "exact", head: true })
      .eq("approval_status", "approved"),
    admin.from("bookings").select("*", { count: "exact", head: true }),
    admin
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte(
        "created_at",
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      ),
    admin.from("reviews").select("rating"),
  ]);

  const ratings = (avgRatingData as unknown as { rating: number }[] | null) ?? [];
  const avgRating =
    ratings.length > 0
      ? (
          ratings.reduce((sum, r) => sum + r.rating, 0) /
          ratings.length
        ).toFixed(1)
      : "—";

  const stats: StatCard[] = [
    {
      label: "Total Users",
      value: totalUsers ?? 0,
      icon: Users,
      color: "text-accent",
    },
    {
      label: "Active Teachers",
      value: activeTeachers ?? 0,
      icon: GraduationCap,
      color: "text-gold",
    },
    {
      label: "Total Bookings",
      value: totalBookings ?? 0,
      icon: CalendarDays,
      color: "text-accent",
    },
    {
      label: "Bookings This Month",
      value: bookingsThisMonth ?? 0,
      icon: CalendarDays,
      color: "text-green-400",
    },
  ];

  return (
    <div className="md:ml-56">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-bg-secondary rounded-xl border border-border p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <stat.icon size={18} className={stat.color} />
              <span className="text-xs text-text-muted font-medium">
                {stat.label}
              </span>
            </div>
            <span className="text-2xl font-bold text-text-primary">
              {stat.value}
            </span>
          </div>
        ))}

        {/* Average Rating card — spans full width on mobile */}
        <div className="col-span-2 bg-bg-secondary rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Star size={18} className="text-gold" />
            <span className="text-xs text-text-muted font-medium">
              Avg Rating
            </span>
          </div>
          <span className="text-2xl font-bold text-text-primary">
            {avgRating}
          </span>
          <span className="text-xs text-text-muted">
            ({avgRatingData?.length ?? 0} reviews)
          </span>
        </div>
      </div>
    </div>
  );
}
