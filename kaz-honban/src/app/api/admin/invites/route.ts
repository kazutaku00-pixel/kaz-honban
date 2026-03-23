import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const result = await verifyAdmin();
    if (!result.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("teacher_invites")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invites: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await verifyAdmin();
    if (!result.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email } = await request.json();
    const supabase = createServiceRoleClient();

    const code = crypto.randomUUID().slice(0, 8).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data, error } = await supabase
      .from("teacher_invites")
      .insert({
        invite_code: code,
        email: email?.trim() || null,
        created_by: result.userId,
        expires_at: expiresAt.toISOString(),
      } as never)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invite: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const result = await verifyAdmin();
    if (!result.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("teacher_invites")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
