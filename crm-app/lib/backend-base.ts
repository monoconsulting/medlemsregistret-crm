/**
 * Utility helpers for resolving the backend origin across runtime contexts.
 * Frontend code should construct API URLs via these functions to avoid
 * duplicating environment handling between client, middleware, and build-time
 * execution.
 */

type UrlLike = string | null | undefined

let cachedBaseUrl: string | undefined

function normalize(value: UrlLike): string {
  if (!value) return ""
  const trimmed = value.trim()
  if (!trimmed) return ""
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed
}

function pickEnvBase(): string {
  const candidates: UrlLike[] = [
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NEXT_PRIVATE_API_BASE_URL,
    process.env.API_BASE_URL,
    process.env.BACKEND_API_BASE_URL,
    process.env.BACKEND_INTERNAL_URL,
  ]

  for (const candidate of candidates) {
    const normalized = normalize(candidate)
    if (normalized) return normalized
  }

  return ""
}

function defaultServerBase(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  const port = process.env.PORT ?? "3000"
  return `http://localhost:${port}`
}

export function getBackendBaseUrl(): string {
  if (cachedBaseUrl !== undefined) {
    return cachedBaseUrl
  }

  const envBase = pickEnvBase()
  if (envBase) {
    cachedBaseUrl = envBase
    return envBase
  }

  if (typeof window === "undefined") {
    const serverBase = defaultServerBase()
    cachedBaseUrl = serverBase
    return serverBase
  }

  // Client-side: Force HTTPS in production
  const clientBase = window.location.origin
  if (window.location.hostname === "crm.medlemsregistret.se") {
    cachedBaseUrl = "https://crm.medlemsregistret.se"
    return cachedBaseUrl
  }

  cachedBaseUrl = clientBase
  return clientBase
}

export function setBackendBaseUrl(value: UrlLike): void {
  const normalized = normalize(value)
  if (!normalized) {
    cachedBaseUrl = ""
    return
  }
  cachedBaseUrl = normalized
}

export function resolveBackendUrl(path: string): string {
  const base = getBackendBaseUrl()
  if (!base) {
    return path.startsWith("/") ? path : `/${path}`
  }

  if (!path.startsWith("/")) {
    return `${base}/${path}`
  }

  return `${base}${path}`
}
