import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

const PUBLIC_ROUTES = ["/login", "/unauthorized", "/", "/api/health", "/public", "/_next", "/static", "/favicon.ico"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) => {
    if (route === "/") {
      return pathname === "/"
    }
    return pathname === route || pathname.startsWith(`${route}/`)
  })

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Redirect to login if not authenticated
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = session.user.role ?? "USER"

  // Check admin routes
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  // Check stats routes
  if (pathname.startsWith("/stats") && !["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
  runtime: "nodejs",
}
