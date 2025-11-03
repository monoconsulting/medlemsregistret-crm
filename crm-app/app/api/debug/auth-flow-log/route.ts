import { NextResponse, type NextRequest } from 'next/server'

import { logAuthFlowServerEvent, appendAuthFlowLog, getAuthFlowIdFromHeaders } from '@/lib/auth-flow/server'
import type { AuthFlowLogPayload } from '@/lib/auth-flow/constants'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let payload: AuthFlowLogPayload
  try {
    payload = (await request.json()) as AuthFlowLogPayload
  } catch (error) {
    await logAuthFlowServerEvent({
      stage: 'frontend.server.auth-log.invalid-payload',
      severity: 'warn',
      error: error instanceof Error ? { message: error.message, stack: error.stack } : { message: 'Unknown JSON parse error' },
    })
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload' }, { status: 400 })
  }

  const flowId = payload.flowId ?? getAuthFlowIdFromHeaders(request.headers)

  await appendAuthFlowLog({
    ...payload,
    flowId: flowId ?? null,
    source: payload.source ?? 'frontend-client',
    timestamp: payload.timestamp ?? new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}
