import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prismaAdapter } from "@/lib/auth-prisma-adapter"
import { createHash, timingSafeEqual } from "crypto"
import { z } from "zod"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const hashPassword = (password: string) =>
  createHash("sha256").update(password).digest("hex")

const verifyPassword = (password: string, hash: string) => {
  const computed = Buffer.from(hashPassword(password))
  const stored = Buffer.from(hash)
  return computed.length === stored.length && timingSafeEqual(computed, stored)
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  providers: [
    Credentials({
      name: "Email", // Display label
      credentials: {
        email: { label: "E-post", type: "email", placeholder: "namn@förening.se" },
        password: { label: "Lösenord", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials)
        if (!parsed.success) {
          return null
        }

        const { email, password } = parsed.data
        const user = await db.user.findUnique({ where: { email } })
        if (!user || !user.passwordHash) {
          return null
        }

        const isValid = verifyPassword(password, user.passwordHash)
        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token, user }) {
      const id = user?.id ?? (token?.id as string | undefined)
      const role = (user?.role ?? (token?.role as UserRole | undefined)) ?? UserRole.USER

      if (session.user && id) {
        session.user.id = id
        session.user.role = role
      }

      return session
    },
    authorized({ request, auth }) {
      const pathname = request.nextUrl.pathname

      const isAuthRoute = pathname.startsWith("/api/auth")
      const isPublicRoute =
        pathname === "/login" ||
        pathname === "/" ||
        pathname.startsWith("/api/health") ||
        pathname.startsWith("/public") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/static") ||
        pathname.startsWith("/favicon.ico")

      if (isAuthRoute || isPublicRoute) {
        return true
      }

      if (!auth?.user) {
        return false
      }

      return true
    },
  },
})
