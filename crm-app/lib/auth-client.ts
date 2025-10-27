import { z } from 'zod'
import { resolveApiUrl } from '@/lib/api-base'

const roleSchema = z.enum(['ADMIN', 'MANAGER', 'USER'])

const sessionSchema = z.object({
  user: z
    .object({
      id: z.string(),
      email: z.string().nullable().optional(),
      name: z.string().nullable().optional(),
      role: roleSchema,
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

export interface AuthError {
  error?: string
}

export async function fetchSession(): Promise<AuthSession | null> {
  const response = await fetch(resolveApiUrl('/api/auth/me'), {
    credentials: 'include',
  })

  if (!response.ok) {
    return null
  }

  const payload = await response.json()
  const parsed = sessionSchema.safeParse(payload)
  if (!parsed.success || !parsed.data.user) {
    return null
  }

  return { user: parsed.data.user }
}

export async function loginRequest(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch(resolveApiUrl('/api/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })

  if (response.ok) {
    return { ok: true }
  }

  const data = (await response.json().catch(() => null)) as AuthError | null
  return {
    ok: false,
    error: data?.error ?? 'Inloggningen misslyckades',
  }
}

export async function logoutRequest(): Promise<void> {
  await fetch(resolveApiUrl('/api/auth/logout'), {
    method: 'POST',
    credentials: 'include',
  })
}
