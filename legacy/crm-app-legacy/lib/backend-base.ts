
function normalizeBase(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return trimmed
  }
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
}

function ensureProtocol(value: string): string {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }
  return `http://${value}`
}

export async function getBackendBaseCandidates(): Promise<string[]> {
  const candidates = [
    process.env.BACKEND_INTERNAL_URL,
    process.env.BACKEND_API_BASE_URL,
    process.env.NEXT_PRIVATE_API_BASE_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL_DEV,
    process.env.NEXT_PUBLIC_API_BASE_URL_PROD,
    process.env.NEXTAUTH_URL,
    process.env.NEXTAUTH_URL_DEV,
    process.env.NEXTAUTH_URL_PROD,
    process.env.BACKEND_PORT ? `http://localhost:${process.env.BACKEND_PORT}` : null,
    'http://localhost:4040',
  ]

  const seen = new Set<string>()
  const result: string[] = []

  for (const candidate of candidates) {
    if (!candidate) continue
    const normalized = normalizeBase(candidate)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    result.push(normalized)
  }

  return result
}

export async function fetchBackendWithFallback(
  path: string,
  init?: RequestInit,
): Promise<{ baseUrl: string; response: Response }> {
  const candidates = await getBackendBaseCandidates()
  let lastError: unknown = null

  for (const candidate of candidates) {
    const baseUrl = ensureProtocol(candidate)
    const target = path.startsWith('http://') || path.startsWith('https://')
      ? path
      : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`

    if (process.env.NODE_ENV !== 'production') {
      console.log('[backend-base] fetching', target)
    }

    try {
      const response = await fetch(target, init)
      return { baseUrl, response }
    } catch (error) {
      lastError = error
      continue
    }
  }

  if (lastError) {
    throw lastError
  }

  throw new Error('Unable to contact backend API – no candidates succeeded.')
}

