import { appendFile, mkdir } from 'node:fs/promises'
import fs from 'node:fs'
import path from 'node:path'

import { AUTH_FLOW_HEADER, type AuthFlowLogPayload } from '@/lib/auth-flow/constants'

const LOG_DIRECTORY = path.resolve(process.cwd(), '..', 'logs')
const LOG_FILE = path.join(LOG_DIRECTORY, 'auth-flow.log')

let ensurePromise: Promise<void> | null = null

async function ensureLogFile(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await mkdir(LOG_DIRECTORY, { recursive: true })
      if (!fs.existsSync(LOG_FILE)) {
        await appendFile(LOG_FILE, '', 'utf8')
      }
    })()
  }

  await ensurePromise
}

function buildLine(payload: AuthFlowLogPayload): string {
  const enriched: AuthFlowLogPayload = {
    severity: 'info',
    ...payload,
    timestamp: payload.timestamp ?? new Date().toISOString(),
  }

  return `${JSON.stringify(enriched)}\n`
}

export async function appendAuthFlowLog(payload: AuthFlowLogPayload): Promise<void> {
  try {
    await ensureLogFile()
    await appendFile(LOG_FILE, buildLine(payload), 'utf8')
  } catch (error) {
    console.error('[auth-flow] Failed to append log entry:', error)
  }
}

export function getAuthFlowIdFromHeaders(headers: Headers | Record<string, string | string[] | undefined>): string | null {
  const headerName = AUTH_FLOW_HEADER.toLowerCase()

  if (headers instanceof Headers) {
    return headers.get(AUTH_FLOW_HEADER) ?? headers.get(headerName)
  }

  const possible = headers[AUTH_FLOW_HEADER] ?? headers[headerName]
  if (!possible) {
    return null
  }

  if (Array.isArray(possible)) {
    return possible[0] ?? null
  }

  return typeof possible === 'string' ? possible : null
}

interface ServerLogOptions {
  stage: string
  severity?: AuthFlowLogPayload['severity']
  flowId?: string | null
  context?: Record<string, unknown>
  error?: { message: string; stack?: string }
}

export async function logAuthFlowServerEvent(options: ServerLogOptions): Promise<void> {
  await appendAuthFlowLog({
    source: 'frontend-server',
    stage: options.stage,
    severity: options.severity ?? 'info',
    flowId: options.flowId ?? null,
    context: options.context,
    error: options.error,
  })
}

export const AUTH_FLOW_LOG_FILE = LOG_FILE
