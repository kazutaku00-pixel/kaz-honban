import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const role = searchParams.get("role"); // "learner" | "teacher"
  const invite = searchParams.get("invite");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Use service role for DB writes (RLS may block some inserts/updates)
        const adminDb = createServiceRoleClient();

        // Check if user already has a role
        const { data: existingRoles } = await adminDb
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (role && (!existingRoles || existingRoles.length === 0)) {
          // New user — assign role
          await adminDb
            .from("user_roles")
            .insert({ user_id: user.id, role } as never);

          if (role === "learner") {
            await adminDb
              .from("learner_profiles")
              .insert({ user_id: user.id } as never);
            return NextResponse.redirect(`${origin}/teachers`);
          } else if (role === "teacher") {
            if (invite) {
              await adminDb
                .from("teacher_invites")
                .update({ used_by: user.id, used_at: new Date().toISOString() } as never)
                .eq("invite_code", invite)
                .is("used_by", null);
            }
            await adminDb
              .from("teacher_profiles")
              .insert({ user_id: user.id } as never);
            return NextResponse.redirect(`${origin}/teacher/profile`);
          }
        } else if (existingRoles && existingRoles.length > 0) {
          // Returning user — redirect based on existing role
          const userRole = (existingRoles[0] as { role: string }).role;
          if (userRole === "teacher") {
            return NextResponse.redirect(`${origin}/teacher/dashboard`);
          }
          return NextResponse.redirect(`${origin}/dashboard`);
        }
      }

      // Fallback: no role yet
      return NextResponse.redirect(`${origin}/role-select`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
