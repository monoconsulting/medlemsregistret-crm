import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
const ADMIN_ROLES = ['ADMIN', 'MANAGER'] as const

type TokenWithRole = {
  role?: string
}

export default withAuth(
  function middleware() {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (!token) {
          return false
        }

        const pathname = req.nextUrl.pathname
        const role = (token as TokenWithRole).role

        if (pathname.startsWith('/admin')) {
          return !!role && ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api/auth|api/trpc|_next/static|_next/image|favicon.ico|auth/signin|auth/error).*)',
  ],
}
