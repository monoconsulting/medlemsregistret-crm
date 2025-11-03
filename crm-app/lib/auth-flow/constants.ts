export const AUTH_FLOW_HEADER = 'X-Auth-Flow-Id'

export type AuthFlowSeverity = 'debug' | 'info' | 'warn' | 'error'

export interface AuthFlowLogPayload {
  timestamp?: string
  source?: string
  flowId?: string | null
  stage: string
  severity?: AuthFlowSeverity
  context?: Record<string, unknown>
  error?: { message: string; stack?: string }
}
