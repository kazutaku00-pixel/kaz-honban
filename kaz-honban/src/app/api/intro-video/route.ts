import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const BUCKET = "videos";

export async function POST(request: NextRequest) {
  try {
    const authClient = await createServerSupabaseClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a teacher
    const supabase = createServiceRoleClient();
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "teacher")
      .single();

    if (!role) {
      return NextResponse.json({ error: "Teacher role required" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Use MP4, WebM, or MOV." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 50MB." },
        { status: 400 }
      );
    }

    // Generate file path
    const ext = file.type === "video/quicktime" ? "mov" : file.name.split(".").pop() || "mp4";
    const filePath = `${user.id}/intro.${ext}`;

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Video upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload video" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    const videoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Update teacher profile
    const { error: updateError } = await supabase
      .from("teacher_profiles")
      .update({ intro_video_url: videoUrl } as never)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ video_url: videoUrl });
  } catch (err) {
    console.error("POST /api/intro-video error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authClient = await createServerSupabaseClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Remove files from storage
    const { data: files } = await supabase.storage
      .from(BUCKET)
      .list(user.id);

    if (files && files.length > 0) {
      const filePaths = files
        .filter((f) => f.name.startsWith("intro."))
        .map((f) => `${user.id}/${f.name}`);

      if (filePaths.length > 0) {
        await supabase.storage.from(BUCKET).remove(filePaths);
      }
    }

    // Clear URL in teacher profile
    await supabase
      .from("teacher_profiles")
      .update({ intro_video_url: null } as never)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/intro-video error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
