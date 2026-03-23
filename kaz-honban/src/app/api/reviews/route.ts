import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { reviewSchema } from "@/lib/validations";
import { notifyReviewReceived } from "@/lib/notifications";
import type { Booking } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const authClient = await createServerSupabaseClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { booking_id, rating, comment } = parsed.data;

    // Use service role for DB operations (learner can't update teacher_profiles via RLS)
    const supabase = createServiceRoleClient();

    // Fetch booking
    const { data: bookingRaw, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (fetchError || !bookingRaw) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookingRaw as unknown as Booking;

    // Verify user is the learner
    if (booking.learner_id !== user.id) {
      return NextResponse.json(
        { error: "Only the learner can review this booking" },
        { status: 403 }
      );
    }

    // Verify booking is completed
    if (booking.status !== "completed") {
      return NextResponse.json(
        { error: "Can only review completed bookings" },
        { status: 400 }
      );
    }

    // Check for existing review
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("booking_id", booking_id)
      .eq("reviewer_id", user.id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this booking" },
        { status: 409 }
      );
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .insert({
        booking_id,
        reviewer_id: user.id,
        reviewee_id: booking.teacher_id,
        rating,
        comment: comment ?? null,
      } as never)
      .select()
      .single();

    if (reviewError) {
      return NextResponse.json(
        { error: "Failed to create review" },
        { status: 500 }
      );
    }

    // Update teacher avg_rating and review_count
    const { data: allReviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("reviewee_id", booking.teacher_id)
      .eq("status", "published");

    if (allReviews && allReviews.length > 0) {
      const ratings = allReviews.map((r) => (r as unknown as { rating: number }).rating);
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      await supabase
        .from("teacher_profiles")
        .update({
          avg_rating: Math.round(avg * 100) / 100,
          review_count: ratings.length,
        } as never)
        .eq("user_id", booking.teacher_id);
    }

    // Notify teacher
    const { data: learnerProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    const learnerName = (learnerProfile as unknown as { display_name: string } | null)?.display_name ?? "A student";
    await notifyReviewReceived(supabase, booking.teacher_id, learnerName, rating);

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    console.error("POST /api/reviews error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
