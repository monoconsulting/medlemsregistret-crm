import { z } from 'zod'
import { resolveApiUrl } from '@/lib/api-base'
import { ensureCsrfToken } from '@/lib/csrf'
import { CSRF_HEADER_NAME } from '@/lib/security/constants'

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

  const u = parsed.data.user
  const normalizedUser: AuthSessionUser = {
    id: u.id,
    role: u.role,
    email: u.email ?? null,
    name: u.name ?? null,
  }

  return { user: normalizedUser }

}

async function buildCsrfHeaders(baseHeaders?: HeadersInit): Promise<HeadersInit> {
  const headers = new Headers(baseHeaders)
  const token = await ensureCsrfToken(() =>
    fetch(resolveApiUrl('/api/auth/me'), {
      credentials: 'include',
    }),
  )

  if (token) {
    headers.set(CSRF_HEADER_NAME, token)
  }

  return headers
}

export async function loginRequest(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const headers = await buildCsrfHeaders({
    'Content-Type': 'application/json',
  })

  const response = await fetch(resolveApiUrl('/api/auth/login'), {
    method: 'POST',
    headers,
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
  const headers = await buildCsrfHeaders()

  await fetch(resolveApiUrl('/api/auth/logout'), {
    method: 'POST',
    headers,
    credentials: 'include',
  })
}
