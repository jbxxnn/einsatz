import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Database } from "@/lib/database.types"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  // Refresh session if expired - but don't block rendering for this
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check auth status for protected routes
  const protectedRoutes = ["/dashboard", "/profile", "/bookings", "/messages", "/settings"]
  const isProtectedRoute = protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route))

  // Public routes that should redirect to dashboard if logged in
  const authRoutes = ["/login", "/register"]
  const isAuthRoute = authRoutes.some((route) => req.nextUrl.pathname === route)

  // Static assets and API routes
  const isStaticOrApi =
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/api") ||
    req.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)

  // Add cache control headers for public pages
  if (!isProtectedRoute && !isAuthRoute && !isStaticOrApi) {
    // Cache public pages for 5 minutes, but allow revalidation
    res.headers.set("Cache-Control", "public, max-age=300, s-maxage=60, stale-while-revalidate=60")
  }

  if (isProtectedRoute && !session) {
    // Redirect to login if accessing protected route without session
    const redirectUrl = new URL("/login", req.url)
    redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && session) {
    // Redirect to dashboard if accessing auth routes with active session
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return res
}

export const config = {
  matcher: [
    // Match all routes except static files, api routes, and _next
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
