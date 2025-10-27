import type { Adapter, AdapterSession, AdapterUser, AdapterAccount, VerificationToken } from 'next-auth/adapters'
import type { PrismaClient } from '@prisma/client'
import { db } from './db'

type PrismaAdapterClient = Pick<
  PrismaClient,
  'user' | 'account' | 'session' | 'verificationToken'
>

export function prismaAdapter(client: PrismaAdapterClient = db): Adapter {
  return {
    async createUser(user) {
      const created = await client.user.create({ data: user })
      return created as AdapterUser
    },
    async getUser(id) {
      if (!id) return null
      const user = await client.user.findUnique({ where: { id } })
      return (user as AdapterUser) ?? null
    },
    async getUserByEmail(email) {
      if (!email) return null
      const user = await client.user.findUnique({ where: { email } })
      return (user as AdapterUser) ?? null
    },
    async getUserByAccount(account) {
      const dbAccount = await client.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        include: {
          user: true,
        },
      })
      if (!dbAccount) return null
      return dbAccount.user as AdapterUser
    },
    async updateUser(user) {
      if (!user.id) throw new Error('User id is required to update user')
      const updated = await client.user.update({
        where: { id: user.id },
        data: user,
      })
      return updated as AdapterUser
    },
    async deleteUser(id) {
      if (!id) return null
      const deleted = await client.user.delete({ where: { id } })
      return deleted as AdapterUser
    },
    async linkAccount(account) {
      await client.account.create({
        data: account as AdapterAccount,
      })
      return account
    },
    async unlinkAccount(account) {
      await client.account.delete({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
      })
    },
    async createSession(session) {
      const created = await client.session.create({ data: session })
      return created as AdapterSession
    },
    async getSessionAndUser(sessionToken) {
      const session = await client.session.findUnique({
        where: { sessionToken },
        include: {
          user: true,
        },
      })
      if (!session) return null
      const { user, ...sessionData } = session
      return {
        session: sessionData as AdapterSession,
        user: user as AdapterUser,
      }
    },
    async updateSession(session) {
      const updated = await client.session.update({
        where: { sessionToken: session.sessionToken },
        data: session,
      })
      return updated as AdapterSession
    },
    async deleteSession(sessionToken) {
      try {
        await client.session.delete({ where: { sessionToken } })
      } catch (error) {
        return null
      }
      return null
    },
    async createVerificationToken(token) {
      const created = await client.verificationToken.create({ data: token })
      return created as VerificationToken
    },
    async useVerificationToken(token) {
      try {
        const deleted = await client.verificationToken.delete({
          where: {
            identifier_token: {
              identifier: token.identifier,
              token: token.token,
            },
          },
        })
        return deleted as VerificationToken
      } catch (error) {
        return null
      }
    },
  }
}
