import { z } from 'zod'
import {
  ApiError,
  ensureCsrfCookie,
  getSession as fetchSessionFromApi,
  login as apiLogin,
  logout as apiLogout,
  type LoginResponse,
} from '@/lib/api'
import { AUTH_FLOW_HEADER } from '@/lib/auth-flow/constants'
import { getAuthFlowId, logAuthClientEvent } from '@/lib/auth-flow/client'

const roleSchema = z.enum(['ADMIN', 'MANAGER', 'USER'])

const sessionSchema = z.object({
  authenticated: z.boolean().optional(),
  user: z
    .object({
      id: z.union([z.string(), z.number()]),
      email: z.string().email().nullable().optional(),
      name: z.string().nullable().optional(),
      role: roleSchema.nullable().optional(),
    })
    .nullable()
    .optional(),
})

export type AuthRole = z.infer<typeof roleSchema>

export interface AuthSessionUser {
  id: string
  email: string | null | undefined
  name: string | null | undefined
  role: AuthRole
}

export interface AuthSession {
  user: AuthSessionUser
}

function normalizeRole(role: AuthRole | null | undefined): AuthRole {
  return role && roleSchema.safeParse(role).success ? role : 'ADMIN'
}

export async function fetchSession(): Promise<AuthSession | null> {
  try {
    const payload = await fetchSessionFromApi()
    const parsed = sessionSchema.safeParse(payload)

    if (!parsed.success) {
      logAuthClientEvent({
        stage: 'client.auth.fetch-session.invalid-payload',
        severity: 'warn',
        context: { parsed: parsed.success },
      })
      return null
    }

    if (!parsed.data.authenticated || !parsed.data.user) {
      logAuthClientEvent({
        stage: 'client.auth.fetch-session.unauthenticated',
        severity: 'debug',
      })
      return null
    }

    const rawUser = parsed.data.user
    const normalizedUser: AuthSessionUser = {
      id: String(rawUser.id),
      email: rawUser.email ?? null,
      name: rawUser.name ?? null,
      role: normalizeRole(rawUser.role ?? undefined),
    }

    logAuthClientEvent({
      stage: 'client.auth.fetch-session.success',
      context: {
        userId: normalizedUser.id,
        role: normalizedUser.role,
      },
    })

    return { user: normalizedUser }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      logAuthClientEvent({
        stage: 'client.auth.fetch-session.unauthorized',
        severity: 'debug',
        context: { status: error.status },
      })
      return null
    }

    logAuthClientEvent({
      stage: 'client.auth.fetch-session.error',
      severity: 'error',
      error: error instanceof Error ? { message: error.message, stack: error.stack } : undefined,
    })
    throw error
  }
}

export async function loginRequest(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const flowId = getAuthFlowId()
  const headers = flowId ? { [AUTH_FLOW_HEADER]: flowId } : undefined

  try {
    const result: LoginResponse = await apiLogin(email, password, { headers })
    if (!result.success) {
      logAuthClientEvent({
        stage: 'client.auth.login.failed-result',
        severity: 'warn',
        context: { status: 'application', email },
      })
      return {
        ok: false,
        error: result.error ?? 'Inloggningen misslyckades',
      }
    }

    await ensureCsrfCookie().catch((csrfError) => {
      logAuthClientEvent({
        stage: 'client.auth.login.ensure-csrf.failed',
        severity: 'warn',
        error: csrfError instanceof Error ? { message: csrfError.message, stack: csrfError.stack } : undefined,
      })
    })

    logAuthClientEvent({
      stage: 'client.auth.login.success',
      context: { status: 'ok', email },
    })

    return { ok: true }
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Inloggningen misslyckades'
    logAuthClientEvent({
      stage: 'client.auth.login.error',
      severity: 'error',
      error: error instanceof Error ? { message: error.message, stack: error.stack } : undefined,
    })

    return {
      ok: false,
      error: message,
    }
  }
}

export async function logoutRequest(): Promise<void> {
  const flowId = getAuthFlowId()
  const headers = flowId ? { [AUTH_FLOW_HEADER]: flowId } : undefined

  try {
    await apiLogout({ headers })
    logAuthClientEvent({
      stage: 'client.auth.logout.completed',
    })
  } catch (error) {
    logAuthClientEvent({
      stage: 'client.auth.logout.error',
      severity: 'warn',
      error: error instanceof Error ? { message: error.message, stack: error.stack } : undefined,
    })
  }
}
