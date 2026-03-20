import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: favorites, error } = await supabase
      .from("favorites")
      .select(
        `*, teacher_profile:teacher_profiles!favorites_teacher_id_fkey(*, profile:profiles!teacher_profiles_user_id_fkey(*))`
      )
      .eq("learner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ favorites });
  } catch (err) {
    console.error("GET /api/favorites error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teacher_id } = await request.json();
    if (!teacher_id) {
      return NextResponse.json({ error: "teacher_id required" }, { status: 400 });
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("learner_id", user.id)
      .eq("teacher_id", teacher_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Already favorited" }, { status: 409 });
    }

    const { data: favorite, error } = await supabase
      .from("favorites")
      .insert({
        learner_id: user.id,
        teacher_id,
      } as never)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
    }

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (err) {
    console.error("POST /api/favorites error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teacher_id } = await request.json();
    if (!teacher_id) {
      return NextResponse.json({ error: "teacher_id required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("learner_id", user.id)
      .eq("teacher_id", teacher_id);

    if (error) {
      return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/favorites error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
