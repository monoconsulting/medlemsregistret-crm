import { AUTH_FLOW_HEADER, type AuthFlowLogPayload, type AuthFlowSeverity } from '@/lib/auth-flow/constants'

let cachedFlowId: string | null | undefined

function generateFlowId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`
}

export function getAuthFlowId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  if (cachedFlowId !== undefined) {
    return cachedFlowId
  }

  try {
    const existing = window.sessionStorage.getItem('authFlowId')
    if (existing) {
      cachedFlowId = existing
      return cachedFlowId
    }

    const created = generateFlowId()
    window.sessionStorage.setItem('authFlowId', created)
    cachedFlowId = created
    return cachedFlowId
  } catch (_error) {
    cachedFlowId = null
    return cachedFlowId
  }
}

interface LogAuthClientEventOptions {
  stage: string
  severity?: AuthFlowSeverity
  context?: Record<string, unknown>
  error?: Error | { message: string; stack?: string }
}

function normalizeError(error?: Error | { message: string; stack?: string } | null) {
  if (!error) {
    return undefined
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    message: error.message,
    stack: 'stack' in error ? error.stack : undefined,
  }
}

export function logAuthClientEvent(options: LogAuthClientEventOptions): void {
  if (typeof window === 'undefined') {
    return
  }

  const flowId = getAuthFlowId()
  const payload: AuthFlowLogPayload = {
    timestamp: new Date().toISOString(),
    source: 'frontend-client',
    flowId,
    stage: options.stage,
    severity: options.severity ?? 'info',
    context: options.context,
    error: normalizeError(options.error),
  }

  try {
    const json = JSON.stringify(payload)

    if (navigator.sendBeacon) {
      const blob = new Blob([json], { type: 'application/json' })
      const sent = navigator.sendBeacon('/api/debug/auth-flow-log', blob)
      if (sent) {
        return
      }
    }

    void fetch('/api/debug/auth-flow-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AUTH_FLOW_HEADER]: flowId ?? undefined,
      },
      body: json,
      keepalive: true,
    })
  } catch (error) {
    console.warn('[auth-flow] Kunde inte logga händelse:', error)
  }
}
