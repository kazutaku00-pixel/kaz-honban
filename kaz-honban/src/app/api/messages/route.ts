import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const messageSchema = z.object({
  booking_id: z.string().uuid(),
  body: z.string().min(1).max(1000),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json().catch(() => null);
    const parsed = messageSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const { booking_id, body } = parsed.data;

    // Verify this user is a party to the booking — otherwise RLS on insert
    // would silently 403 and the chat would appear broken.
    const { data: booking } = await supabase
      .from("bookings")
      .select("learner_id, teacher_id, status")
      .eq("id", booking_id)
      .single();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const b = booking as unknown as {
      learner_id: string;
      teacher_id: string;
      status: string;
    };
    if (b.learner_id !== user.id && b.teacher_id !== user.id) {
      return NextResponse.json(
        { error: "You are not a party to this booking" },
        { status: 403 }
      );
    }

    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({
        booking_id,
        sender_id: user.id,
        body: body.trim(),
      } as never)
      .select()
      .single();

    if (error) {
      console.error("POST /api/messages insert error:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: inserted }, { status: 201 });
  } catch (err) {
    console.error("POST /api/messages error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
