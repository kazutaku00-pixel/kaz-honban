import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const protectedPaths = ["/dashboard", "/teacher", "/admin", "/bookings", "/booking", "/history", "/favorites", "/settings", "/room"];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users from auth pages (except role-select) to their dashboard
  const authPaths = ["/login", "/signup"];
  const isAuthPage = authPaths.some((p) => request.nextUrl.pathname.startsWith(p));

  if (isAuthPage && user) {
    // Check user role and redirect to appropriate dashboard
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const url = request.nextUrl.clone();
    if (roles && roles.length > 0) {
      const role = (roles[0] as { role: string }).role;
      url.pathname = role === "teacher" ? "/teacher/dashboard" : "/dashboard";
    } else {
      url.pathname = "/role-select";
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
