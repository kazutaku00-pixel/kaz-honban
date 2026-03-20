import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { lessonReportSchema } from "@/lib/validations";
import { notifyReportReady } from "@/lib/notifications";
import type { Booking } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = lessonReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { booking_id, template_type, summary, homework, next_recommendation, internal_note } =
      parsed.data;

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

    // Verify user is the teacher
    if (booking.teacher_id !== user.id) {
      return NextResponse.json(
        { error: "Only the teacher can create a report for this booking" },
        { status: 403 }
      );
    }

    // Create report
    const { data: report, error: reportError } = await supabase
      .from("lesson_reports")
      .insert({
        booking_id,
        teacher_id: user.id,
        template_type: template_type ?? null,
        summary: summary ?? null,
        homework: homework ?? null,
        next_recommendation: next_recommendation ?? null,
        internal_note: internal_note ?? null,
      } as never)
      .select()
      .single();

    if (reportError) {
      return NextResponse.json(
        { error: "Failed to create report" },
        { status: 500 }
      );
    }

    // Notify learner that report is ready
    const { data: teacherProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    const teacherName = (teacherProfile as unknown as { display_name: string } | null)?.display_name ?? "Your teacher";
    await notifyReportReady(supabase, booking.learner_id, teacherName, booking.id);

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    console.error("POST /api/lesson-reports error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { report_id, ...fields } = body;

    if (!report_id) {
      return NextResponse.json({ error: "report_id required" }, { status: 400 });
    }

    // Verify ownership
    const { data: existingRaw } = await supabase
      .from("lesson_reports")
      .select("*")
      .eq("id", report_id)
      .single();

    if (!existingRaw) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const existing = existingRaw as unknown as { teacher_id: string };
    if (existing.teacher_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("lesson_reports")
      .update({
        template_type: fields.template_type ?? undefined,
        summary: fields.summary ?? undefined,
        homework: fields.homework ?? undefined,
        next_recommendation: fields.next_recommendation ?? undefined,
        internal_note: fields.internal_note ?? undefined,
      } as never)
      .eq("id", report_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
    }

    return NextResponse.json({ report: updated });
  } catch (err) {
    console.error("PUT /api/lesson-reports error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
