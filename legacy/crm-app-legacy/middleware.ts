import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { AUTH_FLOW_HEADER } from "@/lib/auth-flow/constants"
import { fetchBackendWithFallback } from "@/lib/backend-base"

const PUBLIC_ROUTES = ["/login", "/unauthorized", "/", "/api/health", "/api/debug", "/public", "/_next", "/static", "/favicon.ico"]

interface SessionResponse {
  user?: {
    id: string
    role?: string | null
  } | null
}

async function fetchBackendSession(req: NextRequest) {
  const cookie = req.headers.get("cookie")
  if (!cookie) {
    return null
  }

  const flowId =
    req.headers.get(AUTH_FLOW_HEADER) ??
    req.headers.get(AUTH_FLOW_HEADER.toLowerCase()) ??
    null

  try {
    const { response } = await fetchBackendWithFallback('/api/auth/me', {
      cache: 'no-store',
      headers: {
        cookie,
        ...(flowId ? { "X-Auth-Flow-Id": flowId } : {}),
      },
    })

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as SessionResponse
    if (!data?.user) {
      return null
    }

    return data.user
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

  const user = await fetchBackendSession(req)
  if (!user) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("redirectTo", pathname)
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
