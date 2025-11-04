import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prismaAdapter } from "./auth-prisma-adapter"
import * as bcrypt from "bcryptjs"
import { createHash, timingSafeEqual } from "crypto"
import { z } from "zod"
import { db } from "./db"
import { UserRole } from "@prisma/client"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

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
        const user = await db.user.findUnique({
          where: { email, isDeleted: false }
        })
        if (!user || !user.passwordHash) {
          return null
        }

        const passwordHash = user.passwordHash
        let isValid = false
        let needsRehash = false

        if (isBcryptHash(passwordHash)) {
          isValid = await bcrypt.compare(password, passwordHash)
        } else if (isLegacySha256Hash(passwordHash)) {
          const storedBuffer = Buffer.from(passwordHash, "hex")
          const candidateBuffer = createHash("sha256").update(password).digest()

          if (storedBuffer.length === candidateBuffer.length && timingSafeEqual(storedBuffer, candidateBuffer)) {
            isValid = true
            needsRehash = true
          }
        }

        if (!isValid) {
          return null
        }

        if (needsRehash) {
          try {
            const upgradedHash = await bcrypt.hash(password, 10)
            await db.user.update({
              where: { id: user.id },
              data: { passwordHash: upgradedHash },
            })
          } catch (error) {
            console.warn(`[auth] Failed to upgrade password hash for user ${user.id}:`, error)
          }
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

const BCRYPT_PREFIXES = ["$2a$", "$2b$", "$2y$"]
const LEGACY_SHA256_REGEX = /^[a-f0-9]{64}$/i

function isBcryptHash(hash: string) {
  return BCRYPT_PREFIXES.some((prefix) => hash.startsWith(prefix))
}

function isLegacySha256Hash(hash: string) {
  return LEGACY_SHA256_REGEX.test(hash)
}
