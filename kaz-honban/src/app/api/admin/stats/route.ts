import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const result = await verifyAdmin();
  if (!result.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        ).toISOString()
      ),
    admin.from("reviews").select("rating"),
  ]);

  const ratings = (avgRatingData as unknown as { rating: number }[] | null) ?? [];
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : null;

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    activeTeachers: activeTeachers ?? 0,
    totalBookings: totalBookings ?? 0,
    bookingsThisMonth: bookingsThisMonth ?? 0,
    avgRating,
    reviewCount: avgRatingData?.length ?? 0,
  });
}
