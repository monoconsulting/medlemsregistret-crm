function normalizeBaseUrl(value: string): string {
  return value.replace(/\/$/, '')
}

function computeInitialBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  if (raw && raw.length > 0) {
    return normalizeBaseUrl(raw)
  }

  if (typeof window === 'undefined') {
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`
    }
    return `http://localhost:${process.env.PORT ?? 3000}`
  }

  return ''
}

let currentApiBaseUrl = computeInitialBaseUrl()

export function getApiBaseUrl(): string {
  return currentApiBaseUrl
}

export function setApiBaseUrl(next: string | null | undefined): void {
  if (!next) {
    return
  }

  const normalized = normalizeBaseUrl(next.trim())
  if (!normalized || normalized === currentApiBaseUrl) {
    return
  }

  currentApiBaseUrl = normalized
}

export function resolveApiUrl(path: string): string {
  const base = getApiBaseUrl()
  if (!base) {
    return path
  }

  if (!path.startsWith('/')) {
    return `${base}/${path}`
  }

  return `${base}${path}`
}
