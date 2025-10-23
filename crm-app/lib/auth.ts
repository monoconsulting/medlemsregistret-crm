import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/password'
import { Role, type User as PrismaUser } from '@prisma/client'
import { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getServerSession } from 'next-auth'

function sanitizeUser(user: PrismaUser) {
  return {
    id: user.id,
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    role: user.role,
    image: user.image ?? undefined,
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-post', type: 'email' },
        password: { label: 'Lösenord', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Ange e-post och lösenord')
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user?.passwordHash) {
          return null
        }

        const isValid = await verifyPassword(credentials.password, user.passwordHash)

        if (!isValid) {
          return null
        }

        return sanitizeUser(user)
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: Role }).role ?? Role.USER
        token.id = (user as { id?: string }).id ?? token.id
      }

      if (token.sub && !token.role) {
        const dbUser = await db.user.findUnique({ where: { id: token.sub } })
        if (dbUser) {
          token.role = dbUser.role
          token.name = dbUser.name ?? token.name
          token.email = dbUser.email ?? token.email
          if (dbUser.image) {
            token.picture = dbUser.image
          }
        }
      }

      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = (token.role as Role) ?? Role.USER
        if (token.email) session.user.email = token.email as string
        if (token.name) session.user.name = token.name as string
        if (token.picture) session.user.image = token.picture as string
      }

      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export const getServerAuthSession = () => getServerSession(authOptions)
