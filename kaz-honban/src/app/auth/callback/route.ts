import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

      if (user && role) {
        // Check if user already has a role (returning user via OAuth)
        const { data: existingRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (!existingRoles || existingRoles.length === 0) {
          // New user — assign role
          await supabase
            .from("user_roles")
            .insert({ user_id: user.id, role });

          if (role === "learner") {
            await supabase
              .from("learner_profiles")
              .insert({ user_id: user.id });
            return NextResponse.redirect(`${origin}/teachers`);
          } else if (role === "teacher") {
            if (invite) {
              await supabase
                .from("teacher_invites")
                .update({ used_by: user.id, used_at: new Date().toISOString() })
                .eq("invite_code", invite)
                .is("used_by", null);
            }
            await supabase
              .from("teacher_profiles")
              .insert({ user_id: user.id });
            return NextResponse.redirect(`${origin}/teacher/profile`);
          }
        } else {
          // Returning user — redirect based on existing role
          const userRole = (existingRoles[0] as { role: string }).role;
          if (userRole === "teacher") {
            return NextResponse.redirect(`${origin}/teacher/dashboard`);
          }
          return NextResponse.redirect(`${origin}/dashboard`);
        }
      }

      // Returning user without role param — check existing role
      if (user) {
        const { data: existingRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (existingRoles && existingRoles.length > 0) {
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
