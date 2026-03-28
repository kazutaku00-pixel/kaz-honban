import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const role = searchParams.get("role"); // "learner" | "teacher"
  const invite = searchParams.get("invite");
  const tabIsolated = process.env.NEXT_PUBLIC_TAB_ISOLATED_AUTH === "true";

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
            // In tab-isolated mode, still set cookies temporarily for the
            // code exchange to work, but we'll clear them after.
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: session, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      let redirectPath = "/role-select";

      if (user) {
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
            redirectPath = "/teachers";
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
            redirectPath = "/teacher/profile";
          }
        } else if (existingRoles && existingRoles.length > 0) {
          const userRole = (existingRoles[0] as { role: string }).role;
          redirectPath = userRole === "teacher" ? "/teacher/dashboard" : "/dashboard";
        }
      }

      // In tab-isolated mode, pass tokens via URL hash so the client-side
      // sessionStorage picks them up instead of relying on shared cookies.
      if (tabIsolated && session?.session) {
        const { access_token, refresh_token } = session.session;
        // Clear the auth cookies so they don't leak to other tabs
        const allCookies = cookieStore.getAll();
        for (const c of allCookies) {
          if (c.name.startsWith("sb-")) {
            cookieStore.set(c.name, "", { maxAge: 0 });
          }
        }
        // Redirect with tokens in hash fragment (never sent to server)
        return NextResponse.redirect(
          `${origin}/auth/session-init#access_token=${access_token}&refresh_token=${refresh_token}&redirect=${encodeURIComponent(redirectPath)}`
        );
      }

      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
