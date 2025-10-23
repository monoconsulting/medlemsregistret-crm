import { NextResponse } from "next/server"
import { withAuth } from "next-auth/middleware"
import type { NextRequestWithAuth } from "next-auth/middleware"

const PUBLIC_ROUTES = ["/login", "/unauthorized", "/", "/api/health", "/public", "/_next", "/static", "/favicon.ico"]

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    if (!token) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(loginUrl)
    }

    const role = (token.role as string | undefined) ?? "USER"

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    if (pathname.startsWith("/stats") && !["ADMIN", "MANAGER"].includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl

        if (
          PUBLIC_ROUTES.some((route) => {
            if (route === "/") {
              return pathname === "/";
            }
            return pathname === route || pathname.startsWith(`${route}/`);
          })
        ) {
          return true
        }

        return !!token
      },
    },
  }
)

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
