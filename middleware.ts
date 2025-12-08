import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") || "";

  // Handle pay.visagify.com subdomain
  // Route payment subdomain to (pay) route group
  if (hostname.startsWith("pay.")) {
    const url = req.nextUrl.clone();

    // Rewrite root to /buy for pay subdomain
    if (url.pathname === "/") {
      url.pathname = "/buy";
      return NextResponse.rewrite(url);
    }

    // Payment routes don't need authentication
    // Just allow them through
    if (
      url.pathname.startsWith("/buy") ||
      url.pathname.startsWith("/payment") ||
      url.pathname.startsWith("/api/stripe")
    ) {
      return NextResponse.next();
    }

    // Redirect any other pay subdomain routes to main payment page
    return NextResponse.redirect(new URL("/", req.url));
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes that require authentication
  const protectedPaths = ["/dashboard", "/admin"];
  const isProtectedPath = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  // Admin routes that require admin role
  const adminPaths = ["/admin"];
  const isAdminPath = adminPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Check admin role for admin paths
  if (isAdminPath && session) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard/faces", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
