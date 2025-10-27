const envBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? ''

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return envBaseUrl
  }

  if (envBaseUrl) {
    return envBaseUrl
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return `http://localhost:${process.env.PORT ?? 3000}`
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
