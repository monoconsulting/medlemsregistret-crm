import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
const PUBLIC_ROUTES = ["/login", "/unauthorized", "/", "/api/health", "/api/debug", "/public", "/_next", "/static", "/favicon.ico"]

interface PhpSessionResponse {
  authenticated: boolean
  uid?: number
}

async function fetchPhpSession(req: NextRequest) {
  const cookie = req.headers.get("cookie")
  if (!cookie) {
    return null
  }

  try {
    const sessionUrl = new URL('/api/session.php', req.url)
    const response = await fetch(sessionUrl, {
      cache: 'no-store',
      headers: {
        cookie,
      },
    })

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as PhpSessionResponse
    if (!data?.authenticated || !data.uid) {
      return null
    }

    return { id: String(data.uid), role: 'ADMIN' as const }
  } catch (error) {
    return null
  }
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublicRoute = PUBLIC_ROUTES.some((route) => {
    if (route === "/") {
      return pathname === "/"
    }
    return pathname === route || pathname.startsWith(`${route}/`)
  })

  if (isPublicRoute) {
    return NextResponse.next()
  }

  const user = await fetchPhpSession(req)
  if (!user) {
    const loginUrl = new URL("/login", req.url)
    const target = `${pathname}${req.nextUrl.search}`
    loginUrl.searchParams.set("redirectTo", target)
    return NextResponse.redirect(loginUrl)
  }

  const role = (user.role ?? "USER").toString()

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  if (pathname.startsWith("/stats") && !["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
  runtime: "nodejs",
}
